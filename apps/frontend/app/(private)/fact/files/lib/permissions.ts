import type { FactPackageDetail, FactPackageRemark } from "@/packages/api/base/codegen";

export function canUploadFormVersion(detail: FactPackageDetail): boolean {
  return (detail.isFilialOwner || detail.isCfoOwner) && detail.status !== "APPROVED";
}

export function canSubmit(detail: FactPackageDetail): boolean {
  return (detail.isFilialOwner || detail.isCfoOwner) && detail.canSubmit;
}

export function canApproveAsCfo(detail: FactPackageDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

export function canLeaveRemarkAsCfo(detail: FactPackageDetail): boolean {
  return detail.isCfoReviewer && detail.myCfoStatus?.status === "PENDING";
}

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
  return (detail.isFilialOwner || detail.isCfoOwner) && remark.status === "OPEN";
}

export function canDeleteRemark(remark: FactPackageRemark, currentUserId: number): boolean {
  return remark.authorId === currentUserId && remark.status === "OPEN";
}
