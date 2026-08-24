"use client";

import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";
import { useDeleteRemark, useMarkRemarkFixed } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canDeleteRemark, canMarkRemarkFixed } from "../../lib/permissions";
import { useInvalidateCorrection } from "../../lib/use-invalidate-correction";

interface RemarkActionsCellProps {
  detail: CorrectionDetail;
  remark: Remark;
  currentUserId: number;
}

/** Действия филиала и автора над одним замечанием — рендерится в ячейке таблицы. */
export function RemarkActionsCell({ detail, remark, currentUserId }: RemarkActionsCellProps) {
  const invalidate = useInvalidateCorrection(detail.humanId);

  const markFixed = useMarkRemarkFixed({ mutation: { onSuccess: invalidate } });
  const deleteRemark = useDeleteRemark({ mutation: { onSuccess: invalidate } });

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
