import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { Role, User } from '../users/entities/user.entity';
import { PlanCfoStatusValue } from './entities/plan-cfo-status.entity';
import { PlanRemarkStatus } from './entities/plan-remark.entity';
import { Plan, PlanStatus } from './entities/plan.entity';
import { PlanningService } from './planning.service';

function buildUser(role: Role, overrides: Partial<User> = {}): User {
  return { id: 'user-1', role, ...overrides } as unknown as User;
}

function buildCfoUser(cfoId: number): User {
  return buildUser(Role.CFO, { cfoId });
}

function buildFilialUser(filialId: number): User {
  return buildUser(Role.FILIAL, { filialId });
}

function buildPlan(
  overrides: {
    myStatus?: { id: number; cfoId: number; status: PlanCfoStatusValue };
    status?: PlanStatus;
    remarks?: { cfoId: number | null; status: PlanRemarkStatus }[];
    filialId?: number | null;
    cfoId?: number | null;
    slots?: { versions?: { storagePath: string }[] }[];
  } = {},
): Plan {
  const status = overrides.status ?? PlanStatus.UNDER_CFO_REVIEW;
  return {
    id: 1,
    humanId: 'PLN-000001',
    status,
    cfoStatuses: overrides.myStatus ? [overrides.myStatus] : [],
    remarks: overrides.remarks ?? [],
    filialId: overrides.filialId === undefined ? 1 : overrides.filialId,
    cfoId: overrides.cfoId ?? null,
    slots: overrides.slots ?? [],
    canSendToDtoeAsOwner:
      status === PlanStatus.DRAFT || status === PlanStatus.RETURNED_BY_DTOE,
  } as unknown as Plan;
}

/**
 * Конструирует PlanningService напрямую (без Nest TestingModule) —
 * репозитории кроме `plans` не используются на пути, который проверяют эти
 * тесты (guard срабатывает до транзакции).
 */
function buildService(plan: Plan) {
  const plansRepo = { findOne: jest.fn().mockResolvedValue(plan) };
  const dataSource = { transaction: jest.fn() };
  const noop = {} as never;

  const service = new PlanningService(
    dataSource as never,
    plansRepo as never,
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

describe('PlanningService — создание плана ролью ЦФО', () => {
  function buildServiceForCreate() {
    const plansRepo = { findOne: jest.fn() };
    const planTypesRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1, requirements: [] }),
    };
    const dataSource = { transaction: jest.fn() };
    const noop = {} as never;

    const service = new PlanningService(
      dataSource as never,
      plansRepo as never,
      noop,
      noop,
      noop,
      noop,
      noop,
      planTypesRepo as never,
      noop,
      noop,
      noop,
      noop,
    );

    return { service, dataSource, planTypesRepo };
  }

  it('ЦФО с заполненным cfoId проходит guard и доходит до транзакции', async () => {
    const { service, dataSource } = buildServiceForCreate();
    dataSource.transaction.mockResolvedValue(undefined);

    await service
      .create(buildCfoUser(5), { planTypeId: 1 })
      .catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('отклоняет ЦФО без organizational привязки (cfoId не заполнен)', async () => {
    const { service, dataSource } = buildServiceForCreate();

    await expect(
      service.create(buildUser(Role.CFO), { planTypeId: 1 }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('роль DTOE не может создать план', async () => {
    const { service, dataSource } = buildServiceForCreate();

    await expect(
      service.create(buildUser(Role.DTOE), { planTypeId: 1 }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

/** Пакет с укомплектованным основным слотом и без дополнительных обязательных требований. */
function buildCompleteOwnerPlan(overrides: {
  status: PlanStatus;
  cfoId?: number | null;
  myStatus?: { id: number; cfoId: number; status: PlanCfoStatusValue };
}): Plan {
  const plan = buildPlan({
    status: overrides.status,
    filialId: null,
    cfoId: overrides.cfoId ?? 5,
    myStatus: overrides.myStatus,
  });
  (plan as unknown as { slots: unknown[] }).slots = [
    { requirementId: null, versions: [{ id: 1 }] },
  ];
  (plan as unknown as { planType: unknown }).planType = {
    requirements: [],
  };
  return plan;
}

describe('PlanningService — ЦФО направляет собственный план сразу в ДТОиР (sendToDtoe, owner)', () => {
  it('направляет из DRAFT — доходит до транзакции', async () => {
    const plan = buildCompleteOwnerPlan({ status: PlanStatus.DRAFT });
    const { service, dataSource } = buildService(plan);
    dataSource.transaction.mockResolvedValue(undefined);

    await service
      .sendToDtoe(buildCfoUser(5), 'PLN-000001')
      .catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('направляет из RETURNED_BY_DTOE (повторно, после доработки) — доходит до транзакции', async () => {
    const plan = buildCompleteOwnerPlan({
      status: PlanStatus.RETURNED_BY_DTOE,
    });
    const { service, dataSource } = buildService(plan);
    dataSource.transaction.mockResolvedValue(undefined);

    await service
      .sendToDtoe(buildCfoUser(5), 'PLN-000001')
      .catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('отклоняет направление из недопустимого статуса (UNDER_CFO_REVIEW)', async () => {
    const plan = buildCompleteOwnerPlan({
      status: PlanStatus.UNDER_CFO_REVIEW,
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.sendToDtoe(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет направление неукомплектованного пакета', async () => {
    const plan = buildPlan({
      status: PlanStatus.DRAFT,
      filialId: null,
      cfoId: 5,
    });
    (plan as unknown as { planType: unknown }).planType = {
      requirements: [
        {
          id: 1,
          name: 'Служебная записка',
          isRequired: true,
          choiceGroupKey: null,
        },
      ],
    };
    const { service, dataSource } = buildService(plan);

    await expect(
      service.sendToDtoe(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет не-владельца, не назначенного проверяющим (403)', async () => {
    const plan = buildCompleteOwnerPlan({ status: PlanStatus.DRAFT, cfoId: 5 });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.sendToDtoe(buildCfoUser(999), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('обычный цикл (не владелец, проверяющий по cfoStatuses) продолжает требовать ALL_CFO_APPROVED', async () => {
    const plan = buildPlan({
      status: PlanStatus.PARTIALLY_APPROVED,
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.APPROVED },
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.sendToDtoe(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('PlanningService — удаление собственного черновика ЦФО-владельцем', () => {
  it('удаляет DRAFT-план, созданный самим ЦФО', async () => {
    const plan = buildPlan({
      status: PlanStatus.DRAFT,
      filialId: null,
      cfoId: 5,
    });
    const { service, dataSource } = buildService(plan);
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    dataSource.transaction.mockImplementation(
      async (fn: (manager: unknown) => Promise<void>) => {
        const planRepo = { delete: deleteFn };
        const manager = {
          getRepository: jest.fn().mockReturnValue(planRepo),
        };
        await fn(manager);
      },
    );

    await service.deletePlan(buildCfoUser(5), 'PLN-000001');

    expect(deleteFn).toHaveBeenCalledWith(1);
  });

  it('отклоняет удаление плана чужого ЦФО-владельца (403)', async () => {
    const plan = buildPlan({
      status: PlanStatus.DRAFT,
      filialId: null,
      cfoId: 5,
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.deletePlan(buildCfoUser(999), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('PlanningService — guard PENDING для cfoApprove/cfoReturn', () => {
  it('cfoApprove отклоняет повторное согласование, если статус ЦФО уже APPROVED', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.APPROVED },
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cfoApprove(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('cfoApprove отказывает ЦФО без строки статуса по этому плану (403, не 400)', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.PENDING },
    });
    const { service } = buildService(plan);

    await expect(
      service.cfoApprove(buildCfoUser(999), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('cfoReturn отклоняет повторный возврат, если статус ЦФО уже RETURNED', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.RETURNED },
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cfoReturn(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('cfoReturn отклоняет финализацию, если этот ЦФО ещё не оставил ни одного открытого замечания', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.PENDING },
      remarks: [],
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cfoReturn(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('cfoReturn игнорирует открытые замечания ДРУГИХ ЦФО при проверке наличия своих', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.PENDING },
      remarks: [{ cfoId: 999, status: PlanRemarkStatus.OPEN }],
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cfoReturn(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('PlanningService — leaveRemark (замечание без немедленного возврата)', () => {
  it('отклоняет ЦФО, статус которого по плану уже не PENDING', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.RETURNED },
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.leaveRemark(buildCfoUser(5), 'PLN-000001', {
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет ДТОиР вне статуса UNDER_DTOE_REVIEW', async () => {
    const plan = buildPlan({ status: PlanStatus.PARTIALLY_APPROVED });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.leaveRemark(buildUser(Role.DTOE), 'PLN-000001', {
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет роль FILIAL', async () => {
    const plan = buildPlan();
    const { service, dataSource } = buildService(plan);

    await expect(
      service.leaveRemark(buildUser(Role.FILIAL), 'PLN-000001', {
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('content')),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('PlanningService — downloadFileVersion (доступ по checkAccess)', () => {
  function buildServiceWithFileVersion(plan: Plan) {
    const plansRepo = { findOne: jest.fn().mockResolvedValue(plan) };
    const fileVersionsRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        storagePath: '/tmp/does-not-matter.txt',
        fileName: 'file.txt',
        mimeType: 'text/plain',
        slot: { plan },
      }),
    };
    const cfoStatusesRepo = { exist: jest.fn().mockResolvedValue(false) };
    const dataSource = { transaction: jest.fn() };
    const noop = {} as never;

    const service = new PlanningService(
      dataSource as never,
      plansRepo as never,
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
    const plan = buildPlan({ status: PlanStatus.UNDER_DTOE_REVIEW });
    const { service } = buildServiceWithFileVersion(plan);

    await expect(
      service.downloadFileVersion(buildUser(Role.DTOE), 1),
    ).resolves.toMatchObject({
      fileName: 'file.txt',
    });
  });

  it('отказывает ЦФО без доступа к этому плану (403)', async () => {
    const plan = buildPlan();
    const { service } = buildServiceWithFileVersion(plan);

    await expect(
      service.downloadFileVersion(buildCfoUser(999), 1),
    ).rejects.toThrow(ForbiddenException);
  });

  it('разрешает филиалу-владельцу скачать файл (отличие от Corrections — план собственный, ЦФО-владелец нет)', async () => {
    const plan = buildPlan({ filialId: 7 });
    const { service } = buildServiceWithFileVersion(plan);
    const filialUser = buildUser(Role.FILIAL, { filialId: 7 });

    await expect(
      service.downloadFileVersion(filialUser, 1),
    ).resolves.toMatchObject({
      fileName: 'file.txt',
    });
  });
});

describe('PlanningService — cancelCfoDecision (отмена собственного решения ЦФО)', () => {
  it('отклоняет отмену, если статус этого ЦФО уже PENDING — нечего отменять', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.PENDING },
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cancelCfoDecision(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет отмену, если план уже передан в ДТОиР', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.APPROVED },
      status: PlanStatus.UNDER_DTOE_REVIEW,
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cancelCfoDecision(buildCfoUser(5), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет отмену для ЦФО без строки статуса по этому плану (403, не 400)', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.APPROVED },
    });
    const { service } = buildService(plan);

    await expect(
      service.cancelCfoDecision(buildCfoUser(999), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('отклоняет роль FILIAL', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.APPROVED },
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.cancelCfoDecision(buildFilialUser(1), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('проходит guard-проверки и входит в транзакцию для APPROVED вне статусов ДТОиР', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.APPROVED },
      status: PlanStatus.ALL_CFO_APPROVED,
    });
    const { service, dataSource } = buildService(plan);
    dataSource.transaction.mockResolvedValue(undefined);

    await service
      .cancelCfoDecision(buildCfoUser(5), 'PLN-000001')
      .catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('проходит guard-проверки и входит в транзакцию для RETURNED вне статусов ДТОиР', async () => {
    const plan = buildPlan({
      myStatus: { id: 10, cfoId: 5, status: PlanCfoStatusValue.RETURNED },
      status: PlanStatus.RETURNED_FOR_REVISION,
    });
    const { service, dataSource } = buildService(plan);
    dataSource.transaction.mockResolvedValue(undefined);

    await service
      .cancelCfoDecision(buildCfoUser(5), 'PLN-000001')
      .catch(() => undefined);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});

describe('PlanningService — deletePlan (удаление только DRAFT)', () => {
  it('отклоняет удаление, если статус не DRAFT', async () => {
    const plan = buildPlan({
      status: PlanStatus.UNDER_CFO_REVIEW,
      filialId: 1,
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.deletePlan(buildFilialUser(1), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет удаление плана чужого филиала (403)', async () => {
    const plan = buildPlan({ status: PlanStatus.DRAFT, filialId: 1 });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.deletePlan(buildFilialUser(2), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет роль CFO', async () => {
    const plan = buildPlan({ status: PlanStatus.DRAFT, filialId: 1 });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.deletePlan(buildCfoUser(1), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('удаляет DRAFT-план своего филиала и физические версии файлов', async () => {
    const plan = buildPlan({
      status: PlanStatus.DRAFT,
      filialId: 1,
      slots: [{ versions: [{ storagePath: '/tmp/a.pdf' }] }, { versions: [] }],
    });
    const { service, dataSource } = buildService(plan);
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    dataSource.transaction.mockImplementation(
      async (fn: (manager: unknown) => Promise<void>) => {
        const planRepo = { delete: deleteFn };
        const manager = { getRepository: jest.fn().mockReturnValue(planRepo) };
        await fn(manager);
      },
    );

    await service.deletePlan(buildFilialUser(1), 'PLN-000001');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(deleteFn).toHaveBeenCalledWith(1);
  });
});

describe('PlanningService — send (только DRAFT, укомплектованность, привязка ЦФО)', () => {
  it('отклоняет направление не из статуса DRAFT', async () => {
    const plan = buildPlan({
      status: PlanStatus.UNDER_CFO_REVIEW,
      filialId: 1,
      slots: [{ versions: [{ storagePath: '/tmp/a.pdf' }] }],
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.send(buildFilialUser(1), 'PLN-000001', { cfoIds: [5] }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет направление чужого филиала (403)', async () => {
    const plan = buildPlan({ status: PlanStatus.DRAFT, filialId: 1 });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.send(buildFilialUser(2), 'PLN-000001', { cfoIds: [5] }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('PlanningService — resubmit/resubmitToDtoe (только из строго заданного статуса)', () => {
  it('resubmit отклоняет вызов вне статуса RETURNED_FOR_REVISION', async () => {
    const plan = buildPlan({ status: PlanStatus.DRAFT, filialId: 1 });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.resubmit(buildFilialUser(1), 'PLN-000001', { cfoIds: [5] }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('resubmitToDtoe отклоняет вызов вне статуса RETURNED_BY_DTOE', async () => {
    const plan = buildPlan({
      status: PlanStatus.UNDER_DTOE_REVIEW,
      filialId: 1,
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.resubmitToDtoe(buildFilialUser(1), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('PlanningService — dtoeApprove/dtoeReturn (только роль DTOE, только UNDER_DTOE_REVIEW)', () => {
  it('dtoeApprove отклоняет не-DTOE роль', async () => {
    const plan = buildPlan({ status: PlanStatus.UNDER_DTOE_REVIEW });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.dtoeApprove(buildFilialUser(1), 'PLN-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('dtoeApprove отклоняет вызов вне статуса UNDER_DTOE_REVIEW', async () => {
    const plan = buildPlan({ status: PlanStatus.ALL_CFO_APPROVED });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.dtoeApprove(buildUser(Role.DTOE), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('dtoeReturn отклоняет возврат без открытого замечания ДТОиР', async () => {
    const plan = buildPlan({
      status: PlanStatus.UNDER_DTOE_REVIEW,
      remarks: [],
    });
    const { service, dataSource } = buildService(plan);

    await expect(
      service.dtoeReturn(buildUser(Role.DTOE), 'PLN-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

type CheckPackageComplete = (plan: Plan) => {
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

/** План с основным Excel-слотом (заполнен) + переданными требованиями/слотами. */
function buildPlanForPackageCheck(
  requirements: ReturnType<typeof buildRequirement>[],
  slotsByRequirementId: Record<number, { versions: unknown[] } | undefined>,
): Plan {
  return {
    slots: [
      { requirementId: null, versions: [{ id: 1 }] },
      ...requirements.map((req) => ({
        requirementId: req.id,
        versions: slotsByRequirementId[req.id]?.versions ?? [],
      })),
    ],
    planType: { requirements },
  } as unknown as Plan;
}

describe('PlanningService — checkPackageComplete (группа «выбери один из альтернатив»)', () => {
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

  function check(plan: Plan) {
    const { service } = buildService(plan);
    return (
      service as unknown as { checkPackageComplete: CheckPackageComplete }
    ).checkPackageComplete(plan);
  }

  it('пакет неполон, если ни один вариант группы не заполнен', () => {
    const plan = buildPlanForPackageCheck([lsr, tkp], {});

    const result = check(plan);

    expect(result.complete).toBe(false);
    expect(result.missing).toEqual([
      'Перечень комплекта МТР (ХС) (один из: Локальный сметный расчёт (ПД) / ХЗ-х ТКП)',
    ]);
  });

  it('пакет полон, если заполнен только один вариант группы', () => {
    const plan = buildPlanForPackageCheck([lsr, tkp], {
      10: { versions: [{ id: 1 }] },
    });

    const result = check(plan);

    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('пакет полон, если заполнены оба варианта группы', () => {
    const plan = buildPlanForPackageCheck([lsr, tkp], {
      10: { versions: [{ id: 1 }] },
      11: { versions: [{ id: 2 }] },
    });

    const result = check(plan);

    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('независимые (негрупповые) обязательные требования продолжают работать как раньше', () => {
    const note = buildRequirement({
      id: 20,
      name: 'Согласованная служебная записка',
    });
    const plan = buildPlanForPackageCheck([note], {});

    const result = check(plan);

    expect(result.complete).toBe(false);
    expect(result.missing).toEqual(['Согласованная служебная записка']);
  });
});
