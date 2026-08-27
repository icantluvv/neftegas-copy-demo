"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import type { CorrectionDetail, DocumentSlot2, RemarkCreateInput } from "@/packages/api/base/codegen";
import { getCorrectionSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";
import { useLeaveRemark, useUploadFileVersion } from "@/packages/api/base/codegen";
import { clientEnvironment } from "#/env/client";
import { cn } from "@/lib/utils";

import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { canLeaveRemarkAsCfo, canLeaveRemarkAsDtoe, canUploadSlotFile } from "../lib/permissions";
import { ReturnRemarkDialog } from "./return-remark-dialog";

function ReviewedCheckbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "flex size-12 min-w-12 shrink-0 items-center justify-center rounded-lg border transition-colors",
        checked ? "border-foreground bg-foreground" : "border-input bg-background hover:border-foreground",
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" fill="none" className="size-6 text-background" aria-hidden="true">
          <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function openRemarkForSlot(detail: CorrectionDetail, slotId: number) {
  return detail.remarks.find((remark) => remark.relatedSlotId === slotId && remark.status !== "CLOSED");
}

function SlotLabelCell({ slot, canDownload }: { slot: DocumentSlot2; canDownload: boolean }) {
  if (!canDownload || !slot.currentVersion) {
    return <>{slot.label}</>;
  }

  return (
    <a
      href={`${clientEnvironment.NEXT_PUBLIC_BACK_URL}/files/${slot.currentVersion.id}/download`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-4 hover:underline"
    >
      {slot.label}
    </a>
  );
}

function CurrentVersionCell({ slot, canDownload }: { slot: DocumentSlot2; canDownload: boolean }) {
  if (!slot.currentVersion) {
    return <span className="text-muted-foreground">Нет версий</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span>Версия {slot.currentVersion.versionNumber}</span>
      <span className="text-xs text-muted-foreground">{formatNotificationDateTime(slot.currentVersion.uploadedAt)}</span>
      {canDownload && (
        <a
          href={`${clientEnvironment.NEXT_PUBLIC_BACK_URL}/files/${slot.currentVersion.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-xs text-primary underline-offset-4 hover:underline"
        >
          Открыть / скачать
        </a>
      )}
    </div>
  );
}

function UploadSlotFileCell({ detail, slot }: { detail: CorrectionDetail; slot: DocumentSlot2 }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFileVersion({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });
      },
    },
  });

  if (!canUploadSlotFile(detail)) {
    return null;
  }

  const relatedRemark = openRemarkForSlot(detail, slot.id);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    upload.mutate({
      humanId: detail.humanId,
      slotId: slot.id,
      data: { file, remarkId: relatedRemark?.id },
    });
  }

  return (
    <>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={upload.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        Загрузить версию
      </Button>
    </>
  );
}

function LeaveRemarkCell({ detail, slot }: { detail: CorrectionDetail; slot: DocumentSlot2 }) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });

  const leaveRemark = useLeaveRemark({ mutation: { onSuccess: () => void invalidate() } });

  if (!canLeaveRemarkAsCfo(detail) && !canLeaveRemarkAsDtoe(detail)) {
    return null;
  }

  function handleSubmit(data: RemarkCreateInput) {
    leaveRemark.mutate({ humanId: detail.humanId, data });
  }

  return (
    <ReturnRemarkDialog
      triggerLabel="Оставить замечание к элементу"
      isSubmitting={leaveRemark.isPending}
      onSubmit={handleSubmit}
      slotId={slot.id}
      slotLabel={slot.label}
    />
  );
}

export function PackageCompleteness({ detail }: { detail: CorrectionDetail }) {
  // Локальная отметка «проверено» для этого экрана — не сохраняется на сервере,
  // только скрывает кнопку замечания для элементов, которые уже посмотрели.
  const [reviewedSlotIds, setReviewedSlotIds] = useState<Set<number>>(new Set());

  function toggleReviewed(slotId: number) {
    setReviewedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  }

  const isReviewer = detail.isCfoReviewer || detail.isDtoe;

  const columns: ColumnDef<DocumentSlot2, unknown>[] = [
    ...(isReviewer
      ? [
          {
            id: "reviewed",
            header: "Проверено",
            cell: ({ row }: { row: { original: DocumentSlot2 } }) => (
              <ReviewedCheckbox
                checked={reviewedSlotIds.has(row.original.id)}
                onToggle={() => toggleReviewed(row.original.id)}
                label={`Отметить «${row.original.label}» проверенным`}
              />
            ),
          } satisfies ColumnDef<DocumentSlot2, unknown>,
        ]
      : []),
    {
      accessorKey: "label",
      header: "Элемент",
      cell: ({ row }) => <SlotLabelCell slot={row.original} canDownload={isReviewer} />,
    },
    {
      id: "isRequired",
      header: "Обязателен",
      cell: ({ row }) =>
        !row.original.isRequired ? "Нет" : row.original.choiceGroupKey ? "Да (один из группы)" : "Да",
    },
    {
      id: "responsibleCfo",
      header: "Проверяет ЦФО",
      cell: ({ row }) => (row.original.responsibleCfo ? row.original.responsibleCfo.name : "Все ЦФО маршрута"),
    },
    {
      id: "currentVersion",
      header: "Текущая версия",
      cell: ({ row }) => <CurrentVersionCell slot={row.original} canDownload={isReviewer} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <UploadSlotFileCell detail={detail} slot={row.original} />
          {!reviewedSlotIds.has(row.original.id) && <LeaveRemarkCell detail={detail} slot={row.original} />}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Комплектность пакета</h2>
      <DataTable columns={columns} data={detail.slots} getRowId={(slot) => String(slot.id)} />
      <p className="text-xs text-muted-foreground">
        Замечание оставляется кнопкой в строке нужного элемента.
        {isReviewer && " Отметьте «Проверено», чтобы скрыть кнопку для уже просмотренных элементов, — это только на экране и не сохраняется."}
      </p>
    </div>
  );
}
