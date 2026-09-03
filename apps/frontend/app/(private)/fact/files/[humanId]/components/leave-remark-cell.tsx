import type { FactForm2, FactPackageDetail, FactPackageRemarkCreateInput } from "@/packages/api/base/codegen";
import { useLeaveFactPackageRemark } from "@/packages/api/base/codegen";

import { canLeaveRemarkAsCfo, canLeaveRemarkAsDtoe } from "../../lib/permissions";
import { useInvalidateFactPackage } from "../../lib/use-invalidate-fact-package";
import { FactRemarkDialog } from "./fact-remark-dialog";

export function LeaveRemarkCell({ detail, form }: { detail: FactPackageDetail; form: FactForm2 }) {
  const invalidate = useInvalidateFactPackage(detail.humanId);
  const leaveRemark = useLeaveFactPackageRemark({ mutation: { onSuccess: invalidate } });

  const asCfo = canLeaveRemarkAsCfo(detail);
  const asDtoe = canLeaveRemarkAsDtoe(detail);
  if (!asCfo && !asDtoe) {
    return null;
  }

  function handleSubmit(data: FactPackageRemarkCreateInput) {
    leaveRemark.mutate({ humanId: detail.humanId, data });
  }

  return (
    <FactRemarkDialog
      triggerLabel="Оставить замечание"
      dialogTitle={`Замечание к форме: ${form.label}`}
      submitLabel={asCfo ? "Сохранить и вернуть на доработку" : "Сохранить замечание"}
      isSubmitting={leaveRemark.isPending}
      onSubmit={handleSubmit}
      formId={form.id}
    />
  );
}
