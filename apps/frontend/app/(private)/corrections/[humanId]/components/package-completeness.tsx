"use client";

import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { CorrectionDetail, DocumentSlot2 } from "@/packages/api/base/codegen";
import { getCorrectionSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";
import { useUploadFileVersion } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { canUploadSlotFile } from "../lib/permissions";

function openRemarkForSlot(detail: CorrectionDetail, slotId: number) {
  return detail.remarks.find((remark) => remark.relatedSlotId === slotId && remark.status !== "CLOSED");
}

function SlotRow({ detail, slot }: { detail: CorrectionDetail; slot: DocumentSlot2 }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFileVersion({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });
      },
    },
  });

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
    <TableRow>
      <TableCell>{slot.label}</TableCell>
      <TableCell>{slot.isRequired ? "Да" : "Нет"}</TableCell>
      <TableCell>{slot.responsibleCfo ? slot.responsibleCfo.name : "Все ЦФО маршрута"}</TableCell>
      <TableCell>
        {slot.currentVersion ? (
          <div className="flex flex-col">
            <span>Версия {slot.currentVersion.versionNumber}</span>
            <span className="text-xs text-muted-foreground">
              {formatNotificationDateTime(slot.currentVersion.uploadedAt)}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Нет версий</span>
        )}
      </TableCell>
      <TableCell>
        {canUploadSlotFile(detail) && (
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
        )}
      </TableCell>
    </TableRow>
  );
}

export function PackageCompleteness({ detail }: { detail: CorrectionDetail }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Комплектность пакета</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Элемент</TableHead>
            <TableHead>Обязателен</TableHead>
            <TableHead>Проверяет ЦФО</TableHead>
            <TableHead>Текущая версия</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.slots.map((slot) => (
            <SlotRow key={slot.id} detail={detail} slot={slot} />
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">Замечание оставляется кнопкой в строке нужного элемента.</p>
    </div>
  );
}
