import type { FactPackageDetail, FactPackageRemark } from "@/packages/api/base/codegen";

/**
 * Guard-условия дублируют бэкенд для UX (apps/frontend/AGENTS.md) — реальная
 * защита при любой мутации выполняется бэкендом (apps/backend/src/fact-packages).
 */

export function canUploadFormVersion(detail: FactPackageDetail): boolean {
  return detail.isFilialOwner && detail.status !== "APPROVED";
}

/** Направить можно с любым числом загруженных форм — полная комплектация не требуется (design.md). */
export function canSubmit(detail: FactPackageDetail): boolean {
  return detail.isFilialOwner && detail.canSubmit;
}

export function canApproveAsCfo(detail: FactPackageDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

/** Оставление замечания ЦФО — атомарно возвращает пакет на доработку (design.md), отдельного шага-подтверждения нет. */
export function canLeaveRemarkAsCfo(detail: FactPackageDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

/** ДТОиР только фиксирует замечание — фактический возврат делает отдельное действие finalDecision(RETURN). */
export function canLeaveRemarkAsDtoe(detail: FactPackageDetail): boolean {
  return detail.isDtoe && detail.status === "UNDER_DTOE_REVIEW";
}

export function canSendToDtoe(detail: FactPackageDetail): boolean {
  return detail.isCfoReviewer && detail.canSendToDtoe && detail.myCfoStatus?.status === "APPROVED";
}

export function canFinalDecideAsDtoe(detail: FactPackageDetail): boolean {
  return detail.isDtoe && detail.status === "UNDER_DTOE_REVIEW";
}

export function canMarkRemarkFixed(detail: FactPackageDetail, remark: FactPackageRemark): boolean {
  return detail.isFilialOwner && remark.status === "OPEN";
}

export function canDeleteRemark(remark: FactPackageRemark, currentUserId: number): boolean {
  return remark.authorId === currentUserId && remark.status === "OPEN";
}
