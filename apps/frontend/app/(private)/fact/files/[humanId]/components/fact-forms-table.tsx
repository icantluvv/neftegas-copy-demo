"use client";

import { useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { FactForm2, FactPackageDetail } from "@/packages/api/base/codegen";
import { useUploadFactFormVersion } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";

import { canUploadFormVersion } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";
import { CurrentVersionCell } from "./current-version-cell";
import { LeaveRemarkCell } from "./leave-remark-cell";

function openRemarkForForm(detail: FactPackageDetail, formId: number) {
  return detail.remarks.find((remark) => remark.relatedFormId === formId && remark.status !== "CLOSED");
}

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
