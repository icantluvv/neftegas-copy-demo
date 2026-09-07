import type { PlanCfoStatusValue2, PlanStatus2 } from "@/packages/api/base/codegen";

export interface PlanCfoStatusGroup {
  key: PlanCfoStatusValue2;
  label: string;
  strokeClassName: string;
  dotClassName: string;
}

// Группировка по статусу СВОЕГО ЦФО (не общему статусу плана) — та же логика,
// что и в «Кабинете ЦФО» корректировок: «статус плана» может отличаться от
// «статуса нашего ЦФО» (другой ЦФО ещё не решил или уже вернул).
export const PLAN_CFO_STATUS_GROUPS: PlanCfoStatusGroup[] = [
  { key: "PENDING", label: "На проверке у нас", strokeClassName: "stroke-sky-500", dotClassName: "bg-sky-500" },
  { key: "RETURNED", label: "Мы вернули", strokeClassName: "stroke-red-500", dotClassName: "bg-red-500" },
  { key: "APPROVED", label: "Мы согласовали", strokeClassName: "stroke-emerald-500", dotClassName: "bg-emerald-500" },
];

export interface PlanStageGroup {
  key: string;
  label: string;
  statuses: PlanStatus2[];
  strokeClassName: string;
  dotClassName: string;
}

// Укрупнение статусов плана для донат-диаграммы рабочего стола — по аналогии
// со STAGE_GROUPS корректировок; статусов у плана на один меньше (нет
// отдельного SENT_TO_DTOE — план на 2027 не реплицирует эту неиспользуемую
// «зеркальную» стадию), поэтому UNDER_DTOE_REVIEW и ALL_CFO_APPROVED также
// относятся к группе «в работе».
export const PLAN_STAGE_GROUPS: PlanStageGroup[] = [
  {
    key: "draft",
    label: "Черновик",
    statuses: ["DRAFT"],
    strokeClassName: "stroke-gray-400",
    dotClassName: "bg-gray-400",
  },
  {
    key: "in_progress",
    label: "В работе",
    statuses: ["UNDER_CFO_REVIEW", "PARTIALLY_APPROVED", "RESUBMITTED", "ALL_CFO_APPROVED", "UNDER_DTOE_REVIEW"],
    strokeClassName: "stroke-sky-500",
    dotClassName: "bg-sky-500",
  },
  {
    key: "returned",
    label: "Возвращено",
    statuses: ["RETURNED_FOR_REVISION", "RETURNED_BY_DTOE"],
    strokeClassName: "stroke-red-500",
    dotClassName: "bg-red-500",
  },
  {
    key: "approved",
    label: "Согласовано",
    statuses: ["APPROVED_BY_DTOE"],
    strokeClassName: "stroke-emerald-500",
    dotClassName: "bg-emerald-500",
  },
];
