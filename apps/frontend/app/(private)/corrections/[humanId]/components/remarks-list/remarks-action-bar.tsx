"use client";

import type { CorrectionDetail } from "@/packages/api/base/codegen";
import {
  useApproveCorrectionByCfo,
  useApproveCorrectionByDtoe,
  useCancelCfoDecision,
  useReturnCorrectionByCfo,
  useReturnCorrectionByDtoe,
  useSendCorrectionToDtoe,
} from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import {
  canApproveAsCfo,
  canApproveAsDtoe,
  canCancelCfoDecision,
  canFinalizeReturnAsCfo,
  canFinalizeReturnAsDtoe,
  canSendToDtoe,
} from "../../lib/permissions";
import { useInvalidateCorrection } from "../../lib/use-invalidate-correction";

/** Решения ЦФО и ДТОиР по корректировке — шапка блока замечаний. */
export function RemarksActionBar({ detail }: { detail: CorrectionDetail }) {
  const invalidate = useInvalidateCorrection(detail.humanId);

  const approveAsCfo = useApproveCorrectionByCfo({ mutation: { onSuccess: invalidate } });
  const returnAsCfo = useReturnCorrectionByCfo({ mutation: { onSuccess: invalidate } });
  const cancelCfoDecision = useCancelCfoDecision({ mutation: { onSuccess: invalidate } });
  const sendToDtoe = useSendCorrectionToDtoe({ mutation: { onSuccess: invalidate } });
  const approveAsDtoe = useApproveCorrectionByDtoe({ mutation: { onSuccess: invalidate } });
  const returnAsDtoe = useReturnCorrectionByDtoe({ mutation: { onSuccess: invalidate } });

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
      {canFinalizeReturnAsCfo(detail) && (
        <Button
          type="button"
          variant="destructive"
          disabled={returnAsCfo.isPending}
          onClick={() => returnAsCfo.mutate({ humanId: detail.humanId })}
        >
          Вернуть на доработку
        </Button>
      )}
      {canCancelCfoDecision(detail) && (
        <Button
          type="button"
          variant="outline"
          disabled={cancelCfoDecision.isPending}
          onClick={() => cancelCfoDecision.mutate({ humanId: detail.humanId })}
        >
          Отменить решение
        </Button>
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
      {canFinalizeReturnAsDtoe(detail) && (
        <Button
          type="button"
          variant="destructive"
          disabled={returnAsDtoe.isPending}
          onClick={() => returnAsDtoe.mutate({ humanId: detail.humanId })}
        >
          Вернуть на доработку (ДТОиР)
        </Button>
      )}
    </div>
  );
}
