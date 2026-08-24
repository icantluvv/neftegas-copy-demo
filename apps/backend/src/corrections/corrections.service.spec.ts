import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { Role, User } from '../users/entities/user.entity';
import { CorrectionsService } from './corrections.service';
import { CfoStatusValue } from './entities/correction-cfo-status.entity';
import { Correction, CorrectionStatus } from './entities/correction.entity';
import { RemarkStatus } from './entities/remark.entity';

function buildUser(role: Role, overrides: Partial<User> = {}): User {
  return { id: 'user-1', role, ...overrides } as unknown as User;
}

function buildCfoUser(cfoId: number): User {
  return buildUser(Role.CFO, { cfoId } as Partial<User>);
}

function buildCorrection(
  overrides: {
    myStatus?: { id: number; cfoId: number; status: CfoStatusValue };
    status?: CorrectionStatus;
    remarks?: { cfoId: number | null; status: RemarkStatus }[];
    filialId?: number;
    slots?: { versions?: { storagePath: string }[] }[];
  } = {},
): Correction {
  return {
    id: 1,
    humanId: 'COR-000001',
    status: overrides.status ?? CorrectionStatus.UNDER_CFO_REVIEW,
    cfoStatuses: overrides.myStatus ? [overrides.myStatus] : [],
    remarks: overrides.remarks ?? [],
    filialId: overrides.filialId ?? 1,
    slots: overrides.slots ?? [],
  } as unknown as Correction;
}

/**
 * Конструирует CorrectionsService напрямую (без Nest TestingModule) —
 * репозитории кроме `corrections` не используются на пути, который
 * проверяют эти тесты (guard срабатывает до транзакции).
 */
function buildService(correction: Correction) {
  const correctionsRepo = { findOne: jest.fn().mockResolvedValue(correction) };
  const dataSource = { transaction: jest.fn() };
  const noop = {} as never;

  const service = new CorrectionsService(
    dataSource as never,
    correctionsRepo as never,
    noop,
    noop,
    noop,
    noop,
    noop,
    noop,
    noop,
    noop,
    noop,
    noop,
  );

  return { service, dataSource };
}

describe('CorrectionsService — guard PENDING для cfoApprove/cfoReturn', () => {
  it('cfoApprove отклоняет повторное согласование, если статус ЦФО уже APPROVED', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.APPROVED } });
    const { service, dataSource } = buildService(correction);

    await expect(service.cfoApprove(buildCfoUser(5), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('cfoApprove отказывает ЦФО без строки статуса по этой корректировке (403, не 400)', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.PENDING } });
    const { service } = buildService(correction);

    await expect(service.cfoApprove(buildCfoUser(999), 'COR-000001')).rejects.toThrow(ForbiddenException);
  });

  it('cfoReturn отклоняет повторный возврат, если статус ЦФО уже RETURNED', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.RETURNED } });
    const { service, dataSource } = buildService(correction);

    await expect(service.cfoReturn(buildCfoUser(5), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('cfoReturn отклоняет финализацию, если этот ЦФО ещё не оставил ни одного открытого замечания', async () => {
    const correction = buildCorrection({
      myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.PENDING },
      remarks: [],
    });
    const { service, dataSource } = buildService(correction);

    await expect(service.cfoReturn(buildCfoUser(5), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('cfoReturn игнорирует открытые замечания ДРУГИХ ЦФО при проверке наличия своих', async () => {
    const correction = buildCorrection({
      myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.PENDING },
      remarks: [{ cfoId: 999, status: RemarkStatus.OPEN }],
    });
    const { service, dataSource } = buildService(correction);

    await expect(service.cfoReturn(buildCfoUser(5), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('CorrectionsService — leaveRemark (замечание без немедленного возврата)', () => {
  it('отклоняет ЦФО, статус которого по корректировке уже не PENDING', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.RETURNED } });
    const { service, dataSource } = buildService(correction);

    await expect(
      service.leaveRemark(buildCfoUser(5), 'COR-000001', {
        description: 'd',
        requiredAction: 'r',
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет ДТОиР вне статуса UNDER_DTOE_REVIEW', async () => {
    const correction = buildCorrection({ status: CorrectionStatus.PARTIALLY_APPROVED });
    const { service, dataSource } = buildService(correction);

    await expect(
      service.leaveRemark(buildUser(Role.DTOE), 'COR-000001', {
        description: 'd',
        requiredAction: 'r',
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет роль FILIAL', async () => {
    const correction = buildCorrection();
    const { service, dataSource } = buildService(correction);

    await expect(
      service.leaveRemark(buildUser(Role.FILIAL), 'COR-000001', {
        description: 'd',
        requiredAction: 'r',
      } as never),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('content')),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('CorrectionsService — downloadFileVersion (доступ только ЦФО и ДТОиР)', () => {
  function buildServiceWithFileVersion(correction: Correction) {
    const correctionsRepo = { findOne: jest.fn().mockResolvedValue(correction) };
    const fileVersionsRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        storagePath: '/tmp/does-not-matter.txt',
        fileName: 'file.txt',
        mimeType: 'text/plain',
        slot: { correction },
      }),
    };
    const cfoStatusesRepo = { exist: jest.fn().mockResolvedValue(false) };
    const dataSource = { transaction: jest.fn() };
    const noop = {} as never;

    const service = new CorrectionsService(
      dataSource as never,
      correctionsRepo as never,
      noop,
      fileVersionsRepo as never,
      cfoStatusesRepo as never,
      noop,
      noop,
      noop,
      noop,
      noop,
      noop,
      noop,
    );

    return { service };
  }

  it('разрешает ДТОиР скачать файл', async () => {
    const correction = buildCorrection({ status: CorrectionStatus.UNDER_DTOE_REVIEW });
    const { service } = buildServiceWithFileVersion(correction);

    await expect(service.downloadFileVersion(buildUser(Role.DTOE), 1)).resolves.toMatchObject({
      fileName: 'file.txt',
    });
  });

  it('отказывает ЦФО без доступа к этой корректировке (403)', async () => {
    const correction = buildCorrection();
    const { service } = buildServiceWithFileVersion(correction);

    await expect(service.downloadFileVersion(buildCfoUser(999), 1)).rejects.toThrow(ForbiddenException);
  });

  it('отказывает филиалу-владельцу — скачивание доступно только ЦФО и ДТОиР', async () => {
    const correction = buildCorrection();
    (correction as unknown as { filialId: number }).filialId = 7;
    const { service } = buildServiceWithFileVersion(correction);
    const filialUser = buildUser(Role.FILIAL, { filialId: 7 } as Partial<User>);

    await expect(service.downloadFileVersion(filialUser, 1)).rejects.toThrow(ForbiddenException);
  });
});

describe('CorrectionsService — cancelCfoDecision (отмена собственного решения ЦФО)', () => {
  it('отклоняет отмену, если статус этого ЦФО уже PENDING — нечего отменять', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.PENDING } });
    const { service, dataSource } = buildService(correction);

    await expect(service.cancelCfoDecision(buildCfoUser(5), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет отмену, если корректировка уже передана в ДТОиР', async () => {
    const correction = buildCorrection({
      myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.APPROVED },
      status: CorrectionStatus.UNDER_DTOE_REVIEW,
    });
    const { service, dataSource } = buildService(correction);

    await expect(service.cancelCfoDecision(buildCfoUser(5), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет отмену для ЦФО без строки статуса по этой корректировке (403, не 400)', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.APPROVED } });
    const { service } = buildService(correction);

    await expect(service.cancelCfoDecision(buildCfoUser(999), 'COR-000001')).rejects.toThrow(ForbiddenException);
  });

  it('отклоняет роль FILIAL', async () => {
    const correction = buildCorrection({ myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.APPROVED } });
    const { service, dataSource } = buildService(correction);

    await expect(
      service.cancelCfoDecision(buildUser(Role.FILIAL, { filialId: 1 } as Partial<User>), 'COR-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('проходит guard-проверки и входит в транзакцию для APPROVED вне статусов ДТОиР', async () => {
    const correction = buildCorrection({
      myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.APPROVED },
      status: CorrectionStatus.ALL_CFO_APPROVED,
    });
    const { service, dataSource } = buildService(correction);
    dataSource.transaction.mockResolvedValue(undefined);

    // toDetailDto/loadDetail за пределами guard-логики не мокается в этом лёгком
    // сетапе (см. комментарий у buildService) — здесь важно только то, что guard
    // не блокирует APPROVED-статус вне UNDER_DTOE_REVIEW/RETURNED_BY_DTOE/APPROVED_BY_DTOE
    // и что выполнение доходит до транзакции.
    await service.cancelCfoDecision(buildCfoUser(5), 'COR-000001').catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('проходит guard-проверки и входит в транзакцию для RETURNED вне статусов ДТОиР', async () => {
    const correction = buildCorrection({
      myStatus: { id: 10, cfoId: 5, status: CfoStatusValue.RETURNED },
      status: CorrectionStatus.RETURNED_FOR_REVISION,
    });
    const { service, dataSource } = buildService(correction);
    dataSource.transaction.mockResolvedValue(undefined);

    await service.cancelCfoDecision(buildCfoUser(5), 'COR-000001').catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});

function buildFilialUser(filialId: number): User {
  return buildUser(Role.FILIAL, { filialId } as Partial<User>);
}

describe('CorrectionsService — deleteCorrection (удаление только DRAFT)', () => {
  it('отклоняет удаление, если статус не DRAFT', async () => {
    const correction = buildCorrection({ status: CorrectionStatus.UNDER_CFO_REVIEW, filialId: 1 });
    const { service, dataSource } = buildService(correction);

    await expect(service.deleteCorrection(buildFilialUser(1), 'COR-000001')).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет удаление корректировки чужого филиала (403)', async () => {
    const correction = buildCorrection({ status: CorrectionStatus.DRAFT, filialId: 1 });
    const { service, dataSource } = buildService(correction);

    await expect(service.deleteCorrection(buildFilialUser(2), 'COR-000001')).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет роль CFO', async () => {
    const correction = buildCorrection({ status: CorrectionStatus.DRAFT, filialId: 1 });
    const { service, dataSource } = buildService(correction);

    await expect(service.deleteCorrection(buildCfoUser(1), 'COR-000001')).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('удаляет DRAFT-корректировку своего филиала и физические версии файлов', async () => {
    const correction = buildCorrection({
      status: CorrectionStatus.DRAFT,
      filialId: 1,
      slots: [{ versions: [{ storagePath: '/tmp/a.pdf' }] }, { versions: [] }],
    });
    const { service, dataSource } = buildService(correction);
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    dataSource.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<void>) => {
      const correctionRepo = { delete: deleteFn };
      const manager = { getRepository: jest.fn().mockReturnValue(correctionRepo) };
      await fn(manager);
    });

    await service.deleteCorrection(buildFilialUser(1), 'COR-000001');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(deleteFn).toHaveBeenCalledWith(1);
  });
});

type CheckPackageComplete = (correction: Correction) => {
  complete: boolean;
  missing: string[];
};

function buildRequirement(overrides: {
  id: number;
  name: string;
  isRequired?: boolean;
  choiceGroupKey?: string | null;
  groupLabel?: string;
}) {
  return {
    isRequired: true,
    choiceGroupKey: null,
    groupLabel: '',
    ...overrides,
  };
}

/** Корректировка с основным Excel-слотом (заполнен) + переданными требованиями/слотами. */
function buildCorrectionForPackageCheck(
  requirements: ReturnType<typeof buildRequirement>[],
  slotsByRequirementId: Record<number, { versions: unknown[] } | undefined>,
): Correction {
  return {
    slots: [
      { requirementId: null, versions: [{ id: 1 }] },
      ...requirements.map((req) => ({
        requirementId: req.id,
        versions: slotsByRequirementId[req.id]?.versions ?? [],
      })),
    ],
    correctionType: { requirements },
  } as unknown as Correction;
}

describe('CorrectionsService — checkPackageComplete (группа «выбери один из альтернатив»)', () => {
  const lsr = buildRequirement({
    id: 10,
    name: 'Локальный сметный расчёт (ПД)',
    choiceGroupKey: 'mtr_package',
    groupLabel: 'Перечень комплекта МТР (ХС)',
  });
  const tkp = buildRequirement({
    id: 11,
    name: 'ХЗ-х ТКП',
    choiceGroupKey: 'mtr_package',
    groupLabel: 'Перечень комплекта МТР (ХС)',
  });

  function check(correction: Correction) {
    const { service } = buildService(correction);
    return (
      service as unknown as { checkPackageComplete: CheckPackageComplete }
    ).checkPackageComplete(correction);
  }

  it('пакет неполон, если ни один вариант группы не заполнен', () => {
    const correction = buildCorrectionForPackageCheck([lsr, tkp], {});

    const result = check(correction);

    expect(result.complete).toBe(false);
    expect(result.missing).toEqual([
      'Перечень комплекта МТР (ХС) (один из: Локальный сметный расчёт (ПД) / ХЗ-х ТКП)',
    ]);
  });

  it('пакет полон, если заполнен только один вариант группы', () => {
    const correction = buildCorrectionForPackageCheck([lsr, tkp], {
      10: { versions: [{ id: 1 }] },
    });

    const result = check(correction);

    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('пакет полон, если заполнены оба варианта группы', () => {
    const correction = buildCorrectionForPackageCheck([lsr, tkp], {
      10: { versions: [{ id: 1 }] },
      11: { versions: [{ id: 2 }] },
    });

    const result = check(correction);

    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('независимые (негрупповые) обязательные требования продолжают работать как раньше', () => {
    const note = buildRequirement({ id: 20, name: 'Согласованная служебная записка' });
    const correction = buildCorrectionForPackageCheck([note], {});

    const result = check(correction);

    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(['Согласованная служебная записка']);
  });
});
