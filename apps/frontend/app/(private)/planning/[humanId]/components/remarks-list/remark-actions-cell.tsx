"use client";

import type { PlanDetail, PlanRemark } from "@/packages/api/base/codegen";
import { useDeletePlanRemark, useMarkPlanRemarkFixed } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canDeleteRemark, canMarkRemarkFixed } from "../../lib/permissions";
import { useInvalidatePlan } from "../../lib/use-invalidate-plan";

interface RemarkActionsCellProps {
  detail: PlanDetail;
  remark: PlanRemark;
  currentUserId: number;
}

/** Действия филиала и автора над одним замечанием — рендерится в ячейке таблицы. */
export function RemarkActionsCell({ detail, remark, currentUserId }: RemarkActionsCellProps) {
  const invalidate = useInvalidatePlan(detail.humanId);

  const markFixed = useMarkPlanRemarkFixed({ mutation: { onSuccess: invalidate } });
  const deleteRemark = useDeletePlanRemark({ mutation: { onSuccess: invalidate } });

  return (
    <div className="flex gap-2">
      {canMarkRemarkFixed(detail, remark) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={markFixed.isPending}
          onClick={() => markFixed.mutate({ humanId: detail.humanId, remarkId: remark.id })}
        >
          Отметить исправленным
        </Button>
      )}
      {canDeleteRemark(remark, currentUserId) && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={deleteRemark.isPending}
          onClick={() => deleteRemark.mutate({ humanId: detail.humanId, remarkId: remark.id })}
        >
          Удалить
        </Button>
      )}
    </div>
  );
}
