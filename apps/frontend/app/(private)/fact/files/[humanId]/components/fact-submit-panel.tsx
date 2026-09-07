"use client";

import { useState } from "react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";
import { useSubmitFactPackage } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canSubmit } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";

export function FactSubmitPanel({ detail }: { detail: FactPackageDetail }) {
  const invalidate = useInvalidateFactPackage(detail.humanId);
  const [selectedCfoIds, setSelectedCfoIds] = useState<number[]>([]);
  const submit = useSubmitFactPackage({ mutation: { onSuccess: invalidate } });

  if (!canSubmit(detail)) {
    return null;
  }

  if (detail.isCfoOwner) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">Направить в ДТОиР</h2>
        <Button
          type="button"
          disabled={submit.isPending}
          onClick={() => submit.mutate({ humanId: detail.humanId, data: {} })}
        >
          Направить
        </Button>
      </div>
    );
  }

  if (!detail.isFilialOwner) {
    return null;
  }

  function toggleCfo(cfoId: number) {
    setSelectedCfoIds((current) =>
      current.includes(cfoId) ? current.filter((id) => id !== cfoId) : [...current, cfoId],
    );
  }

  const submitAllowed = selectedCfoIds.length > 0;
  const hint = selectedCfoIds.length === 0 ? "Выберите хотя бы один ЦФО" : undefined;

  const isResubmit = detail.status === "RETURNED_FOR_REVISION";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">{isResubmit ? "Направить повторно" : "Направить на проверку"}</h2>
      <div className="flex flex-col gap-1.5">
        {(isResubmit ? detail.returnedCfos : detail.availableCfos).map((cfo) => (
          <label key={cfo.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectedCfoIds.includes(cfo.id)} onChange={() => toggleCfo(cfo.id)} />
            {cfo.name}
          </label>
        ))}
      </div>
      <Button
        type="button"
        title={hint}
        disabled={!submitAllowed || submit.isPending}
        onClick={() => submit.mutate({ humanId: detail.humanId, data: { cfoIds: selectedCfoIds } })}
      >
        {isResubmit ? "Направить повторно" : "Направить"}
      </Button>
    </div>
  );
}
