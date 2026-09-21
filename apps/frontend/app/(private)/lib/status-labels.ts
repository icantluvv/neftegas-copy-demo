import type {
  CfoStatusValue2,
  CorrectionStatus2,
  Direction2,
  FactCfoStatusValue2,
  FactPackageStatus2,
  FactRemarkStatus2,
  PlanCfoStatusValue2,
  PlanRemarkStatus2,
  PlanStatus2,
  RemarkStatus2,
} from "@/packages/api/base/codegen";

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

const FACT_PACKAGE_STATUS_LABELS: Record<FactPackageStatus2, StatusLabel> = {
  DRAFT: { text: "Черновик", tone: "neutral" },
  UNDER_CFO_REVIEW: { text: "На проверке ЦФО", tone: "info" },
  PARTIALLY_APPROVED: { text: "Частично согласовано", tone: "info" },
  RETURNED_FOR_REVISION: { text: "Возвращён на доработку", tone: "warning" },
  RESUBMITTED: { text: "Направлено повторно", tone: "info" },
  ALL_CFO_APPROVED: { text: "Согласовано всеми ЦФО", tone: "success" },
  UNDER_DTOE_REVIEW: { text: "На проверке ДТОиР", tone: "info" },
  RETURNED_BY_DTOE: { text: "Возвращён ДТОиР", tone: "danger" },
  APPROVED: { text: "Согласовано", tone: "success" },
};

export function getFactPackageStatusLabel(status: FactPackageStatus2): StatusLabel {
  return FACT_PACKAGE_STATUS_LABELS[status];
}

const FACT_CFO_STATUS_LABELS: Record<FactCfoStatusValue2, StatusLabel> = {
  PENDING: { text: "Ожидает", tone: "neutral" },
  APPROVED: { text: "Согласовано", tone: "success" },
  RETURNED: { text: "Возвращено", tone: "danger" },
};

export function getFactCfoStatusLabel(status: FactCfoStatusValue2): StatusLabel {
  return FACT_CFO_STATUS_LABELS[status];
}

const FACT_REMARK_STATUS_LABELS: Record<FactRemarkStatus2, StatusLabel> = {
  OPEN: { text: "Открыто", tone: "danger" },
  FIXED_BY_FILIAL: { text: "Исправлено филиалом", tone: "warning" },
  CLOSED: { text: "Закрыто", tone: "neutral" },
};

export function getFactRemarkStatusLabel(status: FactRemarkStatus2): StatusLabel {
  return FACT_REMARK_STATUS_LABELS[status];
}

const DIRECTION_LABELS: Record<Direction2, string> = {
  DO: "Диагностическое обследование",
  TOIR: "Техническое обслуживание и ремонт",
  KR_PD: "Капитальный ремонт — подрядный способ",
  KR_HS: "Капитальный ремонт — хозяйственный способ",
};

const DIRECTION_SHORT_LABELS: Record<Direction2, string> = {
  DO: "ДО",
  TOIR: "ТОиР",
  KR_PD: "КР ПД",
  KR_HS: "КР ХС",
};

export function getDirectionLabel(direction: Direction2): string {
  return DIRECTION_LABELS[direction];
}

export function getDirectionShortLabel(direction: Direction2): string {
  return DIRECTION_SHORT_LABELS[direction];
}

const PLAN_STATUS_LABELS: Record<PlanStatus2, StatusLabel> = {
  DRAFT: { text: "Черновик", tone: "neutral" },
  UNDER_CFO_REVIEW: { text: "На проверке ЦФО", tone: "info" },
  PARTIALLY_APPROVED: { text: "Частично согласовано", tone: "info" },
  RETURNED_FOR_REVISION: { text: "Возвращён на доработку", tone: "warning" },
  RESUBMITTED: { text: "Направлено повторно", tone: "info" },
  ALL_CFO_APPROVED: { text: "Согласовано всеми ЦФО", tone: "success" },
  UNDER_DTOE_REVIEW: { text: "На проверке ДТОиР", tone: "info" },
  RETURNED_BY_DTOE: { text: "Возвращён ДТОиР", tone: "danger" },
  APPROVED_BY_DTOE: { text: "Согласован ДТОиР", tone: "success" },
};

export function getPlanStatusLabel(status: PlanStatus2): StatusLabel {
  return PLAN_STATUS_LABELS[status];
}

const PLAN_CFO_STATUS_LABELS: Record<PlanCfoStatusValue2, StatusLabel> = {
  PENDING: { text: "Ожидает", tone: "neutral" },
  APPROVED: { text: "Согласовано", tone: "success" },
  RETURNED: { text: "Возвращено", tone: "danger" },
};

export function getPlanCfoStatusLabel(status: PlanCfoStatusValue2): StatusLabel {
  return PLAN_CFO_STATUS_LABELS[status];
}

const PLAN_REMARK_STATUS_LABELS: Record<PlanRemarkStatus2, StatusLabel> = {
  OPEN: { text: "Открыто", tone: "danger" },
  FIXED_BY_FILIAL: { text: "Исправлено филиалом", tone: "warning" },
  REOPENED: { text: "Возвращено на доработку повторно", tone: "danger" },
  CLOSED: { text: "Закрыто", tone: "neutral" },
};

export function getPlanRemarkStatusLabel(status: PlanRemarkStatus2): StatusLabel {
  return PLAN_REMARK_STATUS_LABELS[status];
}
