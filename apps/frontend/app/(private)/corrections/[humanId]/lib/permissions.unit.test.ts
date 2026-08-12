import { describe, expect, it } from "vitest";

import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";

import {
  canApproveAsCfo,
  canApproveAsDtoe,
  canDeleteRemark,
  canMarkRemarkFixed,
  canResubmit,
  canResubmitToDtoe,
  canReturnAsCfo,
  canReturnAsDtoe,
  canSendForReview,
  canSendToDtoe,
  canUploadSlotFile,
  showResubmitPanel,
} from "./permissions";

function makeRemark(overrides: Partial<Remark> = {}): Remark {
  return {
    id: 1,
    humanId: "REM-000001",
    correctionId: 1,
    cfoId: 10,
    authorId: 20,
    createdAt: "2026-08-01T00:00:00.000Z",
    relatedSlotId: 1,
    fileVersionId: null,
    sheetName: "",
    rowRef: "",
    cellRef: "",
    description: "Нет счёта за март",
    requiredAction: "Приложить счёт за март",
    status: "OPEN",
    closedById: null,
    closedAt: null,
    issuerLabel: "ОГМ",
    ...overrides,
  };
}

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
  return {
    id: 1,
    humanId: "COR-000001",
    filialId: 1,
    correctionTypeId: 1,
    authorId: 5,
    status: "DRAFT",
    stageNote: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    sentToDtoeAt: null,
    decidedAt: null,
    canSend: true,
    canSendToDtoe: false,
    openRemarksCount: 0,
    filial: { id: 1, code: "ФИЛИАЛ", name: "Филиал", isActive: true },
    correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
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
      canSendForReview(makeDetail({ isFilialOwner: true, status: "DRAFT", missingRequirements: ["Счета на оплату"] })),
    ).toBe(false);
  });

  it("запрещает направление не из статуса DRAFT", () => {
    expect(canSendForReview(makeDetail({ isFilialOwner: true, status: "UNDER_CFO_REVIEW", missingRequirements: [] }))).toBe(
      false,
    );
  });
});

describe("canApproveAsCfo / canReturnAsCfo", () => {
  it("разрешает согласование/возврат, пока статус ЦФО PENDING", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedAt: null },
    });

    expect(canApproveAsCfo(detail)).toBe(true);
    expect(canReturnAsCfo(detail)).toBe(true);
  });

  it("запрещает повторное согласование, если статус ЦФО уже APPROVED", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2026-08-01T00:00:00.000Z" },
    });

    expect(canApproveAsCfo(detail)).toBe(false);
  });

  it("запрещает возврат, если статус ЦФО уже RETURNED", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "RETURNED", isRequired: true, decidedById: 9, decidedAt: "2026-08-01T00:00:00.000Z" },
    });

    expect(canReturnAsCfo(detail)).toBe(false);
  });
});

describe("canSendToDtoe", () => {
  it("разрешает направление в ДТОиР любому согласовавшему ЦФО, когда статус ALL_CFO_APPROVED", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      status: "ALL_CFO_APPROVED",
      myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2026-08-01T00:00:00.000Z" },
    });

    expect(canSendToDtoe(detail)).toBe(true);
  });

  it("запрещает направление в ДТОиР, пока не все обязательные ЦФО согласовали", () => {
    const detail = makeDetail({
      isCfoReviewer: true,
      status: "PARTIALLY_APPROVED",
      myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedAt: "2026-08-01T00:00:00.000Z" },
    });

    expect(canSendToDtoe(detail)).toBe(false);
  });
});

describe("canApproveAsDtoe / canReturnAsDtoe", () => {
  it("разрешает финальное согласование/возврат только в UNDER_DTOE_REVIEW", () => {
    const detail = makeDetail({ isDtoe: true, status: "UNDER_DTOE_REVIEW" });

    expect(canApproveAsDtoe(detail)).toBe(true);
    expect(canReturnAsDtoe(detail)).toBe(true);
  });

  it("запрещает вне UNDER_DTOE_REVIEW", () => {
    const detail = makeDetail({ isDtoe: true, status: "ALL_CFO_APPROVED" });

    expect(canApproveAsDtoe(detail)).toBe(false);
    expect(canReturnAsDtoe(detail)).toBe(false);
  });
});

describe("showResubmitPanel / canResubmit", () => {
  it("скрывает блок, если ни один ЦФО не возвращал пакет", () => {
    expect(showResubmitPanel(makeDetail({ isFilialOwner: true, returnedCfos: [] }))).toBe(false);
  });

  it("показывает блок, если есть вернувшие ЦФО", () => {
    expect(
      showResubmitPanel(makeDetail({ isFilialOwner: true, returnedCfos: [{ id: 2, code: "ОГМ", name: "ОГМ", isActive: true }] })),
    ).toBe(true);
  });

  it("запрещает перенаправление без выбранного ЦФО", () => {
    const detail = makeDetail({ isFilialOwner: true, remarks: [] });

    expect(canResubmit(detail, [])).toBe(false);
  });

  it("запрещает перенаправление, пока остались открытые замечания выбранного ЦФО", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      remarks: [makeRemark({ cfoId: 2, status: "OPEN" })],
    });

    expect(canResubmit(detail, [2])).toBe(false);
  });

  it("разрешает перенаправление, когда все замечания выбранного ЦФО исправлены", () => {
    const detail = makeDetail({
      isFilialOwner: true,
      remarks: [makeRemark({ cfoId: 2, status: "FIXED_BY_FILIAL" })],
    });

    expect(canResubmit(detail, [2])).toBe(true);
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
