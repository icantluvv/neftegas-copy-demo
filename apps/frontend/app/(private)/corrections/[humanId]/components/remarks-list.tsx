"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";
import { getCorrectionSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";
import {
  useApproveCorrectionByCfo,
  useApproveCorrectionByDtoe,
  useDeleteRemark,
  useMarkRemarkFixed,
  useReturnCorrectionByCfo,
  useReturnCorrectionByDtoe,
  useSendCorrectionToDtoe,
} from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";

import {
  canApproveAsCfo,
  canApproveAsDtoe,
  canDeleteRemark,
  canMarkRemarkFixed,
  canReturnAsCfo,
  canReturnAsDtoe,
  canSendToDtoe,
} from "../lib/permissions";
import { getRemarkStatusLabel } from "../../../lib/status-labels";
import { ReturnRemarkDialog } from "./return-remark-dialog";

function slotLabel(detail: CorrectionDetail, slotId: number | null | undefined) {
  return detail.slots.find((slot) => slot.id === slotId)?.label ?? "—";
}

function RemarkActionsCell({
  detail,
  remark,
  currentUserId,
}: {
  detail: CorrectionDetail;
  remark: Remark;
  currentUserId: number;
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });

  const markFixed = useMarkRemarkFixed({ mutation: { onSuccess: () => void invalidate() } });
  const deleteRemark = useDeleteRemark({ mutation: { onSuccess: () => void invalidate() } });

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

function RemarksActionBar({ detail }: { detail: CorrectionDetail }) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });

  const approveAsCfo = useApproveCorrectionByCfo({ mutation: { onSuccess: () => void invalidate() } });
  const returnAsCfo = useReturnCorrectionByCfo({ mutation: { onSuccess: () => void invalidate() } });
  const sendToDtoe = useSendCorrectionToDtoe({ mutation: { onSuccess: () => void invalidate() } });
  const approveAsDtoe = useApproveCorrectionByDtoe({ mutation: { onSuccess: () => void invalidate() } });
  const returnAsDtoe = useReturnCorrectionByDtoe({ mutation: { onSuccess: () => void invalidate() } });

  return (
    <div className="flex flex-wrap gap-2">
      {canApproveAsCfo(detail) && (
        <Button
          type="button"
          disabled={approveAsCfo.isPending}
          onClick={() => approveAsCfo.mutate({ humanId: detail.humanId })}
        >
          Согласовать
        </Button>
      )}
      {canReturnAsCfo(detail) && (
        <ReturnRemarkDialog
          triggerLabel="Вернуть на доработку"
          isSubmitting={returnAsCfo.isPending}
          onSubmit={(data) => returnAsCfo.mutate({ humanId: detail.humanId, data })}
        />
      )}
      {canSendToDtoe(detail) && (
        <Button
          type="button"
          disabled={sendToDtoe.isPending}
          onClick={() => sendToDtoe.mutate({ humanId: detail.humanId })}
        >
          Направить в ДТОиР
        </Button>
      )}
      {canApproveAsDtoe(detail) && (
        <Button
          type="button"
          disabled={approveAsDtoe.isPending}
          onClick={() => approveAsDtoe.mutate({ humanId: detail.humanId })}
        >
          Согласовать (ДТОиР)
        </Button>
      )}
      {canReturnAsDtoe(detail) && (
        <ReturnRemarkDialog
          triggerLabel="Вернуть на доработку (ДТОиР)"
          isSubmitting={returnAsDtoe.isPending}
          onSubmit={(data) => returnAsDtoe.mutate({ humanId: detail.humanId, data })}
        />
      )}
    </div>
  );
}

export function RemarksList({ detail, currentUserId }: { detail: CorrectionDetail; currentUserId: number }) {
  const columns: ColumnDef<Remark, unknown>[] = [
    { accessorKey: "humanId", header: "ID" },
    { id: "slot", header: "Элемент пакета", cell: ({ row }) => slotLabel(detail, row.original.relatedSlotId) },
    { accessorKey: "issuerLabel", header: "От кого" },
    { accessorKey: "description", header: "Описание" },
    { accessorKey: "requiredAction", header: "Что исправить" },
    {
      id: "location",
      header: "Лист/строка/ячейка",
      cell: ({ row }) =>
        [row.original.sheetName, row.original.rowRef, row.original.cellRef].filter(Boolean).join(" / ") || "—",
    },
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Замечания</h2>
        <RemarksActionBar detail={detail} />
      </div>
      <DataTable
        columns={columns}
        data={detail.remarks}
        getRowId={(remark) => String(remark.id)}
        emptyMessage="Замечаний нет"
      />
    </div>
  );
}
