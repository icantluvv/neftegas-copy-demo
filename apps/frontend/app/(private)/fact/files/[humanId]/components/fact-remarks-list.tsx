"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { FactPackageDetail, FactPackageRemark } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";

import { getFactRemarkStatusLabel } from "../../../../lib/status-labels";
import { RemarkActionsCell } from "./remark-actions-cell";

function formLabel(detail: FactPackageDetail, formId: number) {
  return detail.forms.find((form) => form.id === formId)?.label ?? "—";
}

export function FactRemarksList({ detail, currentUserId }: { detail: FactPackageDetail; currentUserId: number }) {
  const columns: ColumnDef<FactPackageRemark, unknown>[] = [
    { accessorKey: "humanId", header: "ID" },
    { id: "form", header: "Форма", cell: ({ row }) => formLabel(detail, row.original.relatedFormId) },
    { accessorKey: "issuerLabel", header: "От кого" },
    { accessorKey: "description", header: "Описание" },
    { accessorKey: "requiredAction", header: "Что исправить" },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => {
        const statusLabel = getFactRemarkStatusLabel(row.original.status);
        return <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <RemarkActionsCell detail={detail} remark={row.original} currentUserId={currentUserId} />,
    },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Замечания</h2>
      <DataTable columns={columns} data={detail.remarks} getRowId={(remark) => String(remark.id)} emptyMessage="Замечаний нет" />
    </div>
  );
}
