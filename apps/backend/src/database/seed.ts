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
import { PackageRequirement, PackageRequirementKind } from '../org/entities/package-requirement.entity';
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

async function main() {
  await dataSource.initialize();

  const filialRepo = dataSource.getRepository(Filial);
  const cfoRepo = dataSource.getRepository(Cfo);
  const linkRepo = dataSource.getRepository(FilialCfoLink);
  const typeRepo = dataSource.getRepository(CorrectionType);
  const reqRepo = dataSource.getRepository(PackageRequirement);
  const userRepo = dataSource.getRepository(User);

  if (await userRepo.exist({ where: {} })) {
    console.log('В базе уже есть пользователи — сид пропущен (не перезаписываю данные).');
    await dataSource.destroy();
    return;
  }

  const filials = await filialRepo.save([
    { code: 'Донбассгаз', name: 'Донбассгаз' },
    { code: 'Луганскгаз', name: 'Луганскгаз' },
    { code: 'Запорожгаз', name: 'Запорожгаз' },
    { code: 'Херсонгаз', name: 'Херсонгаз' },
  ]);

  const cfos = await cfoRepo.save([
    { code: 'АНГНКС', name: 'АНГНКС' },
    { code: 'ОГМ', name: 'ОГМ' },
    { code: 'ОТЭОГС', name: 'ОТЭОГС' },
  ]);

  for (const filial of filials) {
    for (const cfo of cfos) {
      await linkRepo.save({ filialId: filial.id, cfoId: cfo.id, isActive: true });
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
  await userRepo.save([
    { username: 'filial', passwordHash, role: Role.FILIAL, filialId: filials[0].id, firstName: 'Филиал', lastName: 'Демо' },
    { username: 'cfo', passwordHash, role: Role.CFO, cfoId: cfos[0].id, firstName: 'ЦФО', lastName: 'Демо' },
    { username: 'dtoe', passwordHash, role: Role.DTOE, firstName: 'ДТОиР', lastName: 'Демо' },
    { username: 'admin', passwordHash, role: Role.ADMIN, firstName: 'Админ', lastName: 'Демо' },
  ]);

  console.log(`Сид завершён. Логины: filial / cfo / dtoe / admin, пароль для всех: ${DEMO_PASSWORD}`);
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
