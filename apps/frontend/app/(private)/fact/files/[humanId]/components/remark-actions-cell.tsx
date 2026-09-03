"use client";

import type { FactPackageDetail, FactPackageRemark } from "@/packages/api/base/codegen";
import { useDeleteFactPackageRemark, useFixFactPackageRemark } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

import { canDeleteRemark, canMarkRemarkFixed } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";

export function RemarkActionsCell({
  detail,
  remark,
  currentUserId,
}: {
  detail: FactPackageDetail;
  remark: FactPackageRemark;
  currentUserId: number;
}) {
  const invalidate = useInvalidateFactPackage(detail.humanId);
  const markFixed = useFixFactPackageRemark({ mutation: { onSuccess: invalidate } });
  const deleteRemark = useDeleteFactPackageRemark({ mutation: { onSuccess: invalidate } });

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
