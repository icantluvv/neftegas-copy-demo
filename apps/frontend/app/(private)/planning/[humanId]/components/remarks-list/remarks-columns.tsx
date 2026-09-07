import type { ColumnDef } from "@tanstack/react-table";

import type { PlanDetail, PlanRemark } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";

import { getPlanRemarkStatusLabel } from "../../../../lib/status-labels";
import { RemarkActionsCell } from "./remark-actions-cell";

function slotLabel(detail: PlanDetail, slotId: number | null | undefined) {
  return detail.slots.find((slot) => slot.id === slotId)?.label ?? "—";
}

function remarkLocation(remark: PlanRemark) {
  return [remark.sheetName, remark.rowRef, remark.cellRef].filter(Boolean).join(" / ") || "—";
}

interface RemarksColumnsParams {
  detail: PlanDetail;
  currentUserId: number;
}

/** Колонки таблицы замечаний; зависят от карточки — поэтому фабрика, а не константа. */
export function createRemarksColumns({ detail, currentUserId }: RemarksColumnsParams): ColumnDef<PlanRemark, unknown>[] {
  return [
    { accessorKey: "humanId", header: "ID" },
    { id: "slot", header: "Элемент пакета", cell: ({ row }) => slotLabel(detail, row.original.relatedSlotId) },
    { accessorKey: "issuerLabel", header: "От кого" },
    { accessorKey: "description", header: "Описание" },
    { accessorKey: "requiredAction", header: "Что исправить" },
    { id: "location", header: "Лист/строка/ячейка", cell: ({ row }) => remarkLocation(row.original) },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => {
        const statusLabel = getPlanRemarkStatusLabel(row.original.status);
        return <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <RemarkActionsCell detail={detail} remark={row.original} currentUserId={currentUserId} />,
    },
  ];
}
