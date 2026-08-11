import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { Cfo } from '../org/entities/cfo.entity';
import { CorrectionType } from '../org/entities/correction-type.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { PackageRequirement, PackageRequirementKind } from '../org/entities/package-requirement.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Role, User } from '../users/entities/user.entity';
import { CfoSelectionDto } from './dto/cfo-selection.dto';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { FindCorrectionsQueryDto } from './dto/find-corrections-query.dto';
import { RemarkCreateDto } from './dto/remark-create.dto';
import { RemarkReopenDto } from './dto/remark-reopen.dto';
import { CfoStatusValue, CorrectionCfoStatus } from './entities/correction-cfo-status.entity';
import { CorrectionHistoryEntry } from './entities/correction-history-entry.entity';
import { Correction, CorrectionStatus } from './entities/correction.entity';
import { DocumentSlot } from './entities/document-slot.entity';
import { FileVersion } from './entities/file-version.entity';
import { Remark, RemarkStatus } from './entities/remark.entity';
import {
  openRemarksCountOf,
  toCfoDto,
  toCfoStatusDto,
  toCorrectionBaseDto,
  toCorrectionListItemDto,
  toDocumentSlotDto,
  toFileVersionDto,
  toHistoryEntryDto,
  toRemarkDto,
} from './corrections.mapper';

const DETAIL_RELATIONS = [
  'filial',
  'correctionType',
  'author',
  'slots',
  'slots.requirement',
  'slots.versions',
  'cfoStatuses',
  'cfoStatuses.cfo',
  'remarks',
  'remarks.cfo',
  'history',
  'history.user',
];

@Injectable()
export class CorrectionsService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Correction) private corrections: Repository<Correction>,
    @InjectRepository(DocumentSlot) private slots: Repository<DocumentSlot>,
    @InjectRepository(FileVersion) private fileVersions: Repository<FileVersion>,
    @InjectRepository(CorrectionCfoStatus) private cfoStatuses: Repository<CorrectionCfoStatus>,
    @InjectRepository(Remark) private remarks: Repository<Remark>,
    @InjectRepository(CorrectionHistoryEntry) private history: Repository<CorrectionHistoryEntry>,
    @InjectRepository(CorrectionType) private correctionTypes: Repository<CorrectionType>,
    @InjectRepository(FilialCfoLink) private filialCfoLinks: Repository<FilialCfoLink>,
    @InjectRepository(Cfo) private cfos: Repository<Cfo>,
    @InjectRepository(User) private users: Repository<User>,
    private config: ConfigService,
  ) {}

  // ---------------------------------------------------------------- utils

  private async nextCorrectionHumanId(manager: EntityManager): Promise<string> {
    await manager.query('CREATE SEQUENCE IF NOT EXISTS correction_human_id_seq');
    const rows = await manager.query("SELECT nextval('correction_human_id_seq') as nextval");
    return `COR-${String(rows[0].nextval).padStart(6, '0')}`;
  }

  private async nextRemarkHumanId(manager: EntityManager): Promise<string> {
    await manager.query('CREATE SEQUENCE IF NOT EXISTS remark_human_id_seq');
    const rows = await manager.query("SELECT nextval('remark_human_id_seq') as nextval");
    return `REM-${String(rows[0].nextval).padStart(6, '0')}`;
  }

  private async log(manager: EntityManager, correctionId: number, user: User | null, text: string) {
    await manager.getRepository(CorrectionHistoryEntry).insert({
      correctionId,
      userId: user?.id ?? null,
      text,
    });
  }

  private async notifyUsers(manager: EntityManager, users: User[], correctionId: number, text: string) {
    if (users.length === 0) return;
    await manager.getRepository(Notification).insert(
      users.map((u) => ({ userId: u.id, correctionId, text, isRead: false })),
    );
  }

  private cfoUsers(manager: EntityManager, cfoId: number) {
    return manager.getRepository(User).find({ where: { role: Role.CFO, cfoId, isActive: true } });
  }

  private filialUsers(manager: EntityManager, filialId: number) {
    return manager.getRepository(User).find({ where: { role: Role.FILIAL, filialId, isActive: true } });
  }

  private dtoeUsers(manager: EntityManager) {
    return manager.getRepository(User).find({ where: { role: Role.DTOE, isActive: true } });
  }

  private async linkedCfoIds(manager: EntityManager, filialId: number): Promise<number[]> {
    const links = await manager
      .getRepository(FilialCfoLink)
      .find({ where: { filialId, isActive: true }, relations: ['cfo'] });
    return links.filter((l) => l.cfo.isActive).map((l) => l.cfoId);
  }

  private async checkAccess(user: User, correction: Correction): Promise<boolean> {
    if (user.role === Role.FILIAL) return user.filialId === correction.filialId;
    if (user.role === Role.CFO) {
      if (user.cfoId == null) return false;
      return this.cfoStatuses.exist({ where: { correctionId: correction.id, cfoId: user.cfoId } });
    }
    return user.role === Role.DTOE || user.role === Role.ADMIN;
  }

  private async loadDetail(id: number): Promise<Correction> {
    const correction = await this.corrections.findOne({ where: { id }, relations: DETAIL_RELATIONS });
    if (!correction) throw new NotFoundException('Корректировка не найдена');
    return correction;
  }

  private async findByHumanIdOrThrow(humanId: string): Promise<Correction> {
    const correction = await this.corrections.findOne({
      where: { humanId },
      relations: DETAIL_RELATIONS,
    });
    if (!correction) throw new NotFoundException('Корректировка не найдена');
    return correction;
  }

  private checkPackageComplete(correction: Correction): { complete: boolean; missing: string[] } {
    const missing: string[] = [];
    const mainSlot = correction.slots.find((s) => s.requirementId == null);
    if (!mainSlot || (mainSlot.versions?.length ?? 0) === 0) {
      missing.push('Excel корректировка');
    }
    const requiredReqs = correction.correctionType.requirements?.filter((r) => r.isRequired) ?? [];
    for (const req of requiredReqs) {
      const slot = correction.slots.find((s) => s.requirementId === req.id);
      if (!slot || (slot.versions?.length ?? 0) === 0) {
        missing.push(req.name);
      }
    }
    return { complete: missing.length === 0, missing };
  }

  private async toDetailDto(correction: Correction, user: User) {
    const { complete, missing } = this.checkPackageComplete(correction);
    const myCfoStatus =
      user.role === Role.CFO
        ? (correction.cfoStatuses.find((s) => s.cfoId === user.cfoId) ?? null)
        : null;
    const myOpenRemarksCount =
      user.role === Role.CFO
        ? correction.remarks.filter((r) => r.cfoId === user.cfoId && r.status !== RemarkStatus.CLOSED).length
        : 0;

    const returnedCfoIds = correction.cfoStatuses
      .filter((s) => s.status === CfoStatusValue.RETURNED)
      .map((s) => s.cfo);
    const availableCfoIds = await this.linkedCfoIds(this.dataSource.manager, correction.filialId);
    const availableCfos = await this.cfos.find({
      where: { id: In(availableCfoIds.length ? availableCfoIds : [-1]) },
    });

    return {
      ...toCorrectionBaseDto(correction),
      filial: { id: correction.filial.id, code: correction.filial.code, name: correction.filial.name, isActive: correction.filial.isActive },
      correctionType: {
        id: correction.correctionType.id,
        code: correction.correctionType.code,
        name: correction.correctionType.name,
        description: correction.correctionType.description,
        isActive: correction.correctionType.isActive,
      },
      author: { id: correction.author.id, username: correction.author.username, fullName: correction.author.fullName },
      slots: correction.slots.map(toDocumentSlotDto),
      cfoStatuses: correction.cfoStatuses.map(toCfoStatusDto),
      remarks: correction.remarks.map(toRemarkDto),
      history: [...correction.history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map(toHistoryEntryDto),
      packageComplete: complete,
      missingRequirements: missing,
      myCfoStatus: myCfoStatus ? toCfoStatusDto(myCfoStatus) : null,
      myOpenRemarksCount,
      isFilialOwner: user.role === Role.FILIAL && user.filialId === correction.filialId,
      isCfoReviewer: user.role === Role.CFO && myCfoStatus != null,
      isDtoe: user.role === Role.DTOE,
      availableCfos: availableCfos.map(toCfoDto),
      returnedCfos: returnedCfoIds.map(toCfoDto),
    };
  }

  // ------------------------------------------------------------- queries

  async findAll(user: User, query: FindCorrectionsQueryDto) {
    const qb = this.corrections
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.filial', 'filial')
      .leftJoinAndSelect('c.correctionType', 'correctionType')
      .leftJoinAndSelect('c.author', 'author')
      .leftJoinAndSelect('c.remarks', 'remarks');

    if (user.role === Role.FILIAL) {
      qb.andWhere('c.filialId = :filialId', { filialId: user.filialId });
    } else if (user.role === Role.CFO) {
      qb.innerJoin('c.cfoStatuses', 'myStatus', 'myStatus.cfoId = :myCfoId', { myCfoId: user.cfoId ?? -1 });
    }

    if (query.status) qb.andWhere('c.status = :status', { status: query.status });
    if (query.filialId) qb.andWhere('c.filialId = :filialId2', { filialId2: query.filialId });
    if (query.correctionTypeId) qb.andWhere('c.correctionTypeId = :typeId', { typeId: query.correctionTypeId });
    if (query.q) qb.andWhere('c.humanId ILIKE :q', { q: `%${query.q}%` });
    if (query.cfoId) {
      qb.andWhere((sub) => {
        const subQuery = sub
          .subQuery()
          .select('1')
          .from(CorrectionCfoStatus, 'cs')
          .where('cs.correctionId = c.id AND cs.cfoId = :filterCfoId')
          .getQuery();
        return `EXISTS ${subQuery}`;
      }).setParameter('filterCfoId', query.cfoId);
    }

    qb.orderBy('c.updatedAt', 'DESC');

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    let myStatusesByCorrection = new Map<number, CfoStatusValue>();
    if (user.role === Role.CFO && items.length) {
      const rows = await this.cfoStatuses.find({
        where: { correctionId: In(items.map((i) => i.id)), cfoId: user.cfoId ?? -1 },
      });
      myStatusesByCorrection = new Map(rows.map((r) => [r.correctionId, r.status]));
    }

    return {
      items: items.map((c) =>
        toCorrectionListItemDto(c, { myCfoStatus: myStatusesByCorrection.get(c.id) ?? null }),
      ),
      total,
      page,
      pageSize,
    };
  }

  async getStats(user: User) {
    if (user.role === Role.CFO) {
      const rows = await this.cfoStatuses.find({ where: { cfoId: user.cfoId ?? -1 } });
      return {
        total: rows.length,
        inReview: rows.filter((r) => r.status === CfoStatusValue.PENDING).length,
        returned: rows.filter((r) => r.status === CfoStatusValue.RETURNED).length,
        approved: rows.filter((r) => r.status === CfoStatusValue.APPROVED).length,
      };
    }

    const qb = this.corrections.createQueryBuilder('c');
    if (user.role === Role.FILIAL) {
      qb.where('c.filialId = :filialId', { filialId: user.filialId });
    }
    const all = await qb.getMany();
    const inReviewStatuses: CorrectionStatus[] = [
      CorrectionStatus.UNDER_CFO_REVIEW,
      CorrectionStatus.RESUBMITTED,
      CorrectionStatus.PARTIALLY_APPROVED,
      CorrectionStatus.UNDER_DTOE_REVIEW,
    ];
    const returnedStatuses: CorrectionStatus[] = [
      CorrectionStatus.RETURNED_FOR_REVISION,
      CorrectionStatus.RETURNED_BY_DTOE,
    ];
    const base = {
      total: all.length,
      inReview: all.filter((c) => inReviewStatuses.includes(c.status)).length,
      returned: all.filter((c) => returnedStatuses.includes(c.status)).length,
      approved: all.filter((c) => c.status === CorrectionStatus.APPROVED_BY_DTOE).length,
    };

    if (user.role === Role.DTOE || user.role === Role.ADMIN) {
      const openRemarks = await this.remarks.count({ where: { status: In([RemarkStatus.OPEN, RemarkStatus.FIXED_BY_FILIAL, RemarkStatus.REOPENED]) } });
      return {
        ...base,
        underReview: all.filter((c) => c.status === CorrectionStatus.UNDER_DTOE_REVIEW).length,
        openRemarks,
      };
    }
    return base;
  }

  async findOne(user: User, humanId: string) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(await this.checkAccess(user, correction))) {
      throw new ForbiddenException('Нет доступа к этой корректировке');
    }
    return this.toDetailDto(correction, user);
  }

  // ------------------------------------------------------------ mutations

  async create(user: User, dto: CreateCorrectionDto) {
    if (user.role !== Role.FILIAL || user.filialId == null) {
      throw new ForbiddenException('Создавать корректировки может только роль FILIAL');
    }
    const correctionType = await this.correctionTypes.findOne({
      where: { id: dto.correctionTypeId },
      relations: ['requirements'],
    });
    if (!correctionType) throw new NotFoundException('Тип корректировки не найден');

    const id = await this.dataSource.transaction(async (manager) => {
      const humanId = await this.nextCorrectionHumanId(manager);
      const correction = await manager.getRepository(Correction).save({
        humanId,
        filialId: user.filialId!,
        correctionTypeId: correctionType.id,
        authorId: user.id,
        status: CorrectionStatus.DRAFT,
      });

      await manager.getRepository(DocumentSlot).save({
        correctionId: correction.id,
        requirementId: null,
        label: 'Excel корректировка',
      });
      const packageSlots = correctionType.requirements.filter((r) =>
        [PackageRequirementKind.EXCEL_SHEET, PackageRequirementKind.DOCUMENT].includes(r.kind),
      );
      for (const req of packageSlots) {
        await manager.getRepository(DocumentSlot).save({
          correctionId: correction.id,
          requirementId: req.id,
          label: req.name,
        });
      }

      await this.log(manager, correction.id, user, `Филиал создал корректировку ${humanId}.`);
      return correction.id;
    });

    return this.toDetailDto(await this.loadDetail(id), user);
  }

  async uploadFileVersion(
    user: User,
    humanId: string,
    slotId: number,
    file: Express.Multer.File,
    note: string | undefined,
    remarkId: number | undefined,
  ) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === correction.filialId)) {
      throw new ForbiddenException();
    }
    const slot = correction.slots.find((s) => s.id === slotId);
    if (!slot) throw new NotFoundException('Ячейка пакета не найдена');

    const dir = path.join(
      this.config.get('UPLOADS_DIR', 'uploads'),
      'corrections',
      String(new Date().getFullYear()),
      String(new Date().getMonth() + 1).padStart(2, '0'),
    );
    await fs.mkdir(dir, { recursive: true });
    const storageFileName = `${Date.now()}-${file.originalname}`;
    await fs.writeFile(path.join(dir, storageFileName), file.buffer);

    const version = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(FileVersion);
      const last = await versionRepo.findOne({ where: { slotId }, order: { versionNumber: 'DESC' } });
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
      await this.log(manager, correction.id, user, `Загружена версия ${saved.versionNumber} файла «${slot.label}».`);
      return saved;
    });

    return toFileVersionDto(version);
  }

  async downloadFileVersion(user: User, id: number) {
    const version = await this.fileVersions.findOne({ where: { id }, relations: ['slot', 'slot.correction'] });
    if (!version) throw new NotFoundException();
    const correction = await this.findByHumanIdOrThrow(version.slot.correction.humanId);
    if (!(await this.checkAccess(user, correction))) {
      throw new ForbiddenException();
    }
    const buffer = await fs.readFile(version.storagePath);
    return { buffer, fileName: version.fileName, mimeType: version.mimeType || 'application/octet-stream' };
  }

  async send(user: User, humanId: string, dto: CfoSelectionDto) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === correction.filialId)) {
      throw new ForbiddenException();
    }
    const { complete, missing } = this.checkPackageComplete(correction);
    if (!complete) {
      throw new BadRequestException(`Пакет не укомплектован: ${missing.join(', ')}`);
    }
    const allowedIds = await this.linkedCfoIds(this.dataSource.manager, correction.filialId);
    for (const cfoId of dto.cfoIds) {
      if (!allowedIds.includes(cfoId)) {
        throw new BadRequestException('Выбранный ЦФО не привязан к филиалу. Обратитесь к администратору.');
      }
    }

    await this.dataSource.transaction(async (manager) => {
      for (const cfoId of dto.cfoIds) {
        const existing = await manager
          .getRepository(CorrectionCfoStatus)
          .findOne({ where: { correctionId: correction.id, cfoId } });
        if (existing) {
          await manager.getRepository(CorrectionCfoStatus).update(existing.id, {
            status: CfoStatusValue.PENDING,
            isRequired: true,
            decidedById: null,
            decidedAt: null,
          });
        } else {
          await manager.getRepository(CorrectionCfoStatus).save({
            correctionId: correction.id,
            cfoId,
            status: CfoStatusValue.PENDING,
            isRequired: true,
          });
        }
        const cfoUsers = await this.cfoUsers(manager, cfoId);
        await this.notifyUsers(
          manager,
          cfoUsers,
          correction.id,
          `Новая корректировка от филиала «${correction.filial.code}». ID: ${correction.humanId}. Статус: На проверке.`,
        );
      }
      await manager.getRepository(Correction).update(correction.id, {
        status: CorrectionStatus.UNDER_CFO_REVIEW,
        stageNote: 'Направлено на проверку ЦФО',
      });
      await this.log(manager, correction.id, user, `Направлено ЦФО: ${dto.cfoIds.join(', ')}.`);
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  private async recomputeStatusAfterCfoAction(manager: EntityManager, correctionId: number) {
    const statuses = await manager
      .getRepository(CorrectionCfoStatus)
      .find({ where: { correctionId, isRequired: true } });
    let status: CorrectionStatus;
    if (statuses.some((s) => s.status === CfoStatusValue.RETURNED)) {
      status = CorrectionStatus.RETURNED_FOR_REVISION;
    } else if (statuses.length > 0 && statuses.every((s) => s.status === CfoStatusValue.APPROVED)) {
      status = CorrectionStatus.ALL_CFO_APPROVED;
    } else if (statuses.some((s) => s.status === CfoStatusValue.APPROVED)) {
      status = CorrectionStatus.PARTIALLY_APPROVED;
    } else {
      status = CorrectionStatus.UNDER_CFO_REVIEW;
    }
    await manager.getRepository(Correction).update(correctionId, { status });

    if (status === CorrectionStatus.ALL_CFO_APPROVED) {
      const correction = await manager.getRepository(Correction).findOneOrFail({ where: { id: correctionId } });
      const filialUsers = await this.filialUsers(manager, correction.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        correctionId,
        `Все ЦФО согласовали корректировку ${correction.humanId}. Ожидает отправки в ДТОиР.`,
      );
      const cfoIds = statuses.map((s) => s.cfoId);
      const cfoUsersToNotify = await manager
        .getRepository(User)
        .find({ where: { role: Role.CFO, cfoId: In(cfoIds), isActive: true } });
      await this.notifyUsers(
        manager,
        cfoUsersToNotify,
        correctionId,
        `Корректировка ${correction.humanId} согласована всеми ЦФО — можно направлять в ДТОиР.`,
      );
    }
  }

  async cfoApprove(user: User, humanId: string) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    const myStatus = correction.cfoStatuses.find((s) => s.cfoId === user.cfoId);
    if (!(user.role === Role.CFO && myStatus)) {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(CorrectionCfoStatus).update(myStatus.id, {
        status: CfoStatusValue.APPROVED,
        decidedById: user.id,
        decidedAt: new Date(),
      });
      const openRemarks = await manager
        .getRepository(Remark)
        .find({ where: { correctionId: correction.id, cfoId: user.cfoId! } });
      const toClose = openRemarks.filter((r) => r.status !== RemarkStatus.CLOSED);
      for (const remark of toClose) {
        await manager
          .getRepository(Remark)
          .update(remark.id, { status: RemarkStatus.CLOSED, closedById: user.id, closedAt: new Date() });
      }
      const cfoLabel = correction.cfoStatuses.find((s) => s.id === myStatus.id)?.cfo?.code ?? 'ЦФО';
      const closedNote = toClose.length ? ` Закрыты замечания: ${toClose.map((r) => r.humanId).join(', ')}.` : '';
      await this.log(manager, correction.id, user, `${cfoLabel} согласовал.${closedNote}`);
      await this.recomputeStatusAfterCfoAction(manager, correction.id);
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  async cfoReturn(user: User, humanId: string, dto: RemarkCreateDto) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    const myStatus = correction.cfoStatuses.find((s) => s.cfoId === user.cfoId);
    if (!(user.role === Role.CFO && myStatus)) {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      const humanIdForRemark = await this.nextRemarkHumanId(manager);
      const remark = await manager.getRepository(Remark).save({
        humanId: humanIdForRemark,
        correctionId: correction.id,
        cfoId: user.cfoId!,
        authorId: user.id,
        description: dto.description,
        requiredAction: dto.requiredAction,
        sheetName: dto.sheetName ?? '',
        rowRef: dto.rowRef ?? '',
        cellRef: dto.cellRef ?? '',
        relatedSlotId: dto.relatedSlotId ?? null,
        fileVersionId: dto.fileVersionId ?? null,
      });
      await manager.getRepository(CorrectionCfoStatus).update(myStatus.id, {
        status: CfoStatusValue.RETURNED,
        decidedById: user.id,
        decidedAt: new Date(),
      });
      await manager.getRepository(Correction).update(correction.id, { status: CorrectionStatus.RETURNED_FOR_REVISION });

      const cfoLabel = correction.cfoStatuses.find((s) => s.id === myStatus.id)?.cfo?.code ?? 'ЦФО';
      const slotNote = dto.relatedSlotId
        ? ` (элемент: «${correction.slots.find((s) => s.id === dto.relatedSlotId)?.label ?? ''}»)`
        : '';
      const filialUsers = await this.filialUsers(manager, correction.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        correction.id,
        `${cfoLabel} вернуло корректировку ${correction.humanId} на доработку. Замечание ${remark.humanId}${slotNote}. ${dto.requiredAction}`,
      );
      await this.log(manager, correction.id, user, `${cfoLabel} создал замечание ${remark.humanId}${slotNote} и вернул на доработку.`);
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  async resubmit(user: User, humanId: string, dto: CfoSelectionDto) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === correction.filialId)) {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      for (const cfoId of dto.cfoIds) {
        const status = await manager
          .getRepository(CorrectionCfoStatus)
          .findOne({ where: { correctionId: correction.id, cfoId } });
        if (!status) continue;
        await manager
          .getRepository(CorrectionCfoStatus)
          .update(status.id, { status: CfoStatusValue.PENDING, decidedById: null, decidedAt: null });
        const cfoUsers = await this.cfoUsers(manager, cfoId);
        await this.notifyUsers(
          manager,
          cfoUsers,
          correction.id,
          `Филиал «${correction.filial.code}» повторно направил ${correction.humanId}. Проверьте исправления.`,
        );
      }
      await manager.getRepository(Correction).update(correction.id, { status: CorrectionStatus.RESUBMITTED });
      await this.log(manager, correction.id, user, `Повторно направлено в: ${dto.cfoIds.join(', ')}.`);
      await this.recomputeStatusAfterCfoAction(manager, correction.id);
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  async reopenRemark(user: User, humanId: string, remarkId: number, dto: RemarkReopenDto) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    const remark = correction.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');
    if (!(user.role === Role.CFO && user.cfoId === remark.cfoId)) {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Remark).update(remark.id, {
        status: RemarkStatus.REOPENED,
        description: dto.description || remark.description,
        requiredAction: dto.requiredAction || remark.requiredAction,
      });
      const status = await manager
        .getRepository(CorrectionCfoStatus)
        .findOne({ where: { correctionId: correction.id, cfoId: user.cfoId! } });
      if (status) {
        await manager
          .getRepository(CorrectionCfoStatus)
          .update(status.id, { status: CfoStatusValue.RETURNED, decidedById: user.id, decidedAt: new Date() });
      }
      await manager.getRepository(Correction).update(correction.id, { status: CorrectionStatus.RETURNED_FOR_REVISION });

      const cfoLabel = remark.cfo?.code ?? 'ЦФО';
      const filialUsers = await this.filialUsers(manager, correction.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        correction.id,
        `${cfoLabel} не подтвердило исправление по ${remark.humanId} в ${correction.humanId}. Требуется доработка.`,
      );
      await this.log(manager, correction.id, user, `${cfoLabel} повторно вернул ${remark.humanId} — исправление не принято.`);
    });

    return toRemarkDto((await this.remarks.findOneOrFail({ where: { id: remarkId } })));
  }

  async markRemarkFixed(user: User, humanId: string, remarkId: number) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === correction.filialId)) {
      throw new ForbiddenException();
    }
    const remark = correction.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Remark).update(remark.id, { status: RemarkStatus.FIXED_BY_FILIAL });
      await this.log(manager, correction.id, user, `Филиал отметил ${remark.humanId} как исправленное.`);
    });

    return toRemarkDto(await this.remarks.findOneOrFail({ where: { id: remarkId } }));
  }

  async deleteRemark(user: User, humanId: string, remarkId: number) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    const remark = correction.remarks.find((r) => r.id === remarkId);
    if (!remark) throw new NotFoundException('Замечание не найдено');
    if (!(remark.authorId === user.id && remark.status === RemarkStatus.OPEN)) {
      throw new ForbiddenException('Удалить можно только собственное открытое замечание.');
    }

    await this.dataSource.transaction(async (manager) => {
      const label = remark.humanId;
      await manager.getRepository(Remark).delete(remark.id);
      await this.log(manager, correction.id, user, `${user.fullName} удалил замечание ${label}.`);
    });
  }

  async sendToDtoe(user: User, humanId: string) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.CFO && correction.cfoStatuses.some((s) => s.cfoId === user.cfoId))) {
      throw new ForbiddenException();
    }
    if (correction.status !== CorrectionStatus.ALL_CFO_APPROVED) {
      throw new BadRequestException('Не все обязательные ЦФО согласовали пакет.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Correction).update(correction.id, {
        status: CorrectionStatus.UNDER_DTOE_REVIEW,
        sentToDtoeAt: new Date(),
      });
      const dtoeUsers = await this.dtoeUsers(manager);
      await this.notifyUsers(
        manager,
        dtoeUsers,
        correction.id,
        `Корректировка ${correction.humanId} полностью проверена и согласована всеми ЦФО. Филиал: ${correction.filial.code}.`,
      );
      await this.log(manager, correction.id, user, 'Отправлено в ДТОиР.');
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  async dtoeApprove(user: User, humanId: string) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (user.role !== Role.DTOE) throw new ForbiddenException();

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(Correction)
        .update(correction.id, { status: CorrectionStatus.APPROVED_BY_DTOE, decidedAt: new Date() });
      const filialUsers = await this.filialUsers(manager, correction.filialId);
      await this.notifyUsers(manager, filialUsers, correction.id, `ДТОиР согласовало корректировку ${correction.humanId}.`);
      await this.log(manager, correction.id, user, 'ДТОиР согласовало корректировку. Финальный статус: Согласовано ДТОиР.');
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  async dtoeReturn(user: User, humanId: string, dto: RemarkCreateDto) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (user.role !== Role.DTOE) throw new ForbiddenException();

    await this.dataSource.transaction(async (manager) => {
      const humanIdForRemark = await this.nextRemarkHumanId(manager);
      const remark = await manager.getRepository(Remark).save({
        humanId: humanIdForRemark,
        correctionId: correction.id,
        cfoId: null,
        authorId: user.id,
        description: dto.description,
        requiredAction: dto.requiredAction,
        sheetName: dto.sheetName ?? '',
        rowRef: dto.rowRef ?? '',
        cellRef: dto.cellRef ?? '',
        relatedSlotId: dto.relatedSlotId ?? null,
        fileVersionId: dto.fileVersionId ?? null,
      });
      await manager.getRepository(Correction).update(correction.id, { status: CorrectionStatus.RETURNED_BY_DTOE });

      const slotNote = dto.relatedSlotId
        ? ` (элемент: «${correction.slots.find((s) => s.id === dto.relatedSlotId)?.label ?? ''}»)`
        : '';
      const filialUsers = await this.filialUsers(manager, correction.filialId);
      await this.notifyUsers(
        manager,
        filialUsers,
        correction.id,
        `ДТОиР вернуло корректировку ${correction.humanId} на доработку. Замечание ${remark.humanId}${slotNote}. ${dto.requiredAction}`,
      );
      await this.log(manager, correction.id, user, `ДТОиР создало замечание ${remark.humanId}${slotNote} и вернуло на доработку.`);
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }

  async resubmitToDtoe(user: User, humanId: string) {
    const correction = await this.findByHumanIdOrThrow(humanId);
    if (!(user.role === Role.FILIAL && user.filialId === correction.filialId)) {
      throw new ForbiddenException();
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Correction).update(correction.id, { status: CorrectionStatus.UNDER_DTOE_REVIEW });
      const dtoeUsers = await this.dtoeUsers(manager);
      await this.notifyUsers(
        manager,
        dtoeUsers,
        correction.id,
        `Филиал «${correction.filial.code}» повторно направил ${correction.humanId} после замечаний ДТОиР.`,
      );
      await this.log(manager, correction.id, user, 'Повторно направлено в ДТОиР после исправления замечаний.');
    });

    return this.toDetailDto(await this.loadDetail(correction.id), user);
  }
}
