"use client";

import { useGetCorrectionSuspense } from "@/packages/api/base/codegen";

import { CfoOwnerSubmitPanel } from "./cfo-owner-submit-panel";
import { CfoStatuses } from "./cfo-statuses";
import { CorrectionHeader } from "./correction-header";
import { HistoryLog } from "./history-log";
import { PackageCompleteness } from "./package-completeness";
import { RemarksList } from "./remarks-list";
import { ResubmitPanel } from "./resubmit-panel";
import { SendForReviewForm } from "./send-for-review-form";

export function CorrectionDetailView({ humanId, currentUserId }: { humanId: string; currentUserId: number }) {
  const { data: detail } = useGetCorrectionSuspense({ humanId });

  return (
    <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
      <CorrectionHeader detail={detail} />
      <PackageCompleteness detail={detail} />
      <SendForReviewForm detail={detail} />
      <CfoOwnerSubmitPanel detail={detail} />
      <CfoStatuses detail={detail} />
      <RemarksList detail={detail} currentUserId={currentUserId} />
      <ResubmitPanel detail={detail} />
      <HistoryLog detail={detail} />
    </div>
  );
}
