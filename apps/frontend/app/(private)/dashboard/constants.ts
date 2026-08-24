import type { CfoStatusValue2, CorrectionStatus2 } from "@/packages/api/base/codegen";

export interface CfoStatusGroup {
  key: CfoStatusValue2;
  label: string;
  strokeClassName: string;
  dotClassName: string;
}

// Группировка по статусу СВОЕГО ЦФО (не общему статусу пакета) — ЧТЗ «Кабинет
// ЦФО», раздел 2.4: две колонки/оси намеренно разведены, «статус пакета» может
// отличаться от «статуса нашего ЦФО» (другой ЦФО ещё не решил или уже вернул).
export const CFO_STATUS_GROUPS: CfoStatusGroup[] = [
  { key: "PENDING", label: "На проверке у нас", strokeClassName: "stroke-sky-500", dotClassName: "bg-sky-500" },
  { key: "RETURNED", label: "Мы вернули", strokeClassName: "stroke-red-500", dotClassName: "bg-red-500" },
  { key: "APPROVED", label: "Мы согласовали", strokeClassName: "stroke-emerald-500", dotClassName: "bg-emerald-500" },
];

export interface StageGroup {
  key: string;
  label: string;
  statuses: CorrectionStatus2[];
  strokeClassName: string;
  dotClassName: string;
}

// Пять групп — укрупнение десяти системных статусов (ЧТЗ «Кабинет Филиала», 2.2):
// филиалу не нужны различия между этапами, где действие не на его стороне.
export const STAGE_GROUPS: StageGroup[] = [
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
    statuses: [
      "UNDER_CFO_REVIEW",
      "PARTIALLY_APPROVED",
      "RESUBMITTED",
      "UNDER_DTOE_REVIEW",
      "ALL_CFO_APPROVED",
      "SENT_TO_DTOE",
    ],
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
