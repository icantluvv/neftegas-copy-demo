import type { CfoStatusValue2, CorrectionStatus2, RemarkStatus2 } from "@/packages/api/base/codegen";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusLabel {
  text: string;
  tone: BadgeTone;
}

const CORRECTION_STATUS_LABELS: Record<CorrectionStatus2, StatusLabel> = {
  DRAFT: { text: "Черновик", tone: "neutral" },
  UNDER_CFO_REVIEW: { text: "На проверке ЦФО", tone: "info" },
  PARTIALLY_APPROVED: { text: "Частично согласовано", tone: "info" },
  RETURNED_FOR_REVISION: { text: "Возвращено на доработку", tone: "warning" },
  RESUBMITTED: { text: "Направлено повторно", tone: "info" },
  ALL_CFO_APPROVED: { text: "Согласовано всеми ЦФО", tone: "success" },
  SENT_TO_DTOE: { text: "Направлено в ДТОиР", tone: "info" },
  UNDER_DTOE_REVIEW: { text: "На проверке ДТОиР", tone: "info" },
  RETURNED_BY_DTOE: { text: "Возвращено ДТОиР", tone: "danger" },
  APPROVED_BY_DTOE: { text: "Согласовано ДТОиР", tone: "success" },
};

export function getCorrectionStatusLabel(status: CorrectionStatus2): StatusLabel {
  return CORRECTION_STATUS_LABELS[status];
}

const CFO_STATUS_LABELS: Record<CfoStatusValue2, StatusLabel> = {
  PENDING: { text: "Ожидает", tone: "neutral" },
  APPROVED: { text: "Согласовано", tone: "success" },
  RETURNED: { text: "Возвращено", tone: "danger" },
};

export function getCfoStatusLabel(status: CfoStatusValue2): StatusLabel {
  return CFO_STATUS_LABELS[status];
}

const REMARK_STATUS_LABELS: Record<RemarkStatus2, StatusLabel> = {
  OPEN: { text: "Открыто", tone: "danger" },
  FIXED_BY_FILIAL: { text: "Исправлено филиалом", tone: "warning" },
  REOPENED: { text: "Возвращено на доработку повторно", tone: "danger" },
  CLOSED: { text: "Закрыто", tone: "neutral" },
};

export function getRemarkStatusLabel(status: RemarkStatus2): StatusLabel {
  return REMARK_STATUS_LABELS[status];
}
