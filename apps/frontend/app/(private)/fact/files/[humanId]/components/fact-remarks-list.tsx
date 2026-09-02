"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { FactPackageDetail, FactPackageRemark } from "@/packages/api/base/codegen";
import { useDeleteFactPackageRemark, useFixFactPackageRemark } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";

import { getFactRemarkStatusLabel } from "../../../../lib/status-labels";
import { canDeleteRemark, canMarkRemarkFixed } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";

function formLabel(detail: FactPackageDetail, formId: number) {
  return detail.forms.find((form) => form.id === formId)?.label ?? "—";
}

/**
 * Что это: кнопки «Отметить исправленным» / «Удалить» в строке замечания.
 * Кто видит: «Исправлено» — Филиал-владелец пакета; «Удалить» — автор замечания.
 * Когда активен: «Исправлено» — пока замечание в статусе «Открыто»; «Удалить» — тот же автор и тот же статус (правило 7 AGENTS.md).
 * Что происходит: «Исправлено» переводит замечание в статус «Исправлено филиалом»; «Удалить» удаляет запись безвозвратно.
 */
function RemarkActionsCell({
  detail,
  remark,
  currentUserId,
}: {
  detail: FactPackageDetail;
  remark: FactPackageRemark;
  currentUserId: number;
}) {
  const invalidate = useInvalidateFactPackage(detail.humanId);
  const markFixed = useFixFactPackageRemark({ mutation: { onSuccess: invalidate } });
  const deleteRemark = useDeleteFactPackageRemark({ mutation: { onSuccess: invalidate } });

  return (
    <div className="flex gap-2">
      {canMarkRemarkFixed(detail, remark) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={markFixed.isPending}
          onClick={() => markFixed.mutate({ humanId: detail.humanId, remarkId: remark.id })}
        >
          Отметить исправленным
        </Button>
      )}
      {canDeleteRemark(remark, currentUserId) && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={deleteRemark.isPending}
          onClick={() => deleteRemark.mutate({ humanId: detail.humanId, remarkId: remark.id })}
        >
          Удалить
        </Button>
      )}
    </div>
  );
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
