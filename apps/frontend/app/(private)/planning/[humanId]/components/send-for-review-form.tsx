"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { PlanDetail } from "@/packages/api/base/codegen";
import { getPlanSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/plansController/useGetPlanSuspense";
import { useSendPlan } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canSendForReview } from "../lib/permissions";

export function SendForReviewForm({ detail }: { detail: PlanDetail }) {
  const queryClient = useQueryClient();
  const [selectedCfoIds, setSelectedCfoIds] = useState<number[]>([]);
  const sendPlan = useSendPlan({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getPlanSuspenseQueryKey({ humanId: detail.humanId }) });
      },
    },
  });

  if (!detail.isFilialOwner || detail.status !== "DRAFT") {
    return null;
  }

  function toggleCfo(cfoId: number) {
    setSelectedCfoIds((current) =>
      current.includes(cfoId) ? current.filter((id) => id !== cfoId) : [...current, cfoId],
    );
  }

  const sendAllowed = canSendForReview(detail) && selectedCfoIds.length > 0;
  let hint: string | undefined;
  if (detail.missingRequirements.length > 0) {
    hint = "Заполните все обязательные слоты";
  } else if (selectedCfoIds.length === 0) {
    hint = "Выберите хотя бы один ЦФО";
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Направить на проверку</h2>
      <div className="flex flex-col gap-1.5">
        {detail.availableCfos.map((cfo) => (
          <label key={cfo.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectedCfoIds.includes(cfo.id)} onChange={() => toggleCfo(cfo.id)} />
            {cfo.name}
          </label>
        ))}
      </div>
      <Button
        type="button"
        title={hint}
        disabled={!sendAllowed || sendPlan.isPending}
        onClick={() => sendPlan.mutate({ humanId: detail.humanId, data: { cfoIds: selectedCfoIds } })}
      >
        Направить
      </Button>
    </div>
  );
}
