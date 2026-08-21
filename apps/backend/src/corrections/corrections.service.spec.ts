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
  } = {},
): Correction {
  return {
    id: 1,
    humanId: 'COR-000001',
    status: overrides.status ?? CorrectionStatus.UNDER_CFO_REVIEW,
    cfoStatuses: overrides.myStatus ? [overrides.myStatus] : [],
    remarks: overrides.remarks ?? [],
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
