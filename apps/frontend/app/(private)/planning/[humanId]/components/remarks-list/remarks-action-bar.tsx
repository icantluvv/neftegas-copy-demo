"use client";

import type { PlanDetail } from "@/packages/api/base/codegen";
import {
  useApprovePlanByCfo,
  useApprovePlanByDtoe,
  useCancelPlanCfoDecision,
  useReturnPlanByCfo,
  useReturnPlanByDtoe,
  useSendPlanToDtoe,
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
import { useInvalidatePlan } from "../../lib/use-invalidate-plan";

export function RemarksActionBar({ detail }: { detail: PlanDetail }) {
  const invalidate = useInvalidatePlan(detail.humanId);

  const approveAsCfo = useApprovePlanByCfo({ mutation: { onSuccess: invalidate } });
  const returnAsCfo = useReturnPlanByCfo({ mutation: { onSuccess: invalidate } });
  const cancelCfoDecision = useCancelPlanCfoDecision({ mutation: { onSuccess: invalidate } });
  const sendToDtoe = useSendPlanToDtoe({ mutation: { onSuccess: invalidate } });
  const approveAsDtoe = useApprovePlanByDtoe({ mutation: { onSuccess: invalidate } });
  const returnAsDtoe = useReturnPlanByDtoe({ mutation: { onSuccess: invalidate } });

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
