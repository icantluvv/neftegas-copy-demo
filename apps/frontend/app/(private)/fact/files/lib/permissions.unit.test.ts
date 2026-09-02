import { describe, expect, it } from "vitest";

import type { FactPackageDetail, FactPackageRemark } from "@/packages/api/base/codegen";

import {
  canApproveAsCfo,
  canDeleteRemark,
  canFinalDecideAsDtoe,
  canLeaveRemarkAsCfo,
  canLeaveRemarkAsDtoe,
  canMarkRemarkFixed,
  canSendToDtoe,
  canSubmit,
  canUploadFormVersion,
} from "./permissions";

function makeRemark(overrides: Partial<FactPackageRemark> = {}): FactPackageRemark {
  return {
    id: 1,
    humanId: "FCT-REM-000001",
    factPackageId: 1,
    cfoId: 10,
    relatedFormId: 1,
    authorId: 20,
    createdAt: "2026-08-01T00:00:00.000Z",
    description: "Нет акта за март",
    requiredAction: "Приложить акт за март",
    status: "OPEN",
    closedAt: null,
    issuerLabel: "ОГМ",
    ...overrides,
  };
}

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
  return {
    id: 1,
    humanId: "FCT-000001",
    filialId: 1,
    direction: "DO",
    authorId: 5,
    status: "DRAFT",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    sentToDtoeAt: null,
    decidedAt: null,
    canSubmit: true,
    canSendToDtoe: false,
    openRemarksCount: 0,
    filial: { id: 1, code: "ФИЛИАЛ", name: "Филиал", isActive: true },
    author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
    forms: [],
    cfoStatuses: [],
    remarks: [],
    history: [],
    packageComplete: true,
    missingForms: [],
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

describe("canUploadFormVersion", () => {
  it("разрешает владельцу-филиалу вне финального статуса", () => {
    expect(canUploadFormVersion(makeDetail({ isFilialOwner: true, status: "DRAFT" }))).toBe(true);
  });

  it("запрещает не-владельцу", () => {
    expect(canUploadFormVersion(makeDetail({ isFilialOwner: false, status: "DRAFT" }))).toBe(false);
  });

  it("запрещает после финального согласования (APPROVED)", () => {
    expect(canUploadFormVersion(makeDetail({ isFilialOwner: true, status: "APPROVED" }))).toBe(false);
  });
});

describe("canSubmit", () => {
  it("разрешает владельцу, когда canSubmit=true, независимо от комплектации", () => {
    expect(
      canSubmit(makeDetail({ isFilialOwner: true, canSubmit: true, packageComplete: false })),
    ).toBe(true);
  });

  it("запрещает не-владельцу", () => {
    expect(
      canSubmit(makeDetail({ isFilialOwner: false, canSubmit: true, packageComplete: true })),
    ).toBe(false);
  });

  it("запрещает, когда статус не позволяет направление (canSubmit=false)", () => {
    expect(
      canSubmit(makeDetail({ isFilialOwner: true, canSubmit: false, packageComplete: true })),
    ).toBe(false);
  });
});

describe("canApproveAsCfo", () => {
  it("разрешает проверяющему ЦФО со своим статусом PENDING", () => {
    expect(
      canApproveAsCfo(
        makeDetail({ isCfoReviewer: true, myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" } }),
      ),
    ).toBe(true);
  });

  it("запрещает, если статус ЦФО уже не PENDING", () => {
    expect(
      canApproveAsCfo(
        makeDetail({ isCfoReviewer: true, myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED" } }),
      ),
    ).toBe(false);
  });

  it("запрещает не-ЦФО", () => {
    expect(
      canApproveAsCfo(
        makeDetail({ isCfoReviewer: false, myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" } }),
      ),
    ).toBe(false);
  });
});

describe("canLeaveRemarkAsCfo", () => {
  it("разрешает проверяющему ЦФО со своим статусом PENDING", () => {
    expect(
      canLeaveRemarkAsCfo(
        makeDetail({ isCfoReviewer: true, myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" } }),
      ),
    ).toBe(true);
  });

  it("запрещает, если ЦФО уже принял решение", () => {
    expect(
      canLeaveRemarkAsCfo(
        makeDetail({ isCfoReviewer: true, myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "RETURNED" } }),
      ),
    ).toBe(false);
  });
});

describe("canLeaveRemarkAsDtoe", () => {
  it("разрешает ДТОиР, когда пакет на его проверке", () => {
    expect(canLeaveRemarkAsDtoe(makeDetail({ isDtoe: true, status: "UNDER_DTOE_REVIEW" }))).toBe(true);
  });

  it("запрещает, если пакет не на проверке ДТОиР", () => {
    expect(canLeaveRemarkAsDtoe(makeDetail({ isDtoe: true, status: "ALL_CFO_APPROVED" }))).toBe(false);
  });

  it("запрещает не-ДТОиР", () => {
    expect(canLeaveRemarkAsDtoe(makeDetail({ isDtoe: false, status: "UNDER_DTOE_REVIEW" }))).toBe(false);
  });
});

describe("canSendToDtoe", () => {
  it("разрешает согласовавшему ЦФО, когда пакет готов к отправке в ДТОиР", () => {
    expect(
      canSendToDtoe(
        makeDetail({
          isCfoReviewer: true,
          canSendToDtoe: true,
          myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED" },
        }),
      ),
    ).toBe(true);
  });

  it("запрещает, если сам ЦФО ещё не согласовал (даже если другие согласовали)", () => {
    expect(
      canSendToDtoe(
        makeDetail({
          isCfoReviewer: true,
          canSendToDtoe: true,
          myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" },
        }),
      ),
    ).toBe(false);
  });

  it("запрещает, если общий статус пакета ещё не позволяет отправку", () => {
    expect(
      canSendToDtoe(
        makeDetail({
          isCfoReviewer: true,
          canSendToDtoe: false,
          myCfoStatus: { id: 1, factPackageId: 1, cfoId: 10, cfo: { id: 10, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED" },
        }),
      ),
    ).toBe(false);
  });
});

describe("canFinalDecideAsDtoe", () => {
  it("разрешает ДТОиР на пакете, находящемся на его проверке", () => {
    expect(canFinalDecideAsDtoe(makeDetail({ isDtoe: true, status: "UNDER_DTOE_REVIEW" }))).toBe(true);
  });

  it("запрещает вне статуса UNDER_DTOE_REVIEW", () => {
    expect(canFinalDecideAsDtoe(makeDetail({ isDtoe: true, status: "APPROVED" }))).toBe(false);
  });
});

describe("canMarkRemarkFixed", () => {
  it("разрешает владельцу-филиалу для открытого замечания", () => {
    expect(canMarkRemarkFixed(makeDetail({ isFilialOwner: true }), makeRemark({ status: "OPEN" }))).toBe(true);
  });

  it("запрещает для уже исправленного замечания", () => {
    expect(
      canMarkRemarkFixed(makeDetail({ isFilialOwner: true }), makeRemark({ status: "FIXED_BY_FILIAL" })),
    ).toBe(false);
  });

  it("запрещает не-владельцу", () => {
    expect(canMarkRemarkFixed(makeDetail({ isFilialOwner: false }), makeRemark({ status: "OPEN" }))).toBe(false);
  });
});

describe("canDeleteRemark", () => {
  it("разрешает автору замечания в статусе OPEN", () => {
    expect(canDeleteRemark(makeRemark({ authorId: 20, status: "OPEN" }), 20)).toBe(true);
  });

  it("запрещает не-автору", () => {
    expect(canDeleteRemark(makeRemark({ authorId: 20, status: "OPEN" }), 99)).toBe(false);
  });

  it("запрещает для закрытого замечания, даже автору", () => {
    expect(canDeleteRemark(makeRemark({ authorId: 20, status: "CLOSED" }), 20)).toBe(false);
  });
});
