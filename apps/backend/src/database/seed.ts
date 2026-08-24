import 'reflect-metadata';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import {
  CfoStatusValue,
  CorrectionCfoStatus,
} from '../corrections/entities/correction-cfo-status.entity';
import { CorrectionFilialStatus } from '../corrections/entities/correction-filial-status.entity';
import { CorrectionHistoryEntry } from '../corrections/entities/correction-history-entry.entity';
import {
  Correction,
  CorrectionStatus,
} from '../corrections/entities/correction.entity';
import { DocumentSlot } from '../corrections/entities/document-slot.entity';
import { FileVersion } from '../corrections/entities/file-version.entity';
import { Remark, RemarkStatus } from '../corrections/entities/remark.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Cfo } from '../org/entities/cfo.entity';
import { CorrectionType } from '../org/entities/correction-type.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { Filial } from '../org/entities/filial.entity';
import {
  PackageRequirement,
  PackageRequirementKind,
} from '../org/entities/package-requirement.entity';
import { Role, User } from '../users/entities/user.entity';

/**
 * Демо-данные для локального запуска: справочники, по одному пользователю на
 * каждую роль и корректировки во всех статусах жизненного цикла (с
 * замечаниями, версиями файлов и уведомлениями), чтобы UI можно было
 * разрабатывать без ручного прохождения сценариев через интерфейс.
 * Продовые данные из Django не мигрируются — см. README.
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'gas_dashboard',
  password: process.env.POSTGRES_PASSWORD ?? 'gas_dashboard',
  database: process.env.POSTGRES_DB ?? 'gas_dashboard',
  entities: [
    Filial,
    Cfo,
    FilialCfoLink,
    CorrectionType,
    PackageRequirement,
    User,
    Correction,
    DocumentSlot,
    FileVersion,
    CorrectionCfoStatus,
    CorrectionFilialStatus,
    Remark,
    CorrectionHistoryEntry,
    Notification,
  ],
  synchronize: true,
});

const DEMO_PASSWORD = 'Password123';
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? 'uploads';

/** Транслит кода в латиницу для email-логина демо-аккаунта. */
const FILIALS: Array<{ code: string; slug: string }> = [
  { code: 'Донбассгаз', slug: 'donbassgaz' },
  { code: 'Луганскгаз', slug: 'luganskgaz' },
  { code: 'Запорожгаз', slug: 'zaporozhgaz' },
  { code: 'Херсонгаз', slug: 'khersongaz' },
];

/** Полный справочник ЦФО (17) — см. глоссарий в корневом AGENTS.md. */
const CFOS: Array<{ code: string; slug: string }> = [
  { code: 'АНГНКС', slug: 'angnks' },
  { code: 'Бухгалтерия', slug: 'buhgalteria' },
  { code: 'ОГМ', slug: 'ogm' },
  { code: 'ОГС', slug: 'ogs' },
  { code: 'ОГЭ', slug: 'oge' },
  { code: 'ОТЭОГС', slug: 'oteogs' },
  { code: 'ПОА', slug: 'poa' },
  { code: 'ПОЗК', slug: 'pozk' },
  { code: 'ПОМО', slug: 'pomo' },
  { code: 'ПОЭКС', slug: 'poeks' },
  { code: 'ПОЭМГ', slug: 'poemg' },
  { code: 'СИУС', slug: 'sius' },
  { code: 'СКЗ', slug: 'skz' },
  { code: 'СОВОФ', slug: 'sovof' },
  { code: 'СППБ', slug: 'sppb' },
  { code: 'ТРО', slug: 'tro' },
  { code: 'ХОСЭЗИС', slug: 'hosezis' },
];

/**
 * Демонстрируемые статусы корректировки — по одной корректировке на статус
 * на каждый филиал (пропущен только технический SENT_TO_DTOE, см.
 * «Статусная модель корректировки» в apps/backend/AGENTS.md).
 */
const DEMO_STATUSES: CorrectionStatus[] = [
  CorrectionStatus.DRAFT,
  CorrectionStatus.UNDER_CFO_REVIEW,
  CorrectionStatus.PARTIALLY_APPROVED,
  CorrectionStatus.RETURNED_FOR_REVISION,
  CorrectionStatus.RESUBMITTED,
  CorrectionStatus.ALL_CFO_APPROVED,
  CorrectionStatus.UNDER_DTOE_REVIEW,
  CorrectionStatus.RETURNED_BY_DTOE,
  CorrectionStatus.APPROVED_BY_DTOE,
];

async function main() {
  await dataSource.initialize();

  const filialRepo = dataSource.getRepository(Filial);
  const cfoRepo = dataSource.getRepository(Cfo);
  const linkRepo = dataSource.getRepository(FilialCfoLink);
  const typeRepo = dataSource.getRepository(CorrectionType);
  const reqRepo = dataSource.getRepository(PackageRequirement);
  const userRepo = dataSource.getRepository(User);
  const correctionRepo = dataSource.getRepository(Correction);
  const slotRepo = dataSource.getRepository(DocumentSlot);
  const fileVersionRepo = dataSource.getRepository(FileVersion);
  const cfoStatusRepo = dataSource.getRepository(CorrectionCfoStatus);
  const remarkRepo = dataSource.getRepository(Remark);
  const historyRepo = dataSource.getRepository(CorrectionHistoryEntry);
  const notificationRepo = dataSource.getRepository(Notification);

  if (await userRepo.exist({ where: {} })) {
    console.log(
      'В базе уже есть пользователи — сид пропущен (не перезаписываю данные).',
    );
    await dataSource.destroy();
    return;
  }

  const filials = await filialRepo.save(
    FILIALS.map(({ code }) => ({ code, name: code })),
  );

  const cfos = await cfoRepo.save(
    CFOS.map(({ code }) => ({ code, name: code })),
  );

  for (const filial of filials) {
    for (const cfo of cfos) {
      await linkRepo.save({
        filialId: filial.id,
        cfoId: cfo.id,
        isActive: true,
      });
    }
  }

  const correctionType = await typeRepo.save({
    code: 'STANDARD',
    name: 'Стандартная корректировка',
    description: 'Базовый тип корректировки для демо-данных',
  });
  const MTR_CHOICE_GROUP = 'mtr_package';
  const MTR_GROUP_LABEL = 'Перечень комплекта МТР (ХС)';
  const requirements = await reqRepo.save([
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.DOCUMENT,
      name: 'Согласованная служебная записка',
      isRequired: true,
      order: 1,
    },
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.DOCUMENT,
      name: 'Пакет обосновывающих документов',
      isRequired: true,
      order: 2,
    },
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.DOCUMENT,
      name: 'Локальный сметный расчёт (ПД)',
      isRequired: true,
      order: 3,
      choiceGroupKey: MTR_CHOICE_GROUP,
      groupLabel: MTR_GROUP_LABEL,
    },
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.DOCUMENT,
      name: 'ХЗ-х ТКП',
      isRequired: true,
      order: 4,
      choiceGroupKey: MTR_CHOICE_GROUP,
      groupLabel: MTR_GROUP_LABEL,
    },
  ]);
  const [reqNote, reqPackage, reqLsr, reqTkp] = requirements;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const filialUsers = await userRepo.save(
    filials.map((filial, i) => ({
      username: `filial.${FILIALS[i].slug}@demo.local`,
      passwordHash,
      role: Role.FILIAL,
      filialId: filial.id,
      firstName: 'Филиал',
      lastName: FILIALS[i].code,
    })),
  );

  const cfoUsers = await userRepo.save(
    cfos.map((cfo, i) => ({
      username: `cfo.${CFOS[i].slug}@demo.local`,
      passwordHash,
      role: Role.CFO,
      cfoId: cfo.id,
      firstName: 'ЦФО',
      lastName: CFOS[i].code,
    })),
  );

  const [dtoeUser] = await userRepo.save([
    {
      username: 'dtoe@demo.local',
      passwordHash,
      role: Role.DTOE,
      firstName: 'ДТОиР',
      lastName: 'Демо',
    },
    {
      username: 'admin@demo.local',
      passwordHash,
      role: Role.ADMIN,
      firstName: 'Админ',
      lastName: 'Демо',
    },
  ]);

  await dataSource.query(
    'CREATE SEQUENCE IF NOT EXISTS correction_human_id_seq',
  );
  await dataSource.query('CREATE SEQUENCE IF NOT EXISTS remark_human_id_seq');

  /** Демо-содержимое версии файла — физически пишется в UPLOADS_DIR, чтобы работало скачивание. */
  async function writeDemoFile(fileName: string, text: string) {
    const dir = path.join(UPLOADS_DIR, 'corrections', 'seed');
    await fs.mkdir(dir, { recursive: true });
    const storageFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;
    const storagePath = path.join(dir, storageFileName);
    await fs.writeFile(storagePath, text);
    return storagePath;
  }

  async function addFileVersion(
    slot: DocumentSlot,
    versionNumber: number,
    fileName: string,
    uploadedBy: User,
    uploadedAt: Date,
    remarkId: number | null = null,
    note = '',
  ) {
    const storagePath = await writeDemoFile(
      fileName,
      `Демо-файл: ${fileName}, слот «${slot.label}», версия ${versionNumber}.`,
    );
    return fileVersionRepo.save({
      slotId: slot.id,
      versionNumber,
      storagePath,
      fileName,
      fileSize: 2048,
      mimeType: fileName.endsWith('.xlsx')
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
      uploadedById: uploadedBy.id,
      remarkId,
      note,
    });
  }

  function daysAgo(days: number, hours = 0) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d;
  }

  /** Круговой подбор ЦФО, чтобы за все корректировки покрыть все 17 ЦФО. */
  let cfoRotation = 0;
  function pickCfos(count: number) {
    const picked: Cfo[] = [];
    for (let i = 0; i < count; i++) {
      picked.push(cfos[(cfoRotation + i) % cfos.length]);
    }
    cfoRotation = (cfoRotation + count) % cfos.length;
    return picked;
  }

  let correctionCounter = 0;

  async function seedCorrection(
    filial: Filial,
    filialUser: User,
    status: CorrectionStatus,
  ) {
    correctionCounter += 1;
    const daysBase = 60 - correctionCounter; // старее по индексу — новее по статусу
    const [humanIdRow] = await dataSource.query<{ nextval: string }[]>(
      "SELECT nextval('correction_human_id_seq') as nextval",
    );
    const humanId = `COR-${String(humanIdRow.nextval).padStart(6, '0')}`;

    const correction = await correctionRepo.save({
      humanId,
      filialId: filial.id,
      correctionTypeId: correctionType.id,
      authorId: filialUser.id,
      status: CorrectionStatus.DRAFT,
      createdAt: daysAgo(daysBase),
    });

    const mainSlot = await slotRepo.save({
      correctionId: correction.id,
      requirementId: null,
      label: 'Excel корректировка',
    });
    const noteSlot = await slotRepo.save({
      correctionId: correction.id,
      requirementId: reqNote.id,
      label: reqNote.name,
    });
    const packageSlot = await slotRepo.save({
      correctionId: correction.id,
      requirementId: reqPackage.id,
      label: reqPackage.name,
    });
    const lsrSlot = await slotRepo.save({
      correctionId: correction.id,
      requirementId: reqLsr.id,
      label: reqLsr.name,
    });
    // ХЗ-х ТКП (reqTkp) получает слот, как и полагается create(), но
    // намеренно без файла — группа МТР считается укомплектованной по
    // reqLsr одному, это демонстрирует правило «выбери один из группы».
    await slotRepo.save({
      correctionId: correction.id,
      requirementId: reqTkp.id,
      label: reqTkp.name,
    });

    await historyRepo.save({
      correctionId: correction.id,
      userId: filialUser.id,
      timestamp: daysAgo(daysBase),
      text: `Филиал создал корректировку ${humanId}.`,
    });

    if (status === CorrectionStatus.DRAFT) {
      // Пакет укомплектован, но ещё не направлен — демонстрирует активную кнопку «Направить».
      await addFileVersion(
        mainSlot,
        1,
        'excel-korrektirovka.xlsx',
        filialUser,
        daysAgo(daysBase),
      );
      await addFileVersion(
        noteSlot,
        1,
        'sluzhebnaya-zapiska.pdf',
        filialUser,
        daysAgo(daysBase),
      );
      await addFileVersion(
        packageSlot,
        1,
        'obosnovanie.pdf',
        filialUser,
        daysAgo(daysBase),
      );
      await addFileVersion(
        lsrSlot,
        1,
        'lokalny-smetny-raschet.pdf',
        filialUser,
        daysAgo(daysBase),
      );
      return;
    }

    // Все статусы после DRAFT: пакет уже укомплектован и направлен.
    await addFileVersion(
      mainSlot,
      1,
      'excel-korrektirovka.xlsx',
      filialUser,
      daysAgo(daysBase, 1),
    );
    await addFileVersion(
      noteSlot,
      1,
      'sluzhebnaya-zapiska.pdf',
      filialUser,
      daysAgo(daysBase, 1),
    );
    await addFileVersion(
      packageSlot,
      1,
      'obosnovanie.pdf',
      filialUser,
      daysAgo(daysBase, 1),
    );
    await addFileVersion(
      lsrSlot,
      1,
      'lokalny-smetny-raschet.pdf',
      filialUser,
      daysAgo(daysBase, 1),
    );

    const [cfoA, cfoB, cfoC] = pickCfos(3);
    const cfoAUser = cfoUsers.find((u) => u.cfoId === cfoA.id)!;
    const cfoBUser = cfoUsers.find((u) => u.cfoId === cfoB.id)!;
    const cfoCUser = cfoUsers.find((u) => u.cfoId === cfoC.id)!;

    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.UNDER_CFO_REVIEW,
      stageNote: 'Направлено на проверку ЦФО',
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: filialUser.id,
      timestamp: daysAgo(daysBase, 2),
      text: `Направлено ЦФО: ${cfoA.id}, ${cfoB.id}, ${cfoC.id}.`,
    });
    for (const [cfo, user] of [
      [cfoA, cfoAUser],
      [cfoB, cfoBUser],
      [cfoC, cfoCUser],
    ] as const) {
      await cfoStatusRepo.save({
        correctionId: correction.id,
        cfoId: cfo.id,
        status: CfoStatusValue.PENDING,
        isRequired: true,
      });
      await notificationRepo.save({
        userId: user.id,
        correctionId: correction.id,
        text: `Новая корректировка от филиала «${filial.code}». ID: ${humanId}. Статус: На проверке.`,
        isRead: status !== CorrectionStatus.UNDER_CFO_REVIEW,
        createdAt: daysAgo(daysBase, 2),
      });
    }

    if (status === CorrectionStatus.UNDER_CFO_REVIEW) return;

    // A согласовывает первым — переход в PARTIALLY_APPROVED.
    const aStatus = await cfoStatusRepo.findOneByOrFail({
      correctionId: correction.id,
      cfoId: cfoA.id,
    });
    await cfoStatusRepo.update(aStatus.id, {
      status: CfoStatusValue.APPROVED,
      decidedById: cfoAUser.id,
      decidedAt: daysAgo(daysBase, 3),
    });
    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.PARTIALLY_APPROVED,
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: cfoAUser.id,
      timestamp: daysAgo(daysBase, 3),
      text: `${cfoA.code} согласовал.`,
    });

    if (status === CorrectionStatus.PARTIALLY_APPROVED) return;

    // B возвращает с замечанием — RETURNED_FOR_REVISION.
    const bStatus = await cfoStatusRepo.findOneByOrFail({
      correctionId: correction.id,
      cfoId: cfoB.id,
    });
    const [remarkIdRow] = await dataSource.query<{ nextval: string }[]>(
      "SELECT nextval('remark_human_id_seq') as nextval",
    );
    const remarkHumanId = `REM-${String(remarkIdRow.nextval).padStart(6, '0')}`;
    const remark = await remarkRepo.save({
      humanId: remarkHumanId,
      correctionId: correction.id,
      cfoId: cfoB.id,
      authorId: cfoBUser.id,
      description:
        'В «Пакете обосновывающих документов» не совпадают суммы с Excel-корректировкой.',
      requiredAction:
        'Приведите суммы в соответствие и перезагрузите документ.',
      relatedSlotId: packageSlot.id,
      status: RemarkStatus.OPEN,
      createdAt: daysAgo(daysBase, 4),
    });
    await cfoStatusRepo.update(bStatus.id, {
      status: CfoStatusValue.RETURNED,
      decidedById: cfoBUser.id,
      decidedAt: daysAgo(daysBase, 4),
    });
    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.RETURNED_FOR_REVISION,
    });
    await notificationRepo.save({
      userId: filialUser.id,
      correctionId: correction.id,
      text: `${cfoB.code} вернуло корректировку ${humanId} на доработку. Замечание ${remarkHumanId} (элемент: «${packageSlot.label}»). ${remark.requiredAction}`,
      isRead: status !== CorrectionStatus.RETURNED_FOR_REVISION,
      createdAt: daysAgo(daysBase, 4),
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: cfoBUser.id,
      timestamp: daysAgo(daysBase, 4),
      text: `${cfoB.code} создал замечание ${remarkHumanId} (элемент: «${packageSlot.label}») и вернул на доработку.`,
    });

    if (status === CorrectionStatus.RETURNED_FOR_REVISION) return;

    // Филиал исправляет и отмечает замечание исправленным, повторно направляет B — RESUBMITTED.
    await addFileVersion(
      packageSlot,
      2,
      'obosnovanie-ispravlenny.pdf',
      filialUser,
      daysAgo(daysBase, 5),
      remark.id,
      'Исправлено по замечанию ' + remarkHumanId,
    );
    await remarkRepo.update(remark.id, {
      status: RemarkStatus.FIXED_BY_FILIAL,
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: filialUser.id,
      timestamp: daysAgo(daysBase, 5),
      text: `Филиал отметил ${remarkHumanId} как исправленное.`,
    });
    await cfoStatusRepo.update(bStatus.id, {
      status: CfoStatusValue.PENDING,
      decidedById: null,
      decidedAt: null,
    });
    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.RESUBMITTED,
    });
    await notificationRepo.save({
      userId: cfoBUser.id,
      correctionId: correction.id,
      text: `Филиал «${filial.code}» повторно направил ${humanId}. Проверьте исправления.`,
      isRead: status !== CorrectionStatus.RESUBMITTED,
      createdAt: daysAgo(daysBase, 5),
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: filialUser.id,
      timestamp: daysAgo(daysBase, 5),
      text: `Повторно направлено в: ${cfoB.id}.`,
    });

    if (status === CorrectionStatus.RESUBMITTED) return;

    // B согласовывает, замечание закрывается, все ЦФО согласовали — ALL_CFO_APPROVED.
    await remarkRepo.update(remark.id, {
      status: RemarkStatus.CLOSED,
      closedById: cfoBUser.id,
      closedAt: daysAgo(daysBase, 6),
    });
    await cfoStatusRepo.update(bStatus.id, {
      status: CfoStatusValue.APPROVED,
      decidedById: cfoBUser.id,
      decidedAt: daysAgo(daysBase, 6),
    });
    const cStatus = await cfoStatusRepo.findOneByOrFail({
      correctionId: correction.id,
      cfoId: cfoC.id,
    });
    await cfoStatusRepo.update(cStatus.id, {
      status: CfoStatusValue.APPROVED,
      decidedById: cfoCUser.id,
      decidedAt: daysAgo(daysBase, 6),
    });
    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.ALL_CFO_APPROVED,
    });
    await historyRepo.save([
      {
        correctionId: correction.id,
        userId: cfoBUser.id,
        timestamp: daysAgo(daysBase, 6),
        text: `${cfoB.code} согласовал. Закрыты замечания: ${remarkHumanId}.`,
      },
      {
        correctionId: correction.id,
        userId: cfoCUser.id,
        timestamp: daysAgo(daysBase, 6),
        text: `${cfoC.code} согласовал.`,
      },
    ]);
    await notificationRepo.save([
      {
        userId: filialUser.id,
        correctionId: correction.id,
        text: `Все ЦФО согласовали корректировку ${humanId}. Ожидает отправки в ДТОиР.`,
        isRead: status !== CorrectionStatus.ALL_CFO_APPROVED,
        createdAt: daysAgo(daysBase, 6),
      },
      ...[cfoAUser, cfoBUser, cfoCUser].map((user) => ({
        userId: user.id,
        correctionId: correction.id,
        text: `Корректировка ${humanId} согласована всеми ЦФО — можно направлять в ДТОиР.`,
        isRead: true,
        createdAt: daysAgo(daysBase, 6),
      })),
    ]);

    if (status === CorrectionStatus.ALL_CFO_APPROVED) return;

    // Один из согласовавших ЦФО направляет в ДТОиР — UNDER_DTOE_REVIEW.
    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.UNDER_DTOE_REVIEW,
      sentToDtoeAt: daysAgo(daysBase, 7),
    });
    await notificationRepo.save({
      userId: dtoeUser.id,
      correctionId: correction.id,
      text: `Корректировка ${humanId} полностью проверена и согласована всеми ЦФО. Филиал: ${filial.code}.`,
      isRead: status !== CorrectionStatus.UNDER_DTOE_REVIEW,
      createdAt: daysAgo(daysBase, 7),
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: cfoAUser.id,
      timestamp: daysAgo(daysBase, 7),
      text: 'Отправлено в ДТОиР.',
    });

    if (status === CorrectionStatus.UNDER_DTOE_REVIEW) return;

    if (status === CorrectionStatus.RETURNED_BY_DTOE) {
      const [dtoeRemarkIdRow] = await dataSource.query<{ nextval: string }[]>(
        "SELECT nextval('remark_human_id_seq') as nextval",
      );
      const dtoeRemarkHumanId = `REM-${String(dtoeRemarkIdRow.nextval).padStart(6, '0')}`;
      const dtoeRemark = await remarkRepo.save({
        humanId: dtoeRemarkHumanId,
        correctionId: correction.id,
        cfoId: null,
        authorId: dtoeUser.id,
        description:
          'В пакете отсутствует актуальная версия Excel-корректировки.',
        requiredAction: 'Загрузите актуальную версию Excel-файла.',
        relatedSlotId: mainSlot.id,
        status: RemarkStatus.OPEN,
        createdAt: daysAgo(daysBase, 8),
      });
      await correctionRepo.update(correction.id, {
        status: CorrectionStatus.RETURNED_BY_DTOE,
      });
      await notificationRepo.save({
        userId: filialUser.id,
        correctionId: correction.id,
        text: `ДТОиР вернуло корректировку ${humanId} на доработку. Замечание ${dtoeRemarkHumanId} (элемент: «${mainSlot.label}»). ${dtoeRemark.requiredAction}`,
        isRead: false,
        createdAt: daysAgo(daysBase, 8),
      });
      await historyRepo.save({
        correctionId: correction.id,
        userId: dtoeUser.id,
        timestamp: daysAgo(daysBase, 8),
        text: `ДТОиР создало замечание ${dtoeRemarkHumanId} (элемент: «${mainSlot.label}») и вернуло на доработку.`,
      });
      return;
    }

    // APPROVED_BY_DTOE — финальный статус.
    await correctionRepo.update(correction.id, {
      status: CorrectionStatus.APPROVED_BY_DTOE,
      decidedAt: daysAgo(daysBase, 8),
    });
    await notificationRepo.save({
      userId: filialUser.id,
      correctionId: correction.id,
      text: `ДТОиР согласовало корректировку ${humanId}.`,
      isRead: true,
      createdAt: daysAgo(daysBase, 8),
    });
    await historyRepo.save({
      correctionId: correction.id,
      userId: dtoeUser.id,
      timestamp: daysAgo(daysBase, 8),
      text: 'ДТОиР согласовало корректировку. Финальный статус: Согласовано ДТОиР.',
    });
  }

  for (const [i, filial] of filials.entries()) {
    for (const status of DEMO_STATUSES) {
      await seedCorrection(filial, filialUsers[i], status);
    }
  }

  console.log(
    `Сид завершён. Аккаунтов: ${filialUsers.length} филиалов + ${cfoUsers.length} ЦФО + dtoe@demo.local + admin@demo.local. ` +
      `Корректировок: ${correctionCounter} (по ${DEMO_STATUSES.length} статусам на каждый из ${filials.length} филиалов). ` +
      `Логины филиалов: ${filialUsers.map((u) => u.username).join(', ')}. ` +
      `Логины ЦФО: ${cfoUsers.map((u) => u.username).join(', ')}. ` +
      `Пароль для всех: ${DEMO_PASSWORD}`,
  );
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
