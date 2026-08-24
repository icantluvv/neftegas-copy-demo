import type { ColumnDef } from "@tanstack/react-table";

import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";

import { getRemarkStatusLabel } from "../../../../lib/status-labels";
import { RemarkActionsCell } from "./remark-actions-cell";

function slotLabel(detail: CorrectionDetail, slotId: number | null | undefined) {
  return detail.slots.find((slot) => slot.id === slotId)?.label ?? "—";
}

function remarkLocation(remark: Remark) {
  return [remark.sheetName, remark.rowRef, remark.cellRef].filter(Boolean).join(" / ") || "—";
}

interface RemarksColumnsParams {
  detail: CorrectionDetail;
  currentUserId: number;
}

/** Колонки таблицы замечаний; зависят от карточки — поэтому фабрика, а не константа. */
export function createRemarksColumns({ detail, currentUserId }: RemarksColumnsParams): ColumnDef<Remark, unknown>[] {
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
        const statusLabel = getRemarkStatusLabel(row.original.status);
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
