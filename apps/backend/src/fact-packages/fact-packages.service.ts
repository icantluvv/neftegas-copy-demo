import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { Notification } from '../notifications/entities/notification.entity';
import { Cfo } from '../org/entities/cfo.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { Role, User } from '../users/entities/user.entity';
import { CfoSelectionDto } from './dto/cfo-selection.dto';
import { FinalDecision, FinalDecisionDto } from './dto/final-decision.dto';
import { FindFactPackagesQueryDto } from './dto/find-fact-packages-query.dto';
import { RemarkCreateDto } from './dto/remark-create.dto';
import {
  DIRECTION_FORM_CODES,
  Direction,
  FORM_LABELS,
  FactFormCode,
} from './fact-form-catalog';
import {
  sortFormsByCatalogOrder,
  toCfoDto,
  toCfoStatusDto,
  toFactFormVersionDto,
  toFactPackageBaseDto,
  toFactPackageListItemDto,
  toFactFormDto,
  toHistoryEntryDto,
  toRemarkDto,
} from './fact-packages.mapper';
import { FactFormVersion } from './entities/fact-form-version.entity';
import { FactForm } from './entities/fact-form.entity';
import {
  FactCfoStatusValue,
  FactPackageCfoStatus,
} from './entities/fact-package-cfo-status.entity';
import { FactPackageHistoryEntry } from './entities/fact-package-history-entry.entity';
import { FactPackage, FactPackageStatus } from './entities/fact-package.entity';
import {
  FactPackageRemark,
  FactRemarkStatus,
} from './entities/fact-package-remark.entity';

const DETAIL_RELATIONS = [
  'filial',
  'author',
  'forms',
  'forms.versions',
  'cfoStatuses',
  'cfoStatuses.cfo',
  'cfoStatuses.decidedBy',
  'remarks',
  'remarks.cfo',
  'history',
  'history.user',
];

/**
 * Домен «Факт-пакет» (openspec/changes/fact-package-review) — параллельный
 * `corrections`, теми же паттернами (человекочитаемый ID через Postgres-
 * последовательность, транзакции на каждую мутацию, неизменяемая история),
 * но своя сущность и свои таблицы; домен `corrections` не трогается.
 */
@Injectable()
export class FactPackagesService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(FactPackage)
    private factPackages: Repository<FactPackage>,
    @InjectRepository(FactForm) private forms: Repository<FactForm>,
    @InjectRepository(FactFormVersion)
    private formVersions: Repository<FactFormVersion>,
    @InjectRepository(FactPackageCfoStatus)
    private cfoStatuses: Repository<FactPackageCfoStatus>,
    @InjectRepository(FactPackageRemark)
    private remarks: Repository<FactPackageRemark>,
    @InjectRepository(FactPackageHistoryEntry)
    private history: Repository<FactPackageHistoryEntry>,
    @InjectRepository(FilialCfoLink)
    private filialCfoLinks: Repository<FilialCfoLink>,
    @InjectRepository(Cfo) private cfos: Repository<Cfo>,
    @InjectRepository(User) private users: Repository<User>,
    private config: ConfigService,
  ) {}

  // ---------------------------------------------------------------- queries

  async findAll(user: User, query: FindFactPackagesQueryDto) {
    const qb = this.factPackages
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.filial', 'filial')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoinAndSelect('p.remarks', 'remarks');

    if (user.role === Role.FILIAL) {
      qb.andWhere('p.filialId = :filialId', { filialId: user.filialId });
    } else if (user.role === Role.CFO) {
      qb.innerJoin('p.cfoStatuses', 'myStatus', 'myStatus.cfoId = :myCfoId', {
        myCfoId: user.cfoId ?? -1,
      });
    }

    if (query.direction)
      qb.andWhere('p.direction = :direction', { direction: query.direction });
    if (query.status)
      qb.andWhere('p.status = :status', { status: query.status });
    if (query.filialId)
      qb.andWhere('p.filialId = :filialId2', { filialId2: query.filialId });
    if (query.q) qb.andWhere('p.humanId ILIKE :q', { q: `%${query.q}%` });
    if (query.cfoId) {
      qb.andWhere((sub) => {
        const subQuery = sub
          .subQuery()
          .select('1')
          .from(FactPackageCfoStatus, 'cs')
          .where('cs.factPackageId = p.id AND cs.cfoId = :filterCfoId')
          .getQuery();
        return `EXISTS ${subQuery}`;
      }).setParameter('filterCfoId', query.cfoId);
    }

    qb.orderBy('p.updatedAt', 'DESC');

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    let myStatusesByPackage = new Map<number, FactCfoStatusValue>();
    if (user.role === Role.CFO && items.length) {
      const rows = await this.cfoStatuses.find({
        where: {
          factPackageId: In(items.map((i) => i.id)),
          cfoId: user.cfoId ?? -1,
        },
      });
      myStatusesByPackage = new Map(
        rows.map((r) => [r.factPackageId, r.status]),
      );
    }

    return {
      items: items.map((p) =>
        toFactPackageListItemDto(p, {
          myCfoStatus: myStatusesByPackage.get(p.id) ?? null,
        }),
      ),
      total,
      page,
      pageSize,
    };
  }

  async findOne(user: User, humanId: string) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    if (!(await this.checkAccess(user, factPackage))) {
      throw new ForbiddenException('Нет доступа к этому факт-пакету');
    }
    return this.toDetailDto(factPackage, user);
  }

  /**
   * Один факт-пакет на пару «Филиал × Направление», без периода — если его ещё
   * нет, создаётся атомарно вместе со всеми формами каталога направления.
   * Идемпотентно: повторный вызов для той же пары возвращает тот же пакет.
   */
  async getOrCreateByDirection(user: User, direction: Direction) {
    if (user.role !== Role.FILIAL || user.filialId == null) {
      throw new ForbiddenException(
        'Получить/создать факт-пакет может только роль FILIAL',
      );
    }

    const existing = await this.factPackages.findOne({
      where: { filialId: user.filialId, direction },
      relations: DETAIL_RELATIONS,
    });
    if (existing) return this.toDetailDto(existing, user);

    const id = await this.dataSource.transaction(async (manager) => {
      const humanId = await this.nextFactPackageHumanId(manager);
      const factPackage = await manager.getRepository(FactPackage).save({
        humanId,
        filialId: user.filialId!,
        direction,
        authorId: user.id,
        status: FactPackageStatus.DRAFT,
      });

      for (const code of DIRECTION_FORM_CODES[direction]) {
        await manager.getRepository(FactForm).save({
          factPackageId: factPackage.id,
          code,
          label: FORM_LABELS[code],
        });
      }

      await this.log(
        manager,
        factPackage.id,
        user,
        `Филиал создал факт-пакет ${humanId}.`,
      );
      return factPackage.id;
    });

    return this.toDetailDto(await this.loadDetail(id), user);
  }

  async uploadFormVersion(
    user: User,
    humanId: string,
    formCode: FactFormCode,
    file: Express.Multer.File,
    note: string | undefined,
    remarkId: number | undefined,
  ) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    if (!(
      user.role === Role.FILIAL && user.filialId === factPackage.filialId
    )) {
      throw new ForbiddenException();
    }
    if (factPackage.status === FactPackageStatus.APPROVED) {
      throw new BadRequestException(
        'Факт-пакет в финальном статусе «Согласовано» — файлы больше нельзя загружать.',
      );
    }
    if (!DIRECTION_FORM_CODES[factPackage.direction].includes(formCode)) {
      throw new BadRequestException(
        'Эта форма не входит в каталог направления факт-пакета.',
      );
    }
    const form = factPackage.forms.find((f) => f.code === formCode);
    if (!form) throw new NotFoundException('Форма не найдена');

    const dir = path.join(
      this.config.get('UPLOADS_DIR', 'uploads'),
      'fact-packages',
      String(new Date().getFullYear()),
      String(new Date().getMonth() + 1).padStart(2, '0'),
    );
    await fs.mkdir(dir, { recursive: true });
    const storageFileName = `${Date.now()}-${file.originalname}`;
    await fs.writeFile(path.join(dir, storageFileName), file.buffer);

    const version = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(FactFormVersion);
      const last = await versionRepo.findOne({
        where: { formId: form.id },
        order: { versionNumber: 'DESC' },
      });
      const saved = await versionRepo.save({
        formId: form.id,
        versionNumber: (last?.versionNumber ?? 0) + 1,
        storagePath: path.join(dir, storageFileName),
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById: user.id,
        remarkId: remarkId ?? null,
        note: note ?? '',
      });
      await this.log(
        manager,
        factPackage.id,
        user,
        `Загружена версия ${saved.versionNumber} формы «${form.label}».`,
      );
      return saved;
    });

    return toFactFormVersionDto(version);
  }

  async downloadFormVersion(user: User, id: number) {
    const version = await this.formVersions.findOne({
      where: { id },
      relations: ['form', 'form.factPackage', 'form.factPackage.filial'],
    });
    if (!version) throw new NotFoundException();
    const factPackage = await this.findByHumanIdOrThrow(
      version.form.factPackage.humanId,
    );
    if (!(await this.checkAccess(user, factPackage))) {
      throw new ForbiddenException();
    }
    const isFilialOwner =
      user.role === Role.FILIAL && user.filialId === factPackage.filialId;
    if (!(user.role === Role.CFO || user.role === Role.DTOE || isFilialOwner)) {
      throw new ForbiddenException(
        'Скачивание файлов доступно проверяющим и филиалу-владельцу.',
      );
    }
    const buffer = await fs.readFile(version.storagePath);
    return {
      buffer,
      fileName: version.fileName,
      mimeType: version.mimeType || 'application/octet-stream',
    };
  }

  /**
   * Обслуживает и первичное направление (DRAFT), и повторное после доработки
   * (RETURNED_FOR_REVISION) — один эндпоинт вместо пары send/resubmit
   * «Корректировки»: статус согласовавших ранее ЦФО не сбрасывается (rule 6
   * AGENTS.md), т.к. трогаются только строки выбранных cfoIds.
   */
  async submit(user: User, humanId: string, dto: CfoSelectionDto) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    if (!(
      user.role === Role.FILIAL && user.filialId === factPackage.filialId
    )) {
      throw new ForbiddenException();
    }
    if (!factPackage.canSubmit) {
      throw new BadRequestException(
        'Направить на проверку можно только черновик либо пакет, возвращённый на доработку.',
      );
    }

    if (factPackage.status === FactPackageStatus.RETURNED_FOR_REVISION) {
      const returnedCfoIds = factPackage.cfoStatuses
        .filter((s) => s.status === FactCfoStatusValue.RETURNED)
        .map((s) => s.cfoId);
      const unfixed = factPackage.remarks.filter(
        (r) =>
          returnedCfoIds.includes(r.cfoId ?? -1) &&
          r.status === FactRemarkStatus.OPEN,
      );
      if (unfixed.length) {
        throw new BadRequestException(
          `Есть неисправленные замечания: ${unfixed.map((r) => r.humanId).join(', ')}`,
        );
      }
    }

    const allowedIds = await this.linkedCfoIds(
      this.dataSource.manager,
      factPackage.filialId,
    );
    for (const cfoId of dto.cfoIds) {
      if (!allowedIds.includes(cfoId)) {
        throw new BadRequestException(
          'Выбранный ЦФО не привязан к филиалу. Обратитесь к администратору.',
        );
      }
    }

    const isResubmit =
      factPackage.status === FactPackageStatus.RETURNED_FOR_REVISION;

    await this.dataSource.transaction(async (manager) => {
      for (const cfoId of dto.cfoIds) {
        const existing = await manager
          .getRepository(FactPackageCfoStatus)
          .findOne({ where: { factPackageId: factPackage.id, cfoId } });
        if (existing) {
          await manager
            .getRepository(FactPackageCfoStatus)
            .update(existing.id, {
              status: FactCfoStatusValue.PENDING,
              isRequired: true,
              decidedById: null,
              decidedAt: null,
            });
        } else {
          await manager.getRepository(FactPackageCfoStatus).save({
            factPackageId: factPackage.id,
            cfoId,
            status: FactCfoStatusValue.PENDING,
            isRequired: true,
          });
        }
        const cfoUsers = await this.cfoUsers(manager, cfoId);
        await this.notifyUsers(
          manager,
          cfoUsers,
          factPackage.id,
          isResubmit
            ? `Филиал «${factPackage.filial.code}» повторно направил факт-пакет ${factPackage.humanId}. Проверьте исправления.`
            : `Новый факт-пакет от филиала «${factPackage.filial.code}». ID: ${factPackage.humanId}. Статус: На проверке.`,
        );
      }
      await manager.getRepository(FactPackage).update(factPackage.id, {
        status: FactPackageStatus.UNDER_CFO_REVIEW,
      });
      await this.log(
        manager,
        factPackage.id,
        user,
        `${isResubmit ? 'Повторно направлено' : 'Направлено'} ЦФО: ${dto.cfoIds.join(', ')}.`,
      );
    });

    return this.toDetailDto(await this.loadDetail(factPackage.id), user);
  }

  async approveByCfo(user: User, humanId: string, cfoId: number) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.CFO && user.cfoId === cfoId)) {
      throw new ForbiddenException();
    }
    const myStatus = factPackage.cfoStatuses.find((s) => s.cfoId === cfoId);
    if (!myStatus) throw new ForbiddenException();
    if (myStatus.status !== FactCfoStatusValue.PENDING) {
      throw new BadRequestException(
        'Решение по этому факт-пакету уже принято этим ЦФО.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(FactPackageCfoStatus).update(myStatus.id, {
        status: FactCfoStatusValue.APPROVED,
        decidedById: user.id,
        decidedAt: new Date(),
      });
      const openRemarks = factPackage.remarks.filter(
        (r) => r.cfoId === cfoId && r.status !== FactRemarkStatus.CLOSED,
      );
      for (const remark of openRemarks) {
        await manager.getRepository(FactPackageRemark).update(remark.id, {
          status: FactRemarkStatus.CLOSED,
          closedAt: new Date(),
        });
      }
      const cfoLabel = myStatus.cfo?.code ?? 'ЦФО';
      const closedNote = openRemarks.length
        ? ` Закрыты замечания: ${openRemarks.map((r) => r.humanId).join(', ')}.`
        : '';
      await this.log(
        manager,
        factPackage.id,
        user,
        `${cfoLabel} согласовал.${closedNote}`,
      );
      await this.recomputeStatusAfterCfoAction(manager, factPackage.id);
    });

    return this.toDetailDto(await this.loadDetail(factPackage.id), user);
  }

  /**
   * Роль CFO: атомарно оставляет замечание и возвращает пакет на доработку
   * (нет отдельного шага-подтверждения — упрощение относительно
   * «Корректировки», см. openspec/changes/fact-package-review/design.md).
   * Роль DTOE: только фиксирует замечание, статус пакета не меняется —
   * фактический возврат делает отдельное действие `finalDecision(RETURN)`.
   */
  async leaveRemark(user: User, humanId: string, dto: RemarkCreateDto) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    const form = factPackage.forms.find((f) => f.id === dto.relatedFormId);
    if (!form) throw new NotFoundException('Форма не найдена');

    let cfoId: number | null = null;
    let issuerLabel = 'ДТОиР';
    let myStatus: FactPackageCfoStatus | undefined;

    if (user.role === Role.CFO) {
      myStatus = factPackage.cfoStatuses.find((s) => s.cfoId === user.cfoId);
      if (!myStatus) throw new ForbiddenException();
      if (myStatus.status !== FactCfoStatusValue.PENDING) {
        throw new BadRequestException(
          'Решение по этому факт-пакету уже принято этим ЦФО.',
        );
      }
      cfoId = user.cfoId!;
      issuerLabel = myStatus.cfo?.code ?? 'ЦФО';
    } else if (user.role === Role.DTOE) {
      if (factPackage.status !== FactPackageStatus.UNDER_DTOE_REVIEW) {
        throw new BadRequestException(
          'Факт-пакет сейчас не находится на проверке ДТОиР.',
        );
      }
    } else {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      const remarkHumanId = await this.nextRemarkHumanId(manager);
      const remark = await manager.getRepository(FactPackageRemark).save({
        humanId: remarkHumanId,
        factPackageId: factPackage.id,
        relatedFormId: form.id,
        cfoId,
        authorId: user.id,
        description: dto.description,
        requiredAction: dto.requiredAction,
      });

      if (user.role === Role.CFO && myStatus) {
        await manager.getRepository(FactPackageCfoStatus).update(myStatus.id, {
          status: FactCfoStatusValue.RETURNED,
          decidedById: user.id,
          decidedAt: new Date(),
        });
        await manager.getRepository(FactPackage).update(factPackage.id, {
          status: FactPackageStatus.RETURNED_FOR_REVISION,
        });
        const filialUsers = await this.filialUsers(
          manager,
          factPackage.filialId,
        );
        await this.notifyUsers(
          manager,
          filialUsers,
          factPackage.id,
          `${issuerLabel} вернуло факт-пакет ${factPackage.humanId} на доработку. Замечание: ${remark.humanId}.`,
        );
      }

      await this.log(
        manager,
        factPackage.id,
        user,
        `${issuerLabel} оставил замечание ${remark.humanId} (форма: «${form.label}»).`,
      );
    });

    return this.toDetailDto(await this.loadDetail(factPackage.id), user);
  }

  async fixRemark(user: User, humanId: string, remarkId: number) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    if (!(
      user.role === Role.FILIAL && user.filialId === factPackage.filialId
    )) {
      throw new ForbiddenException();
    }
    const remark = factPackage.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(FactPackageRemark)
        .update(remark.id, { status: FactRemarkStatus.FIXED_BY_FILIAL });
      await this.log(
        manager,
        factPackage.id,
        user,
        `Филиал отметил ${remark.humanId} как исправленное.`,
      );
    });

    return toRemarkDto(
      await this.remarks.findOneOrFail({ where: { id: remarkId } }),
    );
  }

  async deleteRemark(user: User, humanId: string, remarkId: number) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    const remark = factPackage.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');
    if (remark.authorId !== user.id) {
      throw new ForbiddenException(
        'Удалить можно только собственное замечание.',
      );
    }
    if (remark.status !== FactRemarkStatus.OPEN) {
      throw new BadRequestException(
        'Удалить можно только замечание в статусе «Открыто».',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const label = remark.humanId;
      await manager.getRepository(FactPackageRemark).delete(remark.id);
      await this.log(
        manager,
        factPackage.id,
        user,
        `${user.fullName} удалил замечание ${label}.`,
      );
    });
  }

  async sendToDtoe(user: User, humanId: string) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    const myStatus = factPackage.cfoStatuses.find(
      (s) => s.cfoId === user.cfoId,
    );
    if (!(
      user.role === Role.CFO &&
      myStatus &&
      myStatus.status === FactCfoStatusValue.APPROVED
    )) {
      throw new ForbiddenException();
    }
    if (!factPackage.canSendToDtoe) {
      throw new BadRequestException(
        'Не все обязательные ЦФО согласовали пакет.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(FactPackage).update(factPackage.id, {
        status: FactPackageStatus.UNDER_DTOE_REVIEW,
        sentToDtoeAt: new Date(),
      });
      const dtoeUsers = await this.dtoeUsers(manager);
      await this.notifyUsers(
        manager,
        dtoeUsers,
        factPackage.id,
        `Факт-пакет ${factPackage.humanId} полностью проверен и согласован всеми ЦФО. Филиал: ${factPackage.filial.code}.`,
      );
      await this.log(manager, factPackage.id, user, 'Отправлено в ДТОиР.');
    });

    return this.toDetailDto(await this.loadDetail(factPackage.id), user);
  }

  async finalDecision(user: User, humanId: string, dto: FinalDecisionDto) {
    const factPackage = await this.findByHumanIdOrThrow(humanId);
    if (user.role !== Role.DTOE) throw new ForbiddenException();
    if (factPackage.status !== FactPackageStatus.UNDER_DTOE_REVIEW) {
      throw new BadRequestException(
        'Факт-пакет сейчас не находится на проверке ДТОиР.',
      );
    }

    if (dto.decision === FinalDecision.APPROVE) {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(FactPackage).update(factPackage.id, {
          status: FactPackageStatus.APPROVED,
          decidedAt: new Date(),
        });
        const filialUsers = await this.filialUsers(
          manager,
          factPackage.filialId,
        );
        await this.notifyUsers(
          manager,
          filialUsers,
          factPackage.id,
          `ДТОиР согласовало факт-пакет ${factPackage.humanId}.`,
        );
        await this.log(
          manager,
          factPackage.id,
          user,
          'ДТОиР согласовало факт-пакет. Финальный статус: Согласовано.',
        );
      });
    } else {
      const openRemarks = factPackage.remarks.filter(
        (r) => r.cfoId === null && r.status === FactRemarkStatus.OPEN,
      );
      if (openRemarks.length === 0) {
        throw new BadRequestException(
          'Нельзя вернуть на доработку без ни одного открытого замечания от ДТОиР.',
        );
      }
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(FactPackage).update(factPackage.id, {
          status: FactPackageStatus.RETURNED_BY_DTOE,
        });
        const remarksList = openRemarks.map((r) => r.humanId).join(', ');
        const filialUsers = await this.filialUsers(
          manager,
          factPackage.filialId,
        );
        await this.notifyUsers(
          manager,
          filialUsers,
          factPackage.id,
          `ДТОиР вернуло факт-пакет ${factPackage.humanId} на доработку. Замечания: ${remarksList}.`,
        );
        await this.log(
          manager,
          factPackage.id,
          user,
          `ДТОиР вернуло на доработку (замечания: ${remarksList}).`,
        );
      });
    }

    return this.toDetailDto(await this.loadDetail(factPackage.id), user);
  }

  /**
   * Агрегированные счётчики для «Рабочего стола» модуля «Факт» — те же три
   * ветки видимости по роли, что и в `corrections.service.getStats`
   * (см. `apps/backend/AGENTS.md`, «Статусная модель корректировки», применена
   * по аналогии к статусам факт-пакета).
   */
  async getStats(user: User) {
    if (user.role === Role.CFO) {
      const rows = await this.cfoStatuses.find({
        where: { cfoId: user.cfoId ?? -1 },
      });
      return {
        total: rows.length,
        inReview: rows.filter((r) => r.status === FactCfoStatusValue.PENDING)
          .length,
        returned: rows.filter((r) => r.status === FactCfoStatusValue.RETURNED)
          .length,
        approved: rows.filter((r) => r.status === FactCfoStatusValue.APPROVED)
          .length,
      };
    }

    const qb = this.factPackages.createQueryBuilder('p');
    if (user.role === Role.FILIAL) {
      qb.where('p.filialId = :filialId', { filialId: user.filialId });
    }
    const all = await qb.getMany();
    const inReviewStatuses: FactPackageStatus[] = [
      FactPackageStatus.UNDER_CFO_REVIEW,
      FactPackageStatus.RESUBMITTED,
      FactPackageStatus.PARTIALLY_APPROVED,
      FactPackageStatus.ALL_CFO_APPROVED,
      FactPackageStatus.UNDER_DTOE_REVIEW,
    ];
    const returnedStatuses: FactPackageStatus[] = [
      FactPackageStatus.RETURNED_FOR_REVISION,
      FactPackageStatus.RETURNED_BY_DTOE,
    ];
    const base = {
      total: all.length,
      inReview: all.filter((p) => inReviewStatuses.includes(p.status)).length,
      returned: all.filter((p) => returnedStatuses.includes(p.status)).length,
      approved: all.filter((p) => p.status === FactPackageStatus.APPROVED)
        .length,
    };

    if (user.role === Role.DTOE || user.role === Role.ADMIN) {
      const openRemarks = await this.remarks.count({
        where: {
          status: In([FactRemarkStatus.OPEN, FactRemarkStatus.FIXED_BY_FILIAL]),
        },
      });
      return {
        ...base,
        underReview: all.filter(
          (p) => p.status === FactPackageStatus.UNDER_DTOE_REVIEW,
        ).length,
        openRemarks,
      };
    }
    return base;
  }

  // ----------------------------------------------------------------- utils

  private async nextFactPackageHumanId(
    manager: EntityManager,
  ): Promise<string> {
    await manager.query(
      'CREATE SEQUENCE IF NOT EXISTS fact_package_human_id_seq',
    );
    const rows = await manager.query<{ nextval: string }[]>(
      "SELECT nextval('fact_package_human_id_seq') as nextval",
    );
    return `FCT-${String(rows[0].nextval).padStart(6, '0')}`;
  }

  private async nextRemarkHumanId(manager: EntityManager): Promise<string> {
    await manager.query(
      'CREATE SEQUENCE IF NOT EXISTS fact_remark_human_id_seq',
    );
    const rows = await manager.query<{ nextval: string }[]>(
      "SELECT nextval('fact_remark_human_id_seq') as nextval",
    );
    return `FCT-REM-${String(rows[0].nextval).padStart(6, '0')}`;
  }

  private async log(
    manager: EntityManager,
    factPackageId: number,
    user: User | null,
    text: string,
  ) {
    await manager.getRepository(FactPackageHistoryEntry).insert({
      factPackageId,
      userId: user?.id ?? null,
      text,
    });
  }

  private async notifyUsers(
    manager: EntityManager,
    users: User[],
    factPackageId: number,
    text: string,
  ) {
    if (users.length === 0) return;
    await manager.getRepository(Notification).insert(
      users.map((u) => ({
        userId: u.id,
        factPackageId,
        text,
        isRead: false,
      })),
    );
  }

  private cfoUsers(manager: EntityManager, cfoId: number) {
    return manager
      .getRepository(User)
      .find({ where: { role: Role.CFO, cfoId, isActive: true } });
  }

  private filialUsers(manager: EntityManager, filialId: number) {
    return manager
      .getRepository(User)
      .find({ where: { role: Role.FILIAL, filialId, isActive: true } });
  }

  private dtoeUsers(manager: EntityManager) {
    return manager
      .getRepository(User)
      .find({ where: { role: Role.DTOE, isActive: true } });
  }

  private async linkedCfoIds(
    manager: EntityManager,
    filialId: number,
  ): Promise<number[]> {
    const links = await manager
      .getRepository(FilialCfoLink)
      .find({ where: { filialId, isActive: true }, relations: ['cfo'] });
    return links.filter((l) => l.cfo.isActive).map((l) => l.cfoId);
  }

  private async checkAccess(
    user: User,
    factPackage: FactPackage,
  ): Promise<boolean> {
    if (user.role === Role.FILIAL)
      return user.filialId === factPackage.filialId;
    if (user.role === Role.CFO) {
      if (user.cfoId == null) return false;
      return this.cfoStatuses.exist({
        where: { factPackageId: factPackage.id, cfoId: user.cfoId },
      });
    }
    return user.role === Role.DTOE || user.role === Role.ADMIN;
  }

  private async loadDetail(id: number): Promise<FactPackage> {
    const factPackage = await this.factPackages.findOne({
      where: { id },
      relations: DETAIL_RELATIONS,
    });
    if (!factPackage) throw new NotFoundException('Факт-пакет не найден');
    return factPackage;
  }

  private async findByHumanIdOrThrow(humanId: string): Promise<FactPackage> {
    const factPackage = await this.factPackages.findOne({
      where: { humanId },
      relations: DETAIL_RELATIONS,
    });
    if (!factPackage) throw new NotFoundException('Факт-пакет не найден');
    return factPackage;
  }

  private checkPackageComplete(factPackage: FactPackage): {
    complete: boolean;
    missing: string[];
  } {
    const missing = factPackage.forms
      .filter((f) => (f.versions?.length ?? 0) === 0)
      .map((f) => f.label);
    return { complete: missing.length === 0, missing };
  }

  private async toDetailDto(factPackage: FactPackage, user: User) {
    const { complete, missing } = this.checkPackageComplete(factPackage);
    const myCfoStatus =
      user.role === Role.CFO
        ? (factPackage.cfoStatuses.find((s) => s.cfoId === user.cfoId) ?? null)
        : null;
    const myOpenRemarksCount =
      user.role === Role.CFO
        ? factPackage.remarks.filter(
            (r) =>
              r.cfoId === user.cfoId && r.status !== FactRemarkStatus.CLOSED,
          ).length
        : 0;

    const returnedCfos = factPackage.cfoStatuses
      .filter((s) => s.status === FactCfoStatusValue.RETURNED)
      .map((s) => s.cfo);
    const availableCfoIds = await this.linkedCfoIds(
      this.dataSource.manager,
      factPackage.filialId,
    );
    const availableCfos = await this.cfos.find({
      where: { id: In(availableCfoIds.length ? availableCfoIds : [-1]) },
    });

    return {
      ...toFactPackageBaseDto(factPackage),
      filial: {
        id: factPackage.filial.id,
        code: factPackage.filial.code,
        name: factPackage.filial.name,
        isActive: factPackage.filial.isActive,
      },
      author: {
        id: factPackage.author.id,
        username: factPackage.author.username,
        fullName: factPackage.author.fullName,
        role: factPackage.author.role,
        position: factPackage.author.position,
      },
      forms: sortFormsByCatalogOrder(
        factPackage.direction,
        factPackage.forms,
      ).map(toFactFormDto),
      cfoStatuses: factPackage.cfoStatuses.map(toCfoStatusDto),
      remarks: factPackage.remarks.map(toRemarkDto),
      history: [...factPackage.history]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(toHistoryEntryDto),
      packageComplete: complete,
      missingForms: missing,
      myCfoStatus: myCfoStatus ? toCfoStatusDto(myCfoStatus) : null,
      myOpenRemarksCount,
      isFilialOwner:
        user.role === Role.FILIAL && user.filialId === factPackage.filialId,
      isCfoReviewer: user.role === Role.CFO && myCfoStatus != null,
      isDtoe: user.role === Role.DTOE,
      availableCfos: availableCfos.map(toCfoDto),
      returnedCfos: returnedCfos.map((cfo) => toCfoDto(cfo)),
    };
  }

  private async recomputeStatusAfterCfoAction(
    manager: EntityManager,
    factPackageId: number,
  ) {
    const statuses = await manager
      .getRepository(FactPackageCfoStatus)
      .find({ where: { factPackageId, isRequired: true } });
    let status: FactPackageStatus;
    if (statuses.some((s) => s.status === FactCfoStatusValue.RETURNED)) {
      status = FactPackageStatus.RETURNED_FOR_REVISION;
    } else if (
      statuses.length > 0 &&
      statuses.every((s) => s.status === FactCfoStatusValue.APPROVED)
    ) {
      status = FactPackageStatus.ALL_CFO_APPROVED;
    } else if (statuses.some((s) => s.status === FactCfoStatusValue.APPROVED)) {
      status = FactPackageStatus.PARTIALLY_APPROVED;
    } else {
      status = FactPackageStatus.UNDER_CFO_REVIEW;
    }
    await manager.getRepository(FactPackage).update(factPackageId, { status });

    if (status === FactPackageStatus.ALL_CFO_APPROVED) {
      const factPackage = await manager
        .getRepository(FactPackage)
        .findOneOrFail({ where: { id: factPackageId } });
      const filialUsers = await this.filialUsers(manager, factPackage.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        factPackageId,
        `Все ЦФО согласовали факт-пакет ${factPackage.humanId}. Ожидает отправки в ДТОиР.`,
      );
      const cfoIds = statuses.map((s) => s.cfoId);
      const cfoUsersToNotify = await manager
        .getRepository(User)
        .find({ where: { role: Role.CFO, cfoId: In(cfoIds), isActive: true } });
      await this.notifyUsers(
        manager,
        cfoUsersToNotify,
        factPackageId,
        `Факт-пакет ${factPackage.humanId} согласован всеми ЦФО — можно направлять в ДТОиР.`,
      );
    }
  }
}
