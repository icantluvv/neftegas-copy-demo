import 'reflect-metadata';

import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import { CorrectionHistoryEntry } from '../corrections/entities/correction-history-entry.entity';
import { Correction } from '../corrections/entities/correction.entity';
import { CorrectionCfoStatus } from '../corrections/entities/correction-cfo-status.entity';
import { DocumentSlot } from '../corrections/entities/document-slot.entity';
import { FileVersion } from '../corrections/entities/file-version.entity';
import { Remark } from '../corrections/entities/remark.entity';
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
 * Демо-данные для локального запуска: справочники + по одному пользователю
 * на каждую роль. Продовые данные из Django не мигрируются — см. README.
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
    Remark,
    CorrectionHistoryEntry,
    Notification,
  ],
  synchronize: true,
});

const DEMO_PASSWORD = 'Password123';

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
  { code: 'СОРиСОФ', slug: 'sorisof' },
  { code: 'СППБ', slug: 'sppb' },
  { code: 'ТРО', slug: 'tro' },
  { code: 'ХОСЭЗИС', slug: 'hosezis' },
];

async function main() {
  await dataSource.initialize();

  const filialRepo = dataSource.getRepository(Filial);
  const cfoRepo = dataSource.getRepository(Cfo);
  const linkRepo = dataSource.getRepository(FilialCfoLink);
  const typeRepo = dataSource.getRepository(CorrectionType);
  const reqRepo = dataSource.getRepository(PackageRequirement);
  const userRepo = dataSource.getRepository(User);

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
  await reqRepo.save([
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.EXCEL_SHEET,
      name: 'D-листы',
      isRequired: true,
      order: 1,
    },
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.DOCUMENT,
      name: 'ДОО',
      isRequired: true,
      order: 2,
    },
    {
      correctionTypeId: correctionType.id,
      kind: PackageRequirementKind.DOCUMENT,
      name: 'Дефектная ведомость',
      isRequired: false,
      order: 3,
    },
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const filialUsers = filials.map((filial, i) => ({
    username: `filial.${FILIALS[i].slug}@demo.local`,
    passwordHash,
    role: Role.FILIAL,
    filialId: filial.id,
    firstName: 'Филиал',
    lastName: FILIALS[i].code,
  }));

  const cfoUsers = cfos.map((cfo, i) => ({
    username: `cfo.${CFOS[i].slug}@demo.local`,
    passwordHash,
    role: Role.CFO,
    cfoId: cfo.id,
    firstName: 'ЦФО',
    lastName: CFOS[i].code,
  }));

  await userRepo.save([
    ...filialUsers,
    ...cfoUsers,
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

  console.log(
    `Сид завершён. Аккаунтов: ${filialUsers.length} филиалов + ${cfoUsers.length} ЦФО + dtoe@demo.local + admin@demo.local. ` +
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
