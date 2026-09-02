"use client";

import type { FactPackageDetail } from "@/packages/api/base/codegen";
import { useApproveFactPackageByCfo, useDecideFactPackageByDtoe, useSendFactPackageToDtoe } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canApproveAsCfo, canFinalDecideAsDtoe, canSendToDtoe } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";

/**
 * Решения ЦФО и ДТОиР по факт-пакету — согласование, отправка в ДТОиР,
 * финальное решение. Замечания оставляются из таблицы форм (fact-forms-table.tsx),
 * рядом с конкретной формой, а не здесь.
 */
export function FactActionsBar({ detail }: { detail: FactPackageDetail }) {
  const invalidate = useInvalidateFactPackage(detail.humanId);

  const approveAsCfo = useApproveFactPackageByCfo({ mutation: { onSuccess: invalidate } });
  const sendToDtoe = useSendFactPackageToDtoe({ mutation: { onSuccess: invalidate } });
  const decideAsDtoe = useDecideFactPackageByDtoe({ mutation: { onSuccess: invalidate } });

  const showApproveAsCfo = canApproveAsCfo(detail);
  const showSendToDtoe = canSendToDtoe(detail);
  const showDtoeDecision = canFinalDecideAsDtoe(detail);

  if (!showApproveAsCfo && !showSendToDtoe && !showDtoeDecision) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border p-4">
      {showApproveAsCfo && (
        <Button
          type="button"
          disabled={approveAsCfo.isPending}
          onClick={() => approveAsCfo.mutate({ humanId: detail.humanId, cfoId: detail.myCfoStatus!.cfoId })}
        >
          Согласовать
        </Button>
      )}
      {showSendToDtoe && (
        <Button
          type="button"
          disabled={sendToDtoe.isPending}
          onClick={() => sendToDtoe.mutate({ humanId: detail.humanId })}
        >
          Направить в ДТОиР
        </Button>
      )}
      {showDtoeDecision && (
        <>
          <Button
            type="button"
            disabled={decideAsDtoe.isPending}
            onClick={() => decideAsDtoe.mutate({ humanId: detail.humanId, data: { decision: "APPROVE" } })}
          >
            Согласовать (ДТОиР)
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={decideAsDtoe.isPending}
            onClick={() => decideAsDtoe.mutate({ humanId: detail.humanId, data: { decision: "RETURN" } })}
          >
            Вернуть на доработку (ДТОиР)
          </Button>
        </>
      )}
    </div>
  );
}
