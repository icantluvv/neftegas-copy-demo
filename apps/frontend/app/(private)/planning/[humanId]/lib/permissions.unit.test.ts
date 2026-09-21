import { describe, expect, it } from "vitest";

import type { PlanDetail, PlanRemark } from "@/packages/api/base/codegen";

import {
  canApproveAsCfo,
  canApproveAsDtoe,
  canCancelCfoDecision,
  canDeleteRemark,
  canFinalizeReturnAsCfo,
  canFinalizeReturnAsDtoe,
  canLeaveRemarkAsCfo,
  canLeaveRemarkAsDtoe,
  canMarkRemarkFixed,
  canResubmit,
  canResubmitToDtoe,
  canSendForReview,
  canSendToDtoe,
  canUploadSlotFile,
  showResubmitPanel,
} from "./permissions";

function makeRemark(overrides: Partial<PlanRemark> = {}): PlanRemark {
  return {
    id: 1,
    humanId: "PLR-000001",
    planId: 1,
    cfoId: 10,
    authorId: 20,
    createdAt: "2027-01-01T00:00:00.000Z",
    relatedSlotId: 1,
    fileVersionId: null,
    sheetName: "",
    rowRef: "",
    cellRef: "",
    description: "Нет плана-графика за март",
    requiredAction: "Приложить план-график за март",
    status: "OPEN",
    closedById: null,
    closedAt: null,
    issuerLabel: "ОГМ",
    ...overrides,
  };
}

function makeDetail(overrides: Partial<PlanDetail> = {}): PlanDetail {
  return {
    id: 1,
    humanId: "PLN-000001",
    filialId: 1,
    planTypeId: 1,
    authorId: 5,
    status: "DRAFT",
    stageNote: "",
    createdAt: "2027-01-01T00:00:00.000Z",
    updatedAt: "2027-01-01T00:00:00.000Z",
    sentToDtoeAt: null,
    decidedAt: null,
    canSend: true,
    canSendToDtoe: false,
    openRemarksCount: 0,
    filial: { id: 1, code: "ФИЛИАЛ", name: "Филиал", isActive: true },
    planType: { id: 1, code: "DTOIR_2027", name: "План на 2027", isActive: true },
    author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
    slots: [],
    cfoStatuses: [],
    remarks: [],
    history: [],
    packageComplete: true,
    missingRequirements: [],
    myCfoStatus: null,
    myOpenRemarksCount: 0,
    isFilialOwner: false,
    isCfoReviewer: false,
    isDtoe: false,
    availableCfos: [],
    returnedCfos: [],
    ...overrides,
  };
}

describe("canUploadSlotFile", () => {
  it("разрешает загрузку филиалу-автору до финального согласования", () => {
    expect(canUploadSlotFile(makeDetail({ isFilialOwner: true, status: "UNDER_CFO_REVIEW" }))).toBe(true);
  });

  it("запрещает загрузку после APPROVED_BY_DTOE", () => {
    expect(canUploadSlotFile(makeDetail({ isFilialOwner: true, status: "APPROVED_BY_DTOE" }))).toBe(false);
  });

  it("запрещает загрузку не филиалу-автору", () => {
    expect(canUploadSlotFile(makeDetail({ isFilialOwner: false, isCfoReviewer: true, status: "UNDER_CFO_REVIEW" }))).toBe(false);
  });
});

describe("canSendForReview", () => {
  it("разрешает направление, когда все обязательные слоты заполнены", () => {
    expect(canSendForReview(makeDetail({ isFilialOwner: true, status: "DRAFT", missingRequirements: [] }))).toBe(true);
  });

  it("запрещает направление при незаполненных обязательных слотах", () => {
    expect(
      canSendForReview(makeDetail({ isFilialOwner: true, status: "DRAFT", missingRequirements: ["Excel плана"] })),
    ).toBe(false);
  });

  it("запрещает направление не из статуса DRAFT", () => {
    expect(canSendForReview(makeDetail({ isFilialOwner: true, status: "UNDER_CFO_REVIEW", missingRequirements: [] }))).toBe(
      false,
    );
  });
});

describe("canApproveAsCfo / canLeaveRemarkAsCfo", () => {
  it("разрешает согласование/оставление замечания, пока статус ЦФО PENDING", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedAt: null },
    });

    expect(canApproveAsCfo(detail)).toBe(true);
    expect(canLeaveRemarkAsCfo(detail)).toBe(true);
  });

  it("запрещает повторное согласование, если статус ЦФО уже APPROVED", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canApproveAsCfo(detail)).toBe(false);
  });

  it("запрещает оставление замечания, если статус ЦФО уже RETURNED", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "RETURNED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canLeaveRemarkAsCfo(detail)).toBe(false);
  });
});

describe("canFinalizeReturnAsCfo", () => {
  const pendingCfoStatus = {
    id: 1,
    planId: 1,
    cfoId: 2,
    cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true },
    status: "PENDING" as const,
    isRequired: true,
    decidedById: null,
    decidedAt: null,
  };

  it("запрещает финализировать возврат, пока не оставлено ни одного замечания", () => {
    const detail = makeDetail({ isCfoReviewer: true, myCfoStatus: pendingCfoStatus, remarks: [] });

    expect(canFinalizeReturnAsCfo(detail)).toBe(false);
  });

  it("разрешает финализировать возврат, когда этот ЦФО оставил открытое замечание", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: pendingCfoStatus,
      remarks: [makeRemark({ cfoId: 2, status: "OPEN" })],
    });

    expect(canFinalizeReturnAsCfo(detail)).toBe(true);
  });

  it("игнорирует замечания других ЦФО", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: pendingCfoStatus,
      remarks: [makeRemark({ cfoId: 99, status: "OPEN" })],
    });

    expect(canFinalizeReturnAsCfo(detail)).toBe(false);
  });
});

describe("canSendToDtoe", () => {
  it("разрешает направление в ДТОиР любому согласовавшему ЦФО, когда статус ALL_CFO_APPROVED", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      status: "ALL_CFO_APPROVED",
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canSendToDtoe(detail)).toBe(true);
  });

  it("запрещает направление в ДТОиР, пока не все обязательные ЦФО согласовали", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      status: "PARTIALLY_APPROVED",
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canSendToDtoe(detail)).toBe(false);
  });
});

describe("canApproveAsDtoe / canLeaveRemarkAsDtoe", () => {
  it("разрешает финальное согласование/оставление замечания только в UNDER_DTOE_REVIEW", () => {
    const detail = makeDetail({ isDtoe: true, status: "UNDER_DTOE_REVIEW" });

    expect(canApproveAsDtoe(detail)).toBe(true);
    expect(canLeaveRemarkAsDtoe(detail)).toBe(true);
  });

  it("запрещает вне UNDER_DTOE_REVIEW", () => {
    const detail = makeDetail({ isDtoe: true, status: "ALL_CFO_APPROVED" });

    expect(canApproveAsDtoe(detail)).toBe(false);
    expect(canLeaveRemarkAsDtoe(detail)).toBe(false);
  });
});

describe("canFinalizeReturnAsDtoe", () => {
  it("запрещает финализировать возврат, пока не оставлено ни одного замечания ДТОиР", () => {
    const detail = makeDetail({ isDtoe: true, status: "UNDER_DTOE_REVIEW", remarks: [] });

    expect(canFinalizeReturnAsDtoe(detail)).toBe(false);
  });

  it("разрешает финализировать возврат, когда ДТОиР оставил открытое замечание", () => {
    const detail = makeDetail({
      isDtoe: true,
      status: "UNDER_DTOE_REVIEW",
      remarks: [makeRemark({ cfoId: null, status: "OPEN" })],
    });

    expect(canFinalizeReturnAsDtoe(detail)).toBe(true);
  });

  it("игнорирует замечания от ЦФО (cfoId не null)", () => {
    const detail = makeDetail({
      isDtoe: true,
      status: "UNDER_DTOE_REVIEW",
      remarks: [makeRemark({ cfoId: 2, status: "OPEN" })],
    });

    expect(canFinalizeReturnAsDtoe(detail)).toBe(false);
  });
});

describe("canCancelCfoDecision", () => {
  it("разрешает отменить решение ЦФО, если он уже согласовал и статус плана не заблокирован ДТОиР", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      status: "PARTIALLY_APPROVED",
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canCancelCfoDecision(detail)).toBe(true);
  });

  it("запрещает отмену, пока статус ЦФО ещё PENDING", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedAt: null },
    });

    expect(canCancelCfoDecision(detail)).toBe(false);
  });

  it("запрещает отмену, когда план уже ушёл в ДТОиР", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      status: "UNDER_DTOE_REVIEW",
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canCancelCfoDecision(detail)).toBe(false);
  });

  it("запрещает отмену не ЦФО-роли", () => {
    const detail = makeDetail({
      isCfoReviewer: false,
      status: "PARTIALLY_APPROVED",
      myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2027-01-01T00:00:00.000Z" },
    });

    expect(canCancelCfoDecision(detail)).toBe(false);
  });
});

describe("showResubmitPanel / canResubmit", () => {
  it("скрывает блок, если ни один ЦФО не возвращал пакет", () => {
    expect(showResubmitPanel(makeDetail({ isFilialOwner: true, returnedCfos: [] }))).toBe(false);
  });

  it("показывает блок, если есть вернувшие ЦФО и статус RETURNED_FOR_REVISION", () => {
    expect(
      showResubmitPanel(
        makeDetail({
          isFilialOwner: true,
          status: "RETURNED_FOR_REVISION",
          returnedCfos: [{ id: 2, code: "ОГМ", name: "ОГМ", isActive: true }],
        }),
      ),
    ).toBe(true);
  });

  it("скрывает блок вне статуса RETURNED_FOR_REVISION, даже если есть вернувшие ЦФО", () => {
    expect(
      showResubmitPanel(
        makeDetail({
          isFilialOwner: true,
          status: "PARTIALLY_APPROVED",
          returnedCfos: [{ id: 2, code: "ОГМ", name: "ОГМ", isActive: true }],
        }),
      ),
    ).toBe(false);
  });

  it("запрещает перенаправление без выбранного ЦФО", () => {
    const detail = makeDetail({ isFilialOwner: true, status: "RETURNED_FOR_REVISION", remarks: [] });

    expect(canResubmit(detail, [])).toBe(false);
  });

  it("запрещает перенаправление, пока остались открытые замечания выбранного ЦФО", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      status: "RETURNED_FOR_REVISION",
      remarks: [makeRemark({ cfoId: 2, status: "OPEN" })],
    });

    expect(canResubmit(detail, [2])).toBe(false);
  });

  it("разрешает перенаправление, когда все замечания выбранного ЦФО исправлены", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      status: "RETURNED_FOR_REVISION",
      remarks: [makeRemark({ cfoId: 2, status: "FIXED_BY_FILIAL" })],
    });

    expect(canResubmit(detail, [2])).toBe(true);
  });

  it("запрещает перенаправление вне статуса RETURNED_FOR_REVISION даже при исправленных замечаниях", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      status: "PARTIALLY_APPROVED",
      remarks: [makeRemark({ cfoId: 2, status: "FIXED_BY_FILIAL" })],
    });

    expect(canResubmit(detail, [2])).toBe(false);
  });
});

describe("canResubmitToDtoe", () => {
  it("запрещает, пока остались открытые замечания ДТОиР", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      status: "RETURNED_BY_DTOE",
      remarks: [makeRemark({ cfoId: null, status: "OPEN" })],
    });

    expect(canResubmitToDtoe(detail)).toBe(false);
  });

  it("разрешает, когда все замечания ДТОиР исправлены", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      status: "RETURNED_BY_DTOE",
      remarks: [makeRemark({ cfoId: null, status: "FIXED_BY_FILIAL" })],
    });

    expect(canResubmitToDtoe(detail)).toBe(true);
  });
});

describe("canMarkRemarkFixed", () => {
  it("разрешает филиалу-автору отметить OPEN-замечание исправленным", () => {
    const detail = makeDetail({ isFilialOwner: true });

    expect(canMarkRemarkFixed(detail, makeRemark({ status: "OPEN" }))).toBe(true);
  });

  it("запрещает для замечания в статусе CLOSED", () => {
    const detail = makeDetail({ isFilialOwner: true });

    expect(canMarkRemarkFixed(detail, makeRemark({ status: "CLOSED" }))).toBe(false);
  });
});

describe("canDeleteRemark", () => {
  it("разрешает автору удалить собственное открытое замечание", () => {
    expect(canDeleteRemark(makeRemark({ authorId: 20, status: "OPEN" }), 20)).toBe(true);
  });

  it("запрещает удаление чужого замечания", () => {
    expect(canDeleteRemark(makeRemark({ authorId: 20, status: "OPEN" }), 99)).toBe(false);
  });

  it("запрещает удаление замечания не в статусе OPEN", () => {
    expect(canDeleteRemark(makeRemark({ authorId: 20, status: "FIXED_BY_FILIAL" }), 20)).toBe(false);
  });
});
