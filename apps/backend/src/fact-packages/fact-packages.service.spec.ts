import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { Role, User } from '../users/entities/user.entity';
import { FactCfoStatusValue } from './entities/fact-package-cfo-status.entity';
import { FactPackage, FactPackageStatus } from './entities/fact-package.entity';
import { FactRemarkStatus } from './entities/fact-package-remark.entity';
import { Direction, FactFormCode } from './fact-form-catalog';
import { FactPackagesService } from './fact-packages.service';
import { FinalDecision } from './dto/final-decision.dto';

function buildUser(role: Role, overrides: Partial<User> = {}): User {
  return {
    id: 1,
    fullName: 'Иванов Иван Иванович',
    role,
    ...overrides,
  } as unknown as User;
}

function buildCfoUser(cfoId: number): User {
  return buildUser(Role.CFO, { cfoId });
}

function buildFactPackage(
  overrides: {
    status?: FactPackageStatus;
    direction?: Direction;
    filialId?: number | null;
    cfoId?: number | null;
    myCfoStatus?: { id: number; cfoId: number; status: FactCfoStatusValue };
    cfoStatuses?: { id: number; cfoId: number; status: FactCfoStatusValue }[];
    remarks?: {
      id: number;
      cfoId: number | null;
      status: FactRemarkStatus;
      authorId?: number;
    }[];
    forms?: {
      id: number;
      code: FactFormCode;
      label: string;
      versions: unknown[];
    }[];
  } = {},
): FactPackage {
  const status = overrides.status ?? FactPackageStatus.UNDER_CFO_REVIEW;
  const cfoId = overrides.cfoId ?? null;
  const filialId = cfoId != null ? null : (overrides.filialId ?? 1);
  const canSubmit =
    cfoId != null
      ? status === FactPackageStatus.DRAFT ||
        status === FactPackageStatus.RETURNED_BY_DTOE
      : status === FactPackageStatus.DRAFT ||
        status === FactPackageStatus.RETURNED_FOR_REVISION;
  return {
    id: 1,
    humanId: 'FCT-000001',
    status,
    direction: overrides.direction ?? Direction.DO,
    filialId,
    cfoId,
    cfoStatuses:
      overrides.cfoStatuses ??
      (overrides.myCfoStatus ? [overrides.myCfoStatus] : []),
    remarks: overrides.remarks ?? [],
    forms: overrides.forms ?? [],
    canSubmit,
    canSendToDtoe: status === FactPackageStatus.ALL_CFO_APPROVED,
  } as unknown as FactPackage;
}

/**
 * Конструирует FactPackagesService напрямую (без Nest TestingModule) —
 * репозитории кроме `factPackages` не используются на пути, который проверяют
 * эти тесты (guard срабатывает до транзакции), по образцу corrections.service.spec.ts.
 */
function buildService(factPackage: FactPackage) {
  const factPackagesRepo = {
    findOne: jest.fn().mockResolvedValue(factPackage),
  };
  const dataSource = { transaction: jest.fn() };
  const noop = {} as never;

  const service = new FactPackagesService(
    dataSource as never,
    factPackagesRepo as never,
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

describe('FactPackagesService — create', () => {
  it('отклоняет роль, отличную от FILIAL/CFO', async () => {
    const { service } = buildService(buildFactPackage());

    await expect(
      service.create(buildUser(Role.DTOE), Direction.DO),
    ).rejects.toThrow(ForbiddenException);
  });

  it('отклоняет ЦФО без указанного cfoId', async () => {
    const { service } = buildService(buildFactPackage());

    await expect(
      service.create(buildUser(Role.CFO, { cfoId: undefined }), Direction.DO),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('FactPackagesService — uploadFormVersion', () => {
  it('отклоняет не-владельца филиала', async () => {
    const factPackage = buildFactPackage({ filialId: 1 });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.uploadFormVersion(
        buildUser(Role.FILIAL, { filialId: 2 }),
        'FCT-000001',
        FactFormCode.ACT_WORK,
        {} as never,
        undefined,
        undefined,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет загрузку в факт-пакет в финальном статусе APPROVED', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.APPROVED,
      filialId: 1,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.uploadFormVersion(
        buildUser(Role.FILIAL, { filialId: 1 }),
        'FCT-000001',
        FactFormCode.ACT_WORK,
        {} as never,
        undefined,
        undefined,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет форму, не входящую в каталог направления (КР ХС без форм приёмки у подрядчика)', async () => {
    const factPackage = buildFactPackage({
      direction: Direction.KR_HS,
      filialId: 1,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.uploadFormVersion(
        buildUser(Role.FILIAL, { filialId: 1 }),
        'FCT-000001',
        FactFormCode.KS2,
        {} as never,
        undefined,
        undefined,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет ЦФО, не являющегося владельцем пакета', async () => {
    const factPackage = buildFactPackage({ cfoId: 5 });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.uploadFormVersion(
        buildCfoUser(9),
        'FCT-000001',
        FactFormCode.ACT_WORK,
        {} as never,
        undefined,
        undefined,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('FactPackagesService — submit', () => {
  it('отклоняет не-владельца филиала', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.DRAFT,
      filialId: 1,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.submit(buildUser(Role.FILIAL, { filialId: 2 }), 'FCT-000001', {
        cfoIds: [1],
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет направление факт-пакета не в DRAFT/RETURNED_FOR_REVISION', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.UNDER_CFO_REVIEW,
      filialId: 1,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.submit(buildUser(Role.FILIAL, { filialId: 1 }), 'FCT-000001', {
        cfoIds: [1],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет повторную отправку, пока есть неисправленные замечания вернувшего ЦФО', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.RETURNED_FOR_REVISION,
      filialId: 1,
      cfoStatuses: [{ id: 10, cfoId: 5, status: FactCfoStatusValue.RETURNED }],
      remarks: [{ id: 1, cfoId: 5, status: FactRemarkStatus.OPEN }],
      forms: [
        {
          id: 1,
          code: FactFormCode.ACT_WORK,
          label: 'Акт выполнения работ',
          versions: [{}],
        },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.submit(buildUser(Role.FILIAL, { filialId: 1 }), 'FCT-000001', {
        cfoIds: [5],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет отправку филиалом без выбранного ЦФО', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.DRAFT,
      filialId: 1,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.submit(buildUser(Role.FILIAL, { filialId: 1 }), 'FCT-000001', {
        cfoIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет ЦФО, не являющегося владельцем пакета', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.DRAFT,
      cfoId: 5,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.submit(buildCfoUser(9), 'FCT-000001', {}),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет направление пакета ЦФО не в DRAFT/RETURNED_BY_DTOE', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.UNDER_DTOE_REVIEW,
      cfoId: 5,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.submit(buildCfoUser(5), 'FCT-000001', {}),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('FactPackagesService — approveByCfo', () => {
  it('отклоняет ЦФО с несовпадающим cfoId в пути', async () => {
    const factPackage = buildFactPackage({
      myCfoStatus: { id: 10, cfoId: 5, status: FactCfoStatusValue.PENDING },
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.approveByCfo(buildCfoUser(5), 'FCT-000001', 999),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет повторное согласование, если статус ЦФО уже APPROVED', async () => {
    const factPackage = buildFactPackage({
      myCfoStatus: { id: 10, cfoId: 5, status: FactCfoStatusValue.APPROVED },
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.approveByCfo(buildCfoUser(5), 'FCT-000001', 5),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('FactPackagesService — leaveRemark', () => {
  it('404, если relatedFormId не принадлежит факт-пакету', async () => {
    const factPackage = buildFactPackage({ forms: [] });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.leaveRemark(buildUser(Role.DTOE), 'FCT-000001', {
        relatedFormId: 999,
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет ЦФО, статус которого по факт-пакету уже не PENDING', async () => {
    const factPackage = buildFactPackage({
      myCfoStatus: { id: 10, cfoId: 5, status: FactCfoStatusValue.RETURNED },
      forms: [
        {
          id: 1,
          code: FactFormCode.ACT_WORK,
          label: 'Акт выполнения работ',
          versions: [],
        },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.leaveRemark(buildCfoUser(5), 'FCT-000001', {
        relatedFormId: 1,
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет ДТОиР вне статуса UNDER_DTOE_REVIEW', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.PARTIALLY_APPROVED,
      forms: [
        {
          id: 1,
          code: FactFormCode.ACT_WORK,
          label: 'Акт выполнения работ',
          versions: [],
        },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.leaveRemark(buildUser(Role.DTOE), 'FCT-000001', {
        relatedFormId: 1,
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет роль FILIAL', async () => {
    const factPackage = buildFactPackage({
      forms: [
        {
          id: 1,
          code: FactFormCode.ACT_WORK,
          label: 'Акт выполнения работ',
          versions: [],
        },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.leaveRemark(buildUser(Role.FILIAL), 'FCT-000001', {
        relatedFormId: 1,
        description: 'd',
        requiredAction: 'r',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('FactPackagesService — fixRemark/deleteRemark', () => {
  it('fixRemark отклоняет не-владельца филиала', async () => {
    const factPackage = buildFactPackage({
      filialId: 1,
      remarks: [
        { id: 1, cfoId: 5, status: FactRemarkStatus.OPEN, authorId: 9 },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.fixRemark(
        buildUser(Role.FILIAL, { filialId: 2 }),
        'FCT-000001',
        1,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('deleteRemark — 403 для чужого замечания (не автор)', async () => {
    const factPackage = buildFactPackage({
      remarks: [
        { id: 1, cfoId: 5, status: FactRemarkStatus.OPEN, authorId: 9 },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.deleteRemark(
        buildUser(Role.CFO, { id: 42, cfoId: 5 }),
        'FCT-000001',
        1,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('deleteRemark — 400 для собственного замечания не в статусе OPEN', async () => {
    const factPackage = buildFactPackage({
      remarks: [
        { id: 1, cfoId: 5, status: FactRemarkStatus.CLOSED, authorId: 42 },
      ],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.deleteRemark(
        buildUser(Role.CFO, { id: 42, cfoId: 5 }),
        'FCT-000001',
        1,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('FactPackagesService — sendToDtoe', () => {
  it('отклоняет ЦФО, ещё не согласовавший (статус не APPROVED)', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.PARTIALLY_APPROVED,
      myCfoStatus: { id: 10, cfoId: 5, status: FactCfoStatusValue.PENDING },
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.sendToDtoe(buildCfoUser(5), 'FCT-000001'),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет отправку, пока не все обязательные ЦФО согласовали', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.PARTIALLY_APPROVED,
      myCfoStatus: { id: 10, cfoId: 5, status: FactCfoStatusValue.APPROVED },
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.sendToDtoe(buildCfoUser(5), 'FCT-000001'),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

describe('FactPackagesService — finalDecision', () => {
  it('отклоняет роль, отличную от DTOE', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.UNDER_DTOE_REVIEW,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.finalDecision(buildUser(Role.CFO), 'FCT-000001', {
        decision: FinalDecision.APPROVE,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет решение вне статуса UNDER_DTOE_REVIEW', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.PARTIALLY_APPROVED,
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.finalDecision(buildUser(Role.DTOE), 'FCT-000001', {
        decision: FinalDecision.APPROVE,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('отклоняет RETURN без ни одного открытого замечания от ДТОиР', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.UNDER_DTOE_REVIEW,
      remarks: [],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.finalDecision(buildUser(Role.DTOE), 'FCT-000001', {
        decision: FinalDecision.RETURN,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('RETURN игнорирует замечания ЦФО (cfoId != null) при поиске открытых замечаний ДТОиР', async () => {
    const factPackage = buildFactPackage({
      status: FactPackageStatus.UNDER_DTOE_REVIEW,
      remarks: [{ id: 1, cfoId: 5, status: FactRemarkStatus.OPEN }],
    });
    const { service, dataSource } = buildService(factPackage);

    await expect(
      service.finalDecision(buildUser(Role.DTOE), 'FCT-000001', {
        decision: FinalDecision.RETURN,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

/**
 * getStats не трогает транзакции/сохранённый факт-пакет — отдельная сборка
 * сервиса с моками именно тех репозиториев, которые читает getStats
 * (createQueryBuilder на factPackages, find на cfoStatuses, count на remarks).
 */
function buildStatsService(packages: { status: FactPackageStatus }[]) {
  const factPackagesRepo = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(packages),
    })),
  };
  const cfoStatusesRepo = { find: jest.fn().mockResolvedValue([]) };
  const remarksRepo = { count: jest.fn().mockResolvedValue(0) };
  const noop = {} as never;

  const service = new FactPackagesService(
    noop,
    factPackagesRepo as never,
    noop,
    noop,
    cfoStatusesRepo as never,
    remarksRepo as never,
    noop,
    noop,
    noop,
    noop,
    noop,
  );

  return { service, factPackagesRepo, cfoStatusesRepo, remarksRepo };
}

describe('FactPackagesService — getStats', () => {
  const packages: { status: FactPackageStatus }[] = [
    { status: FactPackageStatus.DRAFT },
    { status: FactPackageStatus.UNDER_CFO_REVIEW },
    { status: FactPackageStatus.RETURNED_FOR_REVISION },
    { status: FactPackageStatus.APPROVED },
    { status: FactPackageStatus.UNDER_DTOE_REVIEW },
  ];

  it('FILIAL получает total/inReview/returned/approved без underReview/openRemarks', async () => {
    const { service } = buildStatsService(packages);

    const stats = await service.getStats(
      buildUser(Role.FILIAL, { filialId: 1 }),
    );

    expect(stats).toEqual({
      total: 5,
      inReview: 2,
      returned: 1,
      approved: 1,
    });
  });

  it('DTOE/ADMIN дополнительно получают underReview и openRemarks', async () => {
    const { service, remarksRepo } = buildStatsService(packages);
    remarksRepo.count.mockResolvedValue(3);

    const stats = await service.getStats(buildUser(Role.DTOE));

    expect(stats).toEqual({
      total: 5,
      inReview: 2,
      returned: 1,
      approved: 1,
      underReview: 1,
      openRemarks: 3,
    });
  });

  it('CFO считает по строкам своего ЦФО в cfoStatuses, а не по всем факт-пакетам', async () => {
    const { service, cfoStatusesRepo } = buildStatsService(packages);
    cfoStatusesRepo.find.mockResolvedValue([
      { status: FactCfoStatusValue.PENDING },
      { status: FactCfoStatusValue.RETURNED },
      { status: FactCfoStatusValue.APPROVED },
      { status: FactCfoStatusValue.APPROVED },
    ]);

    const stats = await service.getStats(buildCfoUser(7));

    expect(stats).toEqual({ total: 4, inReview: 1, returned: 1, approved: 2 });
    expect(cfoStatusesRepo.find).toHaveBeenCalledWith({
      where: { cfoId: 7 },
    });
  });
});
