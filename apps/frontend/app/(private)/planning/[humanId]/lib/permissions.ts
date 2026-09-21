import type { PlanDetail, PlanStatus2, PlanRemark } from "@/packages/api/base/codegen";

/**
 * Guard-условия дублируют бэкенд для UX (apps/frontend/AGENTS.md) — реальная
 * защита при любой мутации выполняется бэкендом.
 */

export function canUploadSlotFile(detail: PlanDetail): boolean {
  return detail.isFilialOwner && detail.status !== "APPROVED_BY_DTOE";
}

export function canSendForReview(detail: PlanDetail): boolean {
  return detail.isFilialOwner && detail.status === "DRAFT" && detail.missingRequirements.length === 0;
}

export function canApproveAsCfo(detail: PlanDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

export function canLeaveRemarkAsCfo(detail: PlanDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

export function canFinalizeReturnAsCfo(detail: PlanDetail): boolean {
  const cfoId = detail.myCfoStatus?.cfoId;
  if (!canLeaveRemarkAsCfo(detail) || cfoId == null) return false;
  return detail.remarks.some((remark) => remark.cfoId === cfoId && remark.status === "OPEN");
}

export function canApproveAsDtoe(detail: PlanDetail): boolean {
  return detail.isDtoe && detail.status === "UNDER_DTOE_REVIEW";
}

export function canLeaveRemarkAsDtoe(detail: PlanDetail): boolean {
  return detail.isDtoe && detail.status === "UNDER_DTOE_REVIEW";
}

export function canFinalizeReturnAsDtoe(detail: PlanDetail): boolean {
  if (!canLeaveRemarkAsDtoe(detail)) return false;
  return detail.remarks.some((remark) => remark.cfoId === null && remark.status === "OPEN");
}

export function canSendToDtoe(detail: PlanDetail): boolean {
  return detail.isCfoReviewer && detail.status === "ALL_CFO_APPROVED" && detail.myCfoStatus?.status === "APPROVED";
}

/**
 * Отменяет собственное решение этого ЦФО (согласовал/вернул) обратно в PENDING —
 * страховка от случайного клика. Оставленные замечания не трогает (часть истории),
 * меняет только статус ЦФО. Недоступно, если план уже ушёл в ДТОиР — там
 * отменять уже нечего на уровне ЦФО.
 */
export function canCancelCfoDecision(detail: PlanDetail): boolean {
  if (!detail.isCfoReviewer) return false;
  if (detail.myCfoStatus?.status !== "APPROVED" && detail.myCfoStatus?.status !== "RETURNED") return false;
  const lockedStatuses: PlanStatus2[] = ["UNDER_DTOE_REVIEW", "RETURNED_BY_DTOE", "APPROVED_BY_DTOE"];
  return !lockedStatuses.includes(detail.status);
}

export function showResubmitPanel(detail: PlanDetail): boolean {
  return detail.isFilialOwner && detail.status === "RETURNED_FOR_REVISION" && detail.returnedCfos.length > 0;
}

function openRemarksForCfo(detail: PlanDetail, cfoId: number): PlanRemark[] {
  return detail.remarks.filter((remark) => remark.cfoId === cfoId && remark.status !== "CLOSED");
}

export function isCfoReadyForResubmit(detail: PlanDetail, cfoId: number): boolean {
  return openRemarksForCfo(detail, cfoId).every((remark) => remark.status === "FIXED_BY_FILIAL");
}

export function canResubmit(detail: PlanDetail, selectedCfoIds: number[]): boolean {
  if (detail.status !== "RETURNED_FOR_REVISION" || selectedCfoIds.length === 0) {
    return false;
  }

  return selectedCfoIds.every((cfoId) => isCfoReadyForResubmit(detail, cfoId));
}

function openRemarksFromDtoe(detail: PlanDetail): PlanRemark[] {
  return detail.remarks.filter((remark) => remark.cfoId === null && remark.status !== "CLOSED");
}

export function canResubmitToDtoe(detail: PlanDetail): boolean {
  if (!detail.isFilialOwner || detail.status !== "RETURNED_BY_DTOE") {
    return false;
  }

  return openRemarksFromDtoe(detail).every((remark) => remark.status === "FIXED_BY_FILIAL");
}

export function canMarkRemarkFixed(detail: PlanDetail, remark: PlanRemark): boolean {
  return detail.isFilialOwner && remark.status === "OPEN";
}

export function canDeleteRemark(remark: PlanRemark, currentUserId: number): boolean {
  return remark.authorId === currentUserId && remark.status === "OPEN";
}
