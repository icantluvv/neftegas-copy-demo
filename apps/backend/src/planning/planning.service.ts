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

import { Cfo } from '../org/entities/cfo.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Role, User } from '../users/entities/user.entity';
import { PlanCfoSelectionDto } from './dto/cfo-selection.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { FindPlansQueryDto } from './dto/find-plans-query.dto';
import { PlanRemarkCreateDto } from './dto/remark-create.dto';
import { PlanRemarkReopenDto } from './dto/remark-reopen.dto';
import { UpdatePlanTypeDto } from './dto/update-plan-type.dto';
import {
  PlanCfoStatus,
  PlanCfoStatusValue,
} from './entities/plan-cfo-status.entity';
import { PlanDocumentSlot } from './entities/plan-document-slot.entity';
import { PlanFileVersion } from './entities/plan-file-version.entity';
import { PlanHistoryEntry } from './entities/plan-history-entry.entity';
import {
  PlanPackageRequirement,
  PlanRequirementKind,
} from './entities/plan-package-requirement.entity';
import { PlanRemark, PlanRemarkStatus } from './entities/plan-remark.entity';
import { PlanType } from './entities/plan-type.entity';
import { Plan, PlanStatus } from './entities/plan.entity';
import {
  toCfoDto,
  toPlanBaseDto,
  toPlanCfoStatusDto,
  toPlanDocumentSlotDto,
  toPlanFileVersionDto,
  toPlanHistoryEntryDto,
  toPlanListItemDto,
  toPlanRemarkDto,
  sortSlotsByRequirementOrder,
} from './planning.mapper';

const DETAIL_RELATIONS = [
  'filial',
  'planType',
  'planType.requirements',
  'author',
  'slots',
  'slots.requirement',
  'slots.requirement.responsibleCfo',
  'slots.versions',
  'cfoStatuses',
  'cfoStatuses.cfo',
  'cfoStatuses.decidedBy',
  'remarks',
  'remarks.cfo',
  'history',
  'history.user',
];

@Injectable()
export class PlanningService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Plan) private plans: Repository<Plan>,
    @InjectRepository(PlanDocumentSlot)
    private slots: Repository<PlanDocumentSlot>,
    @InjectRepository(PlanFileVersion)
    private fileVersions: Repository<PlanFileVersion>,
    @InjectRepository(PlanCfoStatus)
    private cfoStatuses: Repository<PlanCfoStatus>,
    @InjectRepository(PlanRemark) private remarks: Repository<PlanRemark>,
    @InjectRepository(PlanHistoryEntry)
    private history: Repository<PlanHistoryEntry>,
    @InjectRepository(PlanType)
    private planTypes: Repository<PlanType>,
    @InjectRepository(FilialCfoLink)
    private filialCfoLinks: Repository<FilialCfoLink>,
    @InjectRepository(Cfo) private cfos: Repository<Cfo>,
    @InjectRepository(User) private users: Repository<User>,
    private config: ConfigService,
  ) {}

  // ---------------------------------------------------------------- utils

  async findAll(user: User, query: FindPlansQueryDto) {
    const qb = this.plans
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.filial', 'filial')
      .leftJoinAndSelect('p.planType', 'planType')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoinAndSelect('p.remarks', 'remarks');

    if (user.role === Role.FILIAL) {
      qb.andWhere('p.filialId = :filialId', { filialId: user.filialId });
    } else if (user.role === Role.CFO) {
      qb.innerJoin('p.cfoStatuses', 'myStatus', 'myStatus.cfoId = :myCfoId', {
        myCfoId: user.cfoId ?? -1,
      });
    }

    if (query.status)
      qb.andWhere('p.status = :status', { status: query.status });
    if (query.filialId)
      qb.andWhere('p.filialId = :filialId2', { filialId2: query.filialId });
    if (query.planTypeId)
      qb.andWhere('p.planTypeId = :typeId', {
        typeId: query.planTypeId,
      });
    if (query.q) qb.andWhere('p.humanId ILIKE :q', { q: `%${query.q}%` });
    if (query.cfoId) {
      qb.andWhere((sub) => {
        const subQuery = sub
          .subQuery()
          .select('1')
          .from(PlanCfoStatus, 'cs')
          .where('cs.planId = p.id AND cs.cfoId = :filterCfoId')
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

    let myStatusesByPlan = new Map<number, PlanCfoStatusValue>();
    if (user.role === Role.CFO && items.length) {
      const rows = await this.cfoStatuses.find({
        where: {
          planId: In(items.map((i) => i.id)),
          cfoId: user.cfoId ?? -1,
        },
      });
      myStatusesByPlan = new Map(rows.map((r) => [r.planId, r.status]));
    }

    return {
      items: items.map((p) =>
        toPlanListItemDto(p, {
          myCfoStatus: myStatusesByPlan.get(p.id) ?? null,
        }),
      ),
      total,
      page,
      pageSize,
    };
  }

  async getStats(user: User) {
    if (user.role === Role.CFO) {
      const rows = await this.cfoStatuses.find({
        where: { cfoId: user.cfoId ?? -1 },
      });
      return {
        total: rows.length,
        inReview: rows.filter((r) => r.status === PlanCfoStatusValue.PENDING)
          .length,
        returned: rows.filter((r) => r.status === PlanCfoStatusValue.RETURNED)
          .length,
        approved: rows.filter((r) => r.status === PlanCfoStatusValue.APPROVED)
          .length,
      };
    }

    const qb = this.plans.createQueryBuilder('p');
    if (user.role === Role.FILIAL) {
      qb.where('p.filialId = :filialId', { filialId: user.filialId });
    }
    const all = await qb.getMany();
    const inReviewStatuses: PlanStatus[] = [
      PlanStatus.UNDER_CFO_REVIEW,
      PlanStatus.RESUBMITTED,
      PlanStatus.PARTIALLY_APPROVED,
      PlanStatus.UNDER_DTOE_REVIEW,
    ];
    const returnedStatuses: PlanStatus[] = [
      PlanStatus.RETURNED_FOR_REVISION,
      PlanStatus.RETURNED_BY_DTOE,
    ];
    const base = {
      total: all.length,
      inReview: all.filter((p) => inReviewStatuses.includes(p.status)).length,
      returned: all.filter((p) => returnedStatuses.includes(p.status)).length,
      approved: all.filter((p) => p.status === PlanStatus.APPROVED_BY_DTOE)
        .length,
    };

    if (user.role === Role.DTOE || user.role === Role.ADMIN) {
      const openRemarks = await this.remarks.count({
        where: {
          status: In([
            PlanRemarkStatus.OPEN,
            PlanRemarkStatus.FIXED_BY_FILIAL,
            PlanRemarkStatus.REOPENED,
          ]),
        },
      });
      return {
        ...base,
        underReview: all.filter(
          (p) => p.status === PlanStatus.UNDER_DTOE_REVIEW,
        ).length,
        openRemarks,
      };
    }
    return base;
  }

  async findOne(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(await this.checkAccess(user, plan))) {
      throw new ForbiddenException('Нет доступа к этому плану');
    }
    return this.toDetailDto(plan, user);
  }

  async create(user: User, dto: CreatePlanDto) {
    if (user.role !== Role.FILIAL || user.filialId == null) {
      throw new ForbiddenException('Создавать планы может только роль FILIAL');
    }
    const planType = await this.planTypes.findOne({
      where: { id: dto.planTypeId },
      relations: ['requirements'],
    });
    if (!planType) throw new NotFoundException('Тип плана не найден');

    const id = await this.dataSource.transaction(async (manager) => {
      const humanId = await this.nextPlanHumanId(manager);
      const plan = await manager.getRepository(Plan).save({
        humanId,
        filialId: user.filialId!,
        planTypeId: planType.id,
        authorId: user.id,
        status: PlanStatus.DRAFT,
      });

      await manager.getRepository(PlanDocumentSlot).save({
        planId: plan.id,
        requirementId: null,
        label: 'Excel плана',
      });
      const packageSlots = planType.requirements.filter((r) =>
        [
          PlanRequirementKind.EXCEL_SHEET,
          PlanRequirementKind.DOCUMENT,
        ].includes(r.kind),
      );
      for (const req of packageSlots) {
        await manager.getRepository(PlanDocumentSlot).save({
          planId: plan.id,
          requirementId: req.id,
          label: req.name,
        });
      }

      await this.log(manager, plan.id, user, `Филиал создал план ${humanId}.`);
      return plan.id;
    });

    return this.toDetailDto(await this.loadDetail(id), user);
  }

  /**
   * Меняет тип плана, пока он в статусе `DRAFT`. Слоты пакета жёстко
   * привязаны к `PlanPackageRequirement` конкретного типа, поэтому смена
   * типа не может «переиспользовать» старые слоты — все типозависимые слоты
   * (`requirementId != null`) вместе с уже загруженными в них версиями
   * файлов удаляются (физические файлы — с диска, как в `deletePlan`), и
   * для нового типа создаются слоты заново, тем же алгоритмом, что и в
   * `create()`. Общий слот «Excel плана» (`requirementId == null`) от типа
   * не зависит и не трогается — его версии сохраняются.
   */
  async updatePlanType(user: User, humanId: string, dto: UpdatePlanTypeDto) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'Менять тип можно только у плана в статусе «Черновик».',
      );
    }
    const newType = await this.planTypes.findOne({
      where: { id: dto.planTypeId },
      relations: ['requirements'],
    });
    if (!newType) throw new NotFoundException('Тип плана не найден');

    if (newType.id === plan.planTypeId) {
      return this.toDetailDto(plan, user);
    }

    const staleSlots = plan.slots.filter((s) => s.requirementId != null);
    const staleStoragePaths = staleSlots.flatMap(
      (slot) => slot.versions?.map((version) => version.storagePath) ?? [],
    );

    await this.dataSource.transaction(async (manager) => {
      if (staleSlots.length) {
        await manager
          .getRepository(PlanDocumentSlot)
          .delete(staleSlots.map((s) => s.id));
      }
      const packageSlots = newType.requirements.filter((r) =>
        [
          PlanRequirementKind.EXCEL_SHEET,
          PlanRequirementKind.DOCUMENT,
        ].includes(r.kind),
      );
      for (const req of packageSlots) {
        await manager.getRepository(PlanDocumentSlot).save({
          planId: plan.id,
          requirementId: req.id,
          label: req.name,
        });
      }
      await manager
        .getRepository(Plan)
        .update(plan.id, { planTypeId: newType.id });
      await this.log(
        manager,
        plan.id,
        user,
        `Филиал изменил тип плана на «${newType.name}».`,
      );
    });

    await Promise.all(
      staleStoragePaths.map((storagePath) =>
        fs.unlink(storagePath).catch(() => undefined),
      ),
    );

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  /**
   * Удаляет план целиком — доступно только для `DRAFT`. Ни у одного ЦФО не
   * может быть строки статуса по `DRAFT`-плану (они создаются только в
   * `send()`), поэтому удаление черновика не требует уведомления
   * проверяющих. Слоты/версии файлов/замечания/статусы ЦФО/история/
   * уведомления удаляются каскадом на уровне БД (`onDelete: 'CASCADE'` во
   * всех entity); физические файлы версий дополнительно удаляются с диска.
   */
  async deletePlan(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'Удалить можно только план в статусе «Черновик».',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Plan).delete(plan.id);
    });

    const storagePaths = plan.slots.flatMap(
      (slot) => slot.versions?.map((version) => version.storagePath) ?? [],
    );
    await Promise.all(
      storagePaths.map((storagePath) =>
        fs.unlink(storagePath).catch(() => undefined),
      ),
    );
  }

  async uploadFileVersion(
    user: User,
    humanId: string,
    slotId: number,
    file: Express.Multer.File,
    note: string | undefined,
    remarkId: number | undefined,
  ) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    const slot = plan.slots.find((s) => s.id === slotId);
    if (!slot) throw new NotFoundException('Ячейка пакета не найдена');

    const dir = path.join(
      this.config.get('UPLOADS_DIR', 'uploads'),
      'planning',
      String(new Date().getFullYear()),
      String(new Date().getMonth() + 1).padStart(2, '0'),
    );
    await fs.mkdir(dir, { recursive: true });
    const storageFileName = `${Date.now()}-${file.originalname}`;
    await fs.writeFile(path.join(dir, storageFileName), file.buffer);

    const version = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(PlanFileVersion);
      const last = await versionRepo.findOne({
        where: { slotId },
        order: { versionNumber: 'DESC' },
      });
      const saved = await versionRepo.save({
        slotId,
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
        plan.id,
        user,
        `Загружена версия ${saved.versionNumber} файла «${slot.label}».`,
      );
      return saved;
    });

    return toPlanFileVersionDto(version);
  }

  async downloadFileVersion(user: User, id: number) {
    const version = await this.fileVersions.findOne({
      where: { id },
      relations: ['slot', 'slot.plan'],
    });
    if (!version) throw new NotFoundException();
    const plan = await this.findByHumanIdOrThrow(version.slot.plan.humanId);
    if (!(await this.checkAccess(user, plan))) {
      throw new ForbiddenException();
    }
    const buffer = await fs.readFile(version.storagePath);
    return {
      buffer,
      fileName: version.fileName,
      mimeType: version.mimeType || 'application/octet-stream',
    };
  }

  async send(user: User, humanId: string, dto: PlanCfoSelectionDto) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'Направить можно только план в статусе «Черновик».',
      );
    }
    const { complete, missing } = this.checkPackageComplete(plan);
    if (!complete) {
      throw new BadRequestException(
        `Пакет не укомплектован: ${missing.join(', ')}`,
      );
    }
    const allowedIds = await this.linkedCfoIds(
      this.dataSource.manager,
      plan.filialId,
    );
    for (const cfoId of dto.cfoIds) {
      if (!allowedIds.includes(cfoId)) {
        throw new BadRequestException(
          'Выбранный ЦФО не привязан к филиалу. Обратитесь к администратору.',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      for (const cfoId of dto.cfoIds) {
        const existing = await manager
          .getRepository(PlanCfoStatus)
          .findOne({ where: { planId: plan.id, cfoId } });
        if (existing) {
          await manager.getRepository(PlanCfoStatus).update(existing.id, {
            status: PlanCfoStatusValue.PENDING,
            isRequired: true,
            decidedById: null,
            decidedAt: null,
          });
        } else {
          await manager.getRepository(PlanCfoStatus).save({
            planId: plan.id,
            cfoId,
            status: PlanCfoStatusValue.PENDING,
            isRequired: true,
          });
        }
        const cfoUsers = await this.cfoUsers(manager, cfoId);
        await this.notifyUsers(
          manager,
          cfoUsers,
          plan.id,
          `Новый план от филиала «${plan.filial.code}». ID: ${plan.humanId}. Статус: На проверке.`,
        );
      }
      await manager.getRepository(Plan).update(plan.id, {
        status: PlanStatus.UNDER_CFO_REVIEW,
        stageNote: 'Направлено на проверку ЦФО',
      });
      await this.log(
        manager,
        plan.id,
        user,
        `Направлено ЦФО: ${dto.cfoIds.join(', ')}.`,
      );
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  async cfoApprove(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    const myStatus = plan.cfoStatuses.find((s) => s.cfoId === user.cfoId);
    if (!(user.role === Role.CFO && myStatus)) {
      throw new ForbiddenException();
    }
    if (myStatus.status !== PlanCfoStatusValue.PENDING) {
      throw new BadRequestException(
        'Решение по этому плану уже принято этим ЦФО.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(PlanCfoStatus).update(myStatus.id, {
        status: PlanCfoStatusValue.APPROVED,
        decidedById: user.id,
        decidedAt: new Date(),
      });
      const openRemarks = await manager
        .getRepository(PlanRemark)
        .find({ where: { planId: plan.id, cfoId: user.cfoId! } });
      const toClose = openRemarks.filter(
        (r) => r.status !== PlanRemarkStatus.CLOSED,
      );
      for (const remark of toClose) {
        await manager.getRepository(PlanRemark).update(remark.id, {
          status: PlanRemarkStatus.CLOSED,
          closedById: user.id,
          closedAt: new Date(),
        });
      }
      const cfoLabel =
        plan.cfoStatuses.find((s) => s.id === myStatus.id)?.cfo?.code ?? 'ЦФО';
      const closedNote = toClose.length
        ? ` Закрыты замечания: ${toClose.map((r) => r.humanId).join(', ')}.`
        : '';
      await this.log(
        manager,
        plan.id,
        user,
        `${cfoLabel} согласовал.${closedNote}`,
      );
      await this.recomputeStatusAfterCfoAction(manager, plan.id);
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  /**
   * Создаёт замечание к элементу пакета, не меняя статус плана/ЦФО —
   * проверяющий (ЦФО или ДТОиР) может оставить несколько замечаний к разным
   * элементам за один заход, прежде чем финализировать возврат отдельным
   * действием (`cfoReturn`/`dtoeReturn`).
   */
  async leaveRemark(user: User, humanId: string, dto: PlanRemarkCreateDto) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    let cfoId: number | null = null;
    let issuerLabel = 'ДТОиР';

    if (user.role === Role.CFO) {
      const myStatus = plan.cfoStatuses.find((s) => s.cfoId === user.cfoId);
      if (!myStatus) throw new ForbiddenException();
      if (myStatus.status !== PlanCfoStatusValue.PENDING) {
        throw new BadRequestException(
          'Решение по этому плану уже принято этим ЦФО.',
        );
      }
      cfoId = user.cfoId!;
      issuerLabel = myStatus.cfo?.code ?? 'ЦФО';
    } else if (user.role === Role.DTOE) {
      if (plan.status !== PlanStatus.UNDER_DTOE_REVIEW) {
        throw new BadRequestException(
          'План сейчас не находится на проверке ДТОиР.',
        );
      }
    } else {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      const humanIdForRemark = await this.nextRemarkHumanId(manager);
      const remark = await manager.getRepository(PlanRemark).save({
        humanId: humanIdForRemark,
        planId: plan.id,
        cfoId,
        authorId: user.id,
        description: dto.description,
        requiredAction: dto.requiredAction,
        sheetName: dto.sheetName ?? '',
        rowRef: dto.rowRef ?? '',
        cellRef: dto.cellRef ?? '',
        relatedSlotId: dto.relatedSlotId ?? null,
        fileVersionId: dto.fileVersionId ?? null,
      });
      const slotNote = dto.relatedSlotId
        ? ` (элемент: «${plan.slots.find((s) => s.id === dto.relatedSlotId)?.label ?? ''}»)`
        : '';
      await this.log(
        manager,
        plan.id,
        user,
        `${issuerLabel} оставил замечание ${remark.humanId}${slotNote}.`,
      );
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  async cfoReturn(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    const myStatus = plan.cfoStatuses.find((s) => s.cfoId === user.cfoId);
    if (!(user.role === Role.CFO && myStatus)) {
      throw new ForbiddenException();
    }
    if (myStatus.status !== PlanCfoStatusValue.PENDING) {
      throw new BadRequestException(
        'Решение по этому плану уже принято этим ЦФО.',
      );
    }
    const openRemarks = plan.remarks.filter(
      (r) => r.cfoId === user.cfoId && r.status === PlanRemarkStatus.OPEN,
    );
    if (openRemarks.length === 0) {
      throw new BadRequestException(
        'Нельзя вернуть на доработку без ни одного оставленного замечания.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(PlanCfoStatus).update(myStatus.id, {
        status: PlanCfoStatusValue.RETURNED,
        decidedById: user.id,
        decidedAt: new Date(),
      });
      await manager.getRepository(Plan).update(plan.id, {
        status: PlanStatus.RETURNED_FOR_REVISION,
      });

      const cfoLabel =
        plan.cfoStatuses.find((s) => s.id === myStatus.id)?.cfo?.code ?? 'ЦФО';
      const remarksList = openRemarks.map((r) => r.humanId).join(', ');
      const filialUsers = await this.filialUsers(manager, plan.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        plan.id,
        `${cfoLabel} вернуло план ${plan.humanId} на доработку. Замечания: ${remarksList}.`,
      );
      await this.log(
        manager,
        plan.id,
        user,
        `${cfoLabel} вернул на доработку (замечания: ${remarksList}).`,
      );
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  /**
   * Страховка от случайного клика: откатывает собственное решение этого ЦФО
   * (APPROVED/RETURNED → PENDING). Замечания не трогает — они часть истории
   * согласования. Недоступно, если план уже передан в ДТОиР, — там
   * отменять на уровне ЦФО уже нечего.
   */
  async cancelCfoDecision(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    const myStatus = plan.cfoStatuses.find((s) => s.cfoId === user.cfoId);
    if (!(user.role === Role.CFO && myStatus)) {
      throw new ForbiddenException();
    }
    if (myStatus.status === PlanCfoStatusValue.PENDING) {
      throw new BadRequestException(
        'Решение по этому плану ещё не принято — отменять нечего.',
      );
    }
    const lockedStatuses: PlanStatus[] = [
      PlanStatus.UNDER_DTOE_REVIEW,
      PlanStatus.RETURNED_BY_DTOE,
      PlanStatus.APPROVED_BY_DTOE,
    ];
    if (lockedStatuses.includes(plan.status)) {
      throw new BadRequestException(
        'План уже передан в ДТОиР — отменить решение ЦФО нельзя.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const cfoLabel =
        plan.cfoStatuses.find((s) => s.id === myStatus.id)?.cfo?.code ?? 'ЦФО';
      await manager.getRepository(PlanCfoStatus).update(myStatus.id, {
        status: PlanCfoStatusValue.PENDING,
        decidedById: null,
        decidedAt: null,
      });
      await this.log(
        manager,
        plan.id,
        user,
        `${cfoLabel} отменил своё решение по плану — статус возвращён в «На проверке».`,
      );
      await this.recomputeStatusAfterCfoAction(manager, plan.id);
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  async resubmit(user: User, humanId: string, dto: PlanCfoSelectionDto) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    if (plan.status !== PlanStatus.RETURNED_FOR_REVISION) {
      throw new BadRequestException(
        'Повторно направить можно только план в статусе «Возвращён на доработку».',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      for (const cfoId of dto.cfoIds) {
        const status = await manager
          .getRepository(PlanCfoStatus)
          .findOne({ where: { planId: plan.id, cfoId } });
        if (!status) continue;
        await manager.getRepository(PlanCfoStatus).update(status.id, {
          status: PlanCfoStatusValue.PENDING,
          decidedById: null,
          decidedAt: null,
        });
        const cfoUsers = await this.cfoUsers(manager, cfoId);
        await this.notifyUsers(
          manager,
          cfoUsers,
          plan.id,
          `Филиал «${plan.filial.code}» повторно направил ${plan.humanId}. Проверьте исправления.`,
        );
      }
      await manager
        .getRepository(Plan)
        .update(plan.id, { status: PlanStatus.RESUBMITTED });
      await this.log(
        manager,
        plan.id,
        user,
        `Повторно направлено в: ${dto.cfoIds.join(', ')}.`,
      );
      await this.recomputeStatusAfterCfoAction(manager, plan.id);
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  async reopenRemark(
    user: User,
    humanId: string,
    remarkId: number,
    dto: PlanRemarkReopenDto,
  ) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    const remark = plan.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');
    if (!(user.role === Role.CFO && user.cfoId === remark.cfoId)) {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(PlanRemark).update(remark.id, {
        status: PlanRemarkStatus.REOPENED,
        description: dto.description || remark.description,
        requiredAction: dto.requiredAction || remark.requiredAction,
      });
      const status = await manager.getRepository(PlanCfoStatus).findOne({
        where: { planId: plan.id, cfoId: user.cfoId! },
      });
      if (status) {
        await manager.getRepository(PlanCfoStatus).update(status.id, {
          status: PlanCfoStatusValue.RETURNED,
          decidedById: user.id,
          decidedAt: new Date(),
        });
      }
      await manager.getRepository(Plan).update(plan.id, {
        status: PlanStatus.RETURNED_FOR_REVISION,
      });

      const cfoLabel = remark.cfo?.code ?? 'ЦФО';
      const filialUsers = await this.filialUsers(manager, plan.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        plan.id,
        `${cfoLabel} не подтвердило исправление по ${remark.humanId} в ${plan.humanId}. Требуется доработка.`,
      );
      await this.log(
        manager,
        plan.id,
        user,
        `${cfoLabel} повторно вернул ${remark.humanId} — исправление не принято.`,
      );
    });

    return toPlanRemarkDto(
      await this.remarks.findOneOrFail({ where: { id: remarkId } }),
    );
  }

  async markRemarkFixed(user: User, humanId: string, remarkId: number) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    const remark = plan.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(PlanRemark)
        .update(remark.id, { status: PlanRemarkStatus.FIXED_BY_FILIAL });
      await this.log(
        manager,
        plan.id,
        user,
        `Филиал отметил ${remark.humanId} как исправленное.`,
      );
    });

    return toPlanRemarkDto(
      await this.remarks.findOneOrFail({ where: { id: remarkId } }),
    );
  }

  async deleteRemark(user: User, humanId: string, remarkId: number) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    const remark = plan.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');
    if (!(
      remark.authorId === user.id && remark.status === PlanRemarkStatus.OPEN
    )) {
      throw new ForbiddenException(
        'Удалить можно только собственное открытое замечание.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const label = remark.humanId;
      await manager.getRepository(PlanRemark).delete(remark.id);
      await this.log(
        manager,
        plan.id,
        user,
        `${user.fullName} удалил замечание ${label}.`,
      );
    });
  }

  // ------------------------------------------------------------- queries

  async sendToDtoe(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(
      user.role === Role.CFO &&
      plan.cfoStatuses.some((s) => s.cfoId === user.cfoId)
    )) {
      throw new ForbiddenException();
    }
    if (plan.status !== PlanStatus.ALL_CFO_APPROVED) {
      throw new BadRequestException(
        'Не все обязательные ЦФО согласовали пакет.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Plan).update(plan.id, {
        status: PlanStatus.UNDER_DTOE_REVIEW,
        sentToDtoeAt: new Date(),
      });
      const dtoeUsers = await this.dtoeUsers(manager);
      await this.notifyUsers(
        manager,
        dtoeUsers,
        plan.id,
        `План ${plan.humanId} полностью проверен и согласован всеми ЦФО. Филиал: ${plan.filial.code}.`,
      );
      await this.log(manager, plan.id, user, 'Отправлено в ДТОиР.');
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  async dtoeApprove(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (user.role !== Role.DTOE) throw new ForbiddenException();
    if (plan.status !== PlanStatus.UNDER_DTOE_REVIEW) {
      throw new BadRequestException(
        'План сейчас не находится на проверке ДТОиР.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Plan).update(plan.id, {
        status: PlanStatus.APPROVED_BY_DTOE,
        decidedAt: new Date(),
      });
      const filialUsers = await this.filialUsers(manager, plan.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        plan.id,
        `ДТОиР согласовало план ${plan.humanId}.`,
      );
      await this.log(
        manager,
        plan.id,
        user,
        'ДТОиР согласовало план. Финальный статус: Согласовано ДТОиР.',
      );
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  async dtoeReturn(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (user.role !== Role.DTOE) throw new ForbiddenException();
    if (plan.status !== PlanStatus.UNDER_DTOE_REVIEW) {
      throw new BadRequestException(
        'План сейчас не находится на проверке ДТОиР.',
      );
    }
    const openRemarks = plan.remarks.filter(
      (r) => r.cfoId === null && r.status === PlanRemarkStatus.OPEN,
    );
    if (openRemarks.length === 0) {
      throw new BadRequestException(
        'Нельзя вернуть на доработку без ни одного оставленного замечания.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(Plan)
        .update(plan.id, { status: PlanStatus.RETURNED_BY_DTOE });

      const remarksList = openRemarks.map((r) => r.humanId).join(', ');
      const filialUsers = await this.filialUsers(manager, plan.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        plan.id,
        `ДТОиР вернуло план ${plan.humanId} на доработку. Замечания: ${remarksList}.`,
      );
      await this.log(
        manager,
        plan.id,
        user,
        `ДТОиР вернуло на доработку (замечания: ${remarksList}).`,
      );
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  // ------------------------------------------------------------ mutations

  async resubmitToDtoe(user: User, humanId: string) {
    const plan = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === plan.filialId)) {
      throw new ForbiddenException();
    }
    if (plan.status !== PlanStatus.RETURNED_BY_DTOE) {
      throw new BadRequestException(
        'Повторно направить в ДТОиР можно только план в статусе «Возвращён ДТОиР».',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(Plan)
        .update(plan.id, { status: PlanStatus.UNDER_DTOE_REVIEW });
      const dtoeUsers = await this.dtoeUsers(manager);
      await this.notifyUsers(
        manager,
        dtoeUsers,
        plan.id,
        `Филиал «${plan.filial.code}» повторно направил ${plan.humanId} после замечаний ДТОиР.`,
      );
      await this.log(
        manager,
        plan.id,
        user,
        'Повторно направлено в ДТОиР после исправления замечаний.',
      );
    });

    return this.toDetailDto(await this.loadDetail(plan.id), user);
  }

  private async nextPlanHumanId(manager: EntityManager): Promise<string> {
    await manager.query('CREATE SEQUENCE IF NOT EXISTS plan_human_id_seq');
    const rows = await manager.query<{ nextval: string }[]>(
      "SELECT nextval('plan_human_id_seq') as nextval",
    );
    return `PLN-${String(rows[0].nextval).padStart(6, '0')}`;
  }

  private async nextRemarkHumanId(manager: EntityManager): Promise<string> {
    await manager.query(
      'CREATE SEQUENCE IF NOT EXISTS plan_remark_human_id_seq',
    );
    const rows = await manager.query<{ nextval: string }[]>(
      "SELECT nextval('plan_remark_human_id_seq') as nextval",
    );
    return `PLR-${String(rows[0].nextval).padStart(6, '0')}`;
  }

  private async log(
    manager: EntityManager,
    planId: number,
    user: User | null,
    text: string,
  ) {
    await manager.getRepository(PlanHistoryEntry).insert({
      planId,
      userId: user?.id ?? null,
      text,
    });
  }

  private async notifyUsers(
    manager: EntityManager,
    users: User[],
    planId: number,
    text: string,
  ) {
    if (users.length === 0) return;
    await manager
      .getRepository(Notification)
      .insert(
        users.map((u) => ({ userId: u.id, planId, text, isRead: false })),
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

  private async checkAccess(user: User, plan: Plan): Promise<boolean> {
    if (user.role === Role.FILIAL) return user.filialId === plan.filialId;
    if (user.role === Role.CFO) {
      if (user.cfoId == null) return false;
      return this.cfoStatuses.exist({
        where: { planId: plan.id, cfoId: user.cfoId },
      });
    }
    return user.role === Role.DTOE || user.role === Role.ADMIN;
  }

  private async loadDetail(id: number): Promise<Plan> {
    const plan = await this.plans.findOne({
      where: { id },
      relations: DETAIL_RELATIONS,
    });
    if (!plan) throw new NotFoundException('План не найден');
    return plan;
  }

  private async findByHumanIdOrThrow(humanId: string): Promise<Plan> {
    const plan = await this.plans.findOne({
      where: { humanId },
      relations: DETAIL_RELATIONS,
    });
    if (!plan) throw new NotFoundException('План не найден');
    return plan;
  }

  private checkPackageComplete(plan: Plan): {
    complete: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    const mainSlot = plan.slots.find((s) => s.requirementId == null);
    if (!mainSlot || (mainSlot.versions?.length ?? 0) === 0) {
      missing.push('Excel плана');
    }

    const requiredReqs =
      plan.planType.requirements?.filter((r) => r.isRequired) ?? [];
    const slotFor = (reqId: number) =>
      plan.slots.find((s) => s.requirementId === reqId);
    const isFilled = (req: PlanPackageRequirement) => {
      const slot = slotFor(req.id);
      return !!slot && (slot.versions?.length ?? 0) > 0;
    };

    const groups = new Map<string, PlanPackageRequirement[]>();
    for (const req of requiredReqs) {
      if (!req.choiceGroupKey) {
        if (!isFilled(req)) missing.push(req.name);
        continue;
      }
      groups.set(req.choiceGroupKey, [
        ...(groups.get(req.choiceGroupKey) ?? []),
        req,
      ]);
    }
    for (const reqs of groups.values()) {
      if (!reqs.some(isFilled)) {
        missing.push(
          `${reqs[0].groupLabel} (один из: ${reqs.map((r) => r.name).join(' / ')})`,
        );
      }
    }

    return { complete: missing.length === 0, missing };
  }

  private async toDetailDto(plan: Plan, user: User) {
    const { complete, missing } = this.checkPackageComplete(plan);
    const myCfoStatus =
      user.role === Role.CFO
        ? (plan.cfoStatuses.find((s) => s.cfoId === user.cfoId) ?? null)
        : null;
    const myOpenRemarksCount =
      user.role === Role.CFO
        ? plan.remarks.filter(
            (r) =>
              r.cfoId === user.cfoId && r.status !== PlanRemarkStatus.CLOSED,
          ).length
        : 0;

    const returnedCfoIds = plan.cfoStatuses
      .filter((s) => s.status === PlanCfoStatusValue.RETURNED)
      .map((s) => s.cfo);
    const availableCfoIds = await this.linkedCfoIds(
      this.dataSource.manager,
      plan.filialId,
    );
    const availableCfos = await this.cfos.find({
      where: { id: In(availableCfoIds.length ? availableCfoIds : [-1]) },
    });

    return {
      ...toPlanBaseDto(plan),
      filial: {
        id: plan.filial.id,
        code: plan.filial.code,
        name: plan.filial.name,
        isActive: plan.filial.isActive,
      },
      planType: {
        id: plan.planType.id,
        code: plan.planType.code,
        name: plan.planType.name,
        description: plan.planType.description,
        isActive: plan.planType.isActive,
      },
      author: {
        id: plan.author.id,
        username: plan.author.username,
        fullName: plan.author.fullName,
      },
      slots: sortSlotsByRequirementOrder(plan.slots).map(toPlanDocumentSlotDto),
      cfoStatuses: plan.cfoStatuses.map(toPlanCfoStatusDto),
      remarks: plan.remarks.map(toPlanRemarkDto),
      history: [...plan.history]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(toPlanHistoryEntryDto),
      packageComplete: complete,
      missingRequirements: missing,
      myCfoStatus: myCfoStatus ? toPlanCfoStatusDto(myCfoStatus) : null,
      myOpenRemarksCount,
      isFilialOwner:
        user.role === Role.FILIAL && user.filialId === plan.filialId,
      isCfoReviewer: user.role === Role.CFO && myCfoStatus != null,
      isDtoe: user.role === Role.DTOE,
      availableCfos: availableCfos.map(toCfoDto),
      returnedCfos: returnedCfoIds.map(toCfoDto),
    };
  }

  private async recomputeStatusAfterCfoAction(
    manager: EntityManager,
    planId: number,
  ) {
    const statuses = await manager
      .getRepository(PlanCfoStatus)
      .find({ where: { planId, isRequired: true } });
    let status: PlanStatus;
    if (statuses.some((s) => s.status === PlanCfoStatusValue.RETURNED)) {
      status = PlanStatus.RETURNED_FOR_REVISION;
    } else if (
      statuses.length > 0 &&
      statuses.every((s) => s.status === PlanCfoStatusValue.APPROVED)
    ) {
      status = PlanStatus.ALL_CFO_APPROVED;
    } else if (statuses.some((s) => s.status === PlanCfoStatusValue.APPROVED)) {
      status = PlanStatus.PARTIALLY_APPROVED;
    } else {
      status = PlanStatus.UNDER_CFO_REVIEW;
    }
    await manager.getRepository(Plan).update(planId, { status });

    if (status === PlanStatus.ALL_CFO_APPROVED) {
      const plan = await manager
        .getRepository(Plan)
        .findOneOrFail({ where: { id: planId }, relations: ['filial'] });
      const filialUsers = await this.filialUsers(manager, plan.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        planId,
        `Все ЦФО согласовали план ${plan.humanId}. Ожидает отправки в ДТОиР.`,
      );
      const cfoIds = statuses.map((s) => s.cfoId);
      const cfoUsersToNotify = await manager
        .getRepository(User)
        .find({ where: { role: Role.CFO, cfoId: In(cfoIds), isActive: true } });
      await this.notifyUsers(
        manager,
        cfoUsersToNotify,
        planId,
        `План ${plan.humanId} согласован всеми ЦФО — можно направлять в ДТОиР.`,
      );
    }
  }
}
