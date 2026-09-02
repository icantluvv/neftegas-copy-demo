"use client";

import { useGetFactPackageSuspense } from "@/packages/api/base/codegen";

import { FactActionsBar } from "./fact-actions-bar";
import { FactCfoStatuses } from "./fact-cfo-statuses";
import { FactFormsTable } from "./fact-forms-table";
import { FactHistoryLog } from "./fact-history-log";
import { FactPackageHeader } from "./fact-package-header";
import { FactRemarksList } from "./fact-remarks-list";
import { FactSubmitPanel } from "./fact-submit-panel";

export function FactPackageDetailView({ humanId, currentUserId }: { humanId: string; currentUserId: number }) {
  const { data: detail } = useGetFactPackageSuspense({ humanId });

  return (
    <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
      <FactPackageHeader detail={detail} />
      <FactFormsTable detail={detail} />
      <FactSubmitPanel detail={detail} />
      <FactActionsBar detail={detail} />
      <FactCfoStatuses detail={detail} />
      <FactRemarksList detail={detail} currentUserId={currentUserId} />
      <FactHistoryLog detail={detail} />
    </div>
  );
}
