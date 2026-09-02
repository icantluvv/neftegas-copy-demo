"use client";

import { useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { FactForm2, FactPackageDetail, FactPackageRemarkCreateInput } from "@/packages/api/base/codegen";
import { useLeaveFactPackageRemark, useUploadFactFormVersion } from "@/packages/api/base/codegen";
import { clientEnvironment } from "#/env/client";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { canLeaveRemarkAsCfo, canLeaveRemarkAsDtoe, canUploadFormVersion } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";
import { FactRemarkDialog } from "./fact-remark-dialog";

function openRemarkForForm(detail: FactPackageDetail, formId: number) {
  return detail.remarks.find((remark) => remark.relatedFormId === formId && remark.status !== "CLOSED");
}

function CurrentVersionCell({ form, canDownload }: { form: FactForm2; canDownload: boolean }) {
  if (!form.currentVersion) {
    return <span className="text-muted-foreground">Нет версий</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span>Версия {form.currentVersion.versionNumber}</span>
      <span className="text-xs text-muted-foreground">{formatNotificationDateTime(form.currentVersion.uploadedAt)}</span>
      {canDownload && (
        <a
          href={`${clientEnvironment.NEXT_PUBLIC_BACK_URL}/fact-files/${form.currentVersion.id}/download`}
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

/**
 * Что это: кнопка «Загрузить версию» формы факт-пакета.
 * Кто видит: Филиал — только владелец пакета (см. AGENTS.md, п. «Загрузить версию файла в слот»).
 * Когда активен: пока факт-пакет не в финальном статусе «Согласовано».
 * Что происходит: открывает системный диалог выбора файла; после выбора — сразу загружает новую версию формы (номер версии = максимальный существующий + 1), обновляет карточку.
 */
function UploadFormVersionCell({ detail, form }: { detail: FactPackageDetail; form: FactForm2 }) {
  const invalidate = useInvalidateFactPackage(detail.humanId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFactFormVersion({ mutation: { onSuccess: invalidate } });

  if (!canUploadFormVersion(detail)) {
    return null;
  }

  const relatedRemark = openRemarkForForm(detail, form.id);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    upload.mutate({
      humanId: detail.humanId,
      formCode: form.code,
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

function LeaveRemarkCell({ detail, form }: { detail: FactPackageDetail; form: FactForm2 }) {
  const invalidate = useInvalidateFactPackage(detail.humanId);
  const leaveRemark = useLeaveFactPackageRemark({ mutation: { onSuccess: invalidate } });

  const asCfo = canLeaveRemarkAsCfo(detail);
  const asDtoe = canLeaveRemarkAsDtoe(detail);
  if (!asCfo && !asDtoe) {
    return null;
  }

  function handleSubmit(data: FactPackageRemarkCreateInput) {
    leaveRemark.mutate({ humanId: detail.humanId, data });
  }

  return (
    <FactRemarkDialog
      triggerLabel="Оставить замечание"
      dialogTitle={`Замечание к форме: ${form.label}`}
      submitLabel={asCfo ? "Сохранить и вернуть на доработку" : "Сохранить замечание"}
      isSubmitting={leaveRemark.isPending}
      onSubmit={handleSubmit}
      formId={form.id}
    />
  );
}

/** Таблица форм каталога направления — центральный блок карточки факт-пакета (см. ЧТЗ, раздел 4). */
export function FactFormsTable({ detail }: { detail: FactPackageDetail }) {
  const isReviewer = detail.isCfoReviewer || detail.isDtoe;

  const columns: ColumnDef<FactForm2, unknown>[] = [
    { accessorKey: "label", header: "Форма" },
    {
      id: "isFilled",
      header: "Статус",
      cell: ({ row }) => (row.original.isFilled ? "Загружена" : "Не загружена"),
    },
    {
      id: "currentVersion",
      header: "Текущая версия",
      cell: ({ row }) => <CurrentVersionCell form={row.original} canDownload={isReviewer} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <UploadFormVersionCell detail={detail} form={row.original} />
          <LeaveRemarkCell detail={detail} form={row.original} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Формы направления</h2>
      <DataTable columns={columns} data={detail.forms} getRowId={(form) => String(form.id)} />
      {!detail.packageComplete && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge tone="warning">Не укомплектовано</Badge>
          <span>Не загружены: {detail.missingForms.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
