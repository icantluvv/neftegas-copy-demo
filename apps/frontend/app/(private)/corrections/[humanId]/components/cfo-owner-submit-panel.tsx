"use client";

import { useQueryClient } from "@tanstack/react-query";

import type { CorrectionDetail } from "@/packages/api/base/codegen";
import { getCorrectionSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";
import { useSendCorrectionToDtoe } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canSendToDtoeAsOwner } from "../lib/permissions";

/**
 * Что это: панель отправки для корректировки, созданной самим ЦФО (isCfoOwner).
 * Кто видит: только автор-владелец (ЦФО, cfoId которого совпадает с cfoId пакета).
 * Когда активна кнопка: статус DRAFT/RETURNED_BY_DTOE и пакет полностью укомплектован.
 * Что происходит: POST /corrections/{humanId}/send-to-dtoe — минуя цикл согласования
 * другими ЦФО, сразу в ДТОиР (Change: cfo-initiated-corrections).
 */
export function CfoOwnerSubmitPanel({ detail }: { detail: CorrectionDetail }) {
  const queryClient = useQueryClient();
  const sendToDtoe = useSendCorrectionToDtoe({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId: detail.humanId }) });
      },
    },
  });

  if (!detail.isCfoOwner || (detail.status !== "DRAFT" && detail.status !== "RETURNED_BY_DTOE")) {
    return null;
  }

  const allowed = canSendToDtoeAsOwner(detail);
  const hint = detail.missingRequirements.length > 0 ? "Заполните все обязательные слоты" : undefined;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Пакет готов к направлению</h2>
      <p className="text-sm text-muted-foreground">
        Собственный пакет ЦФО направляется сразу в ДТОиР, без предварительного согласования другими ЦФО.
      </p>
      <Button
        type="button"
        title={hint}
        disabled={!allowed || sendToDtoe.isPending}
        onClick={() => sendToDtoe.mutate({ humanId: detail.humanId })}
      >
        Направить в ДТОиР
      </Button>
    </div>
  );
}
