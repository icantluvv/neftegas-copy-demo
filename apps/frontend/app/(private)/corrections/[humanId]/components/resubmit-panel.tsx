"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { CorrectionDetail } from "@/packages/api/base/codegen";
import { getCorrectionSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";
import { useResubmitCorrection, useResubmitCorrectionToDtoe } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canResubmit, canResubmitToDtoe, showResubmitPanel } from "../lib/permissions";

export function ResubmitPanel({ detail }: { detail: CorrectionDetail }) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });

  const [selectedCfoIds, setSelectedCfoIds] = useState<number[]>([]);
  const resubmit = useResubmitCorrection({ mutation: { onSuccess: () => void invalidate() } });
  const resubmitToDtoe = useResubmitCorrectionToDtoe({ mutation: { onSuccess: () => void invalidate() } });

  const showDtoeResubmit = detail.isFilialOwner && detail.status === "RETURNED_BY_DTOE";
  const dtoeResubmitAllowed = canResubmitToDtoe(detail);

  if (!showResubmitPanel(detail) && !showDtoeResubmit) {
    return null;
  }

  function toggleCfo(cfoId: number) {
    setSelectedCfoIds((current) =>
      current.includes(cfoId) ? current.filter((id) => id !== cfoId) : [...current, cfoId],
    );
  }

  const resubmitAllowed = canResubmit(detail, selectedCfoIds);
  let resubmitHint: string | undefined;
  if (selectedCfoIds.length === 0) {
    resubmitHint = "Выберите хотя бы один ЦФО";
  } else if (!resubmitAllowed) {
    resubmitHint = "Отметьте все замечания исправленными";
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Повторное направление</h2>

      {showResubmitPanel(detail) && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Кому направить повторно</p>
          <div className="flex flex-col gap-1.5">
            {detail.returnedCfos.map((cfo) => (
              <label key={cfo.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCfoIds.includes(cfo.id)}
                  onChange={() => toggleCfo(cfo.id)}
                />
                {cfo.name}
              </label>
            ))}
          </div>
          <Button
            type="button"
            title={resubmitHint}
            disabled={!resubmitAllowed || resubmit.isPending}
            onClick={() => resubmit.mutate({ humanId: detail.humanId, data: { cfoIds: selectedCfoIds } })}
          >
            Перенаправить
          </Button>
        </div>
      )}

      {showDtoeResubmit && (
        <Button
          type="button"
          disabled={!dtoeResubmitAllowed || resubmitToDtoe.isPending}
          onClick={() => resubmitToDtoe.mutate({ humanId: detail.humanId })}
        >
          Повторно направить в ДТОиР
        </Button>
      )}
    </div>
  );
}
