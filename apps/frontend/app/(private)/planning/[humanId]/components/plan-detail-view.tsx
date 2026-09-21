"use client";

import { useGetPlanSuspense } from "@/packages/api/base/codegen";

import { CfoStatuses } from "./cfo-statuses";
import { PlanHeader } from "./plan-header";
import { HistoryLog } from "./history-log";
import { PackageCompleteness } from "./package-completeness";
import { RemarksList } from "./remarks-list";
import { ResubmitPanel } from "./resubmit-panel";
import { SendForReviewForm } from "./send-for-review-form";

export function PlanDetailView({ humanId, currentUserId }: { humanId: string; currentUserId: number }) {
  const { data: detail } = useGetPlanSuspense({ humanId });

  return (
    <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
      <PlanHeader detail={detail} />
      <PackageCompleteness detail={detail} />
      <SendForReviewForm detail={detail} />
      <CfoStatuses detail={detail} />
      <RemarksList detail={detail} currentUserId={currentUserId} />
      <ResubmitPanel detail={detail} />
      <HistoryLog detail={detail} />
    </div>
  );
}
