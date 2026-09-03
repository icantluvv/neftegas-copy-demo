import type { FactCfoStatusValue2, FactPackageStatus2 } from "@/packages/api/base/codegen";

export interface FactCfoStatusGroup {
  key: FactCfoStatusValue2;
  label: string;
  strokeClassName: string;
  dotClassName: string;
}

export const FACT_CFO_STATUS_GROUPS: FactCfoStatusGroup[] = [
  { key: "PENDING", label: "На проверке у нас", strokeClassName: "stroke-sky-500", dotClassName: "bg-sky-500" },
  { key: "RETURNED", label: "Мы вернули", strokeClassName: "stroke-red-500", dotClassName: "bg-red-500" },
  { key: "APPROVED", label: "Мы согласовали", strokeClassName: "stroke-emerald-500", dotClassName: "bg-emerald-500" },
];

export interface FactStageGroup {
  key: string;
  label: string;
  statuses: FactPackageStatus2[];
  strokeClassName: string;
  dotClassName: string;
}

export const FACT_STAGE_GROUPS: FactStageGroup[] = [
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
    statuses: ["APPROVED"],
    strokeClassName: "stroke-emerald-500",
    dotClassName: "bg-emerald-500",
  },
];
