import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";

/**
 * Guard-условия дублируют бэкенд для UX (apps/frontend/AGENTS.md) — реальная
 * защита при любой мутации выполняется бэкендом.
 */

export function canUploadSlotFile(detail: CorrectionDetail): boolean {
  return detail.isFilialOwner && detail.status !== "APPROVED_BY_DTOE";
}

export function canSendForReview(detail: CorrectionDetail): boolean {
  return detail.isFilialOwner && detail.status === "DRAFT" && detail.missingRequirements.length === 0;
}

export function canApproveAsCfo(detail: CorrectionDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

/** Пока статус этого ЦФО = PENDING, можно оставлять замечания к элементам пакета — сколько угодно за один заход. */
export function canLeaveRemarkAsCfo(detail: CorrectionDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

/** Финализирует возврат — доступно, только когда этот ЦФО уже оставил хотя бы одно открытое замечание. */
export function canFinalizeReturnAsCfo(detail: CorrectionDetail): boolean {
  const cfoId = detail.myCfoStatus?.cfoId;
  if (!canLeaveRemarkAsCfo(detail) || cfoId == null) return false;
  return detail.remarks.some((remark) => remark.cfoId === cfoId && remark.status === "OPEN");
}

export function canApproveAsDtoe(detail: CorrectionDetail): boolean {
  return detail.isDtoe && detail.status === "UNDER_DTOE_REVIEW";
}

/** Пока корректировка на проверке ДТОиР, можно оставлять замечания к элементам пакета — сколько угодно за один заход. */
export function canLeaveRemarkAsDtoe(detail: CorrectionDetail): boolean {
  return detail.isDtoe && detail.status === "UNDER_DTOE_REVIEW";
}

/** Финализирует возврат — доступно, только когда ДТОиР уже оставил хотя бы одно открытое замечание. */
export function canFinalizeReturnAsDtoe(detail: CorrectionDetail): boolean {
  if (!canLeaveRemarkAsDtoe(detail)) return false;
  return detail.remarks.some((remark) => remark.cfoId === null && remark.status === "OPEN");
}

export function canSendToDtoe(detail: CorrectionDetail): boolean {
  return detail.isCfoReviewer && detail.status === "ALL_CFO_APPROVED" && detail.myCfoStatus?.status === "APPROVED";
}

export function showResubmitPanel(detail: CorrectionDetail): boolean {
  return detail.isFilialOwner && detail.returnedCfos.length > 0;
}

function openRemarksForCfo(detail: CorrectionDetail, cfoId: number): Remark[] {
  return detail.remarks.filter((remark) => remark.cfoId === cfoId && remark.status !== "CLOSED");
}

export function isCfoReadyForResubmit(detail: CorrectionDetail, cfoId: number): boolean {
  return openRemarksForCfo(detail, cfoId).every((remark) => remark.status === "FIXED_BY_FILIAL");
}

export function canResubmit(detail: CorrectionDetail, selectedCfoIds: number[]): boolean {
  if (selectedCfoIds.length === 0) {
    return false;
  }

  return selectedCfoIds.every((cfoId) => isCfoReadyForResubmit(detail, cfoId));
}

function openRemarksFromDtoe(detail: CorrectionDetail): Remark[] {
  return detail.remarks.filter((remark) => remark.cfoId === null && remark.status !== "CLOSED");
}

export function canResubmitToDtoe(detail: CorrectionDetail): boolean {
  if (!detail.isFilialOwner || detail.status !== "RETURNED_BY_DTOE") {
    return false;
  }

  return openRemarksFromDtoe(detail).every((remark) => remark.status === "FIXED_BY_FILIAL");
}

export function canMarkRemarkFixed(detail: CorrectionDetail, remark: Remark): boolean {
  return detail.isFilialOwner && remark.status === "OPEN";
}

export function canDeleteRemark(remark: Remark, currentUserId: number): boolean {
  return remark.authorId === currentUserId && remark.status === "OPEN";
}
