"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import {
  getNotificationsQueryKey,
  useGetCorrectionSuspense,
  useMarkNotificationsReadByCorrection,
} from "@/packages/api/base/codegen";

import { CfoStatuses } from "./cfo-statuses";
import { CorrectionHeader } from "./correction-header";
import { HistoryLog } from "./history-log";
import { PackageCompleteness } from "./package-completeness";
import { RemarksList } from "./remarks-list";
import { ResubmitPanel } from "./resubmit-panel";
import { SendForReviewForm } from "./send-for-review-form";

export function CorrectionDetailView({ humanId, currentUserId }: { humanId: string; currentUserId: number }) {
  const { data: detail } = useGetCorrectionSuspense({ humanId });
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationsReadByCorrection();
  const markedCorrectionId = useRef<number | null>(null);

  useEffect(() => {
    if (markedCorrectionId.current === detail.id) return;
    markedCorrectionId.current = detail.id;
    markRead.mutate(
      { correctionId: detail.id },
      { onSuccess: () => void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey() }) },
    );
    // Открытие карточки помечает прочитанными связанные уведомления один раз
    // при смене корректировки (docs/tz/filial-cabinet.md, раздел 6.6) —
    // остальные зависимости мутации намеренно не отслеживаются.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id]);

  return (
    <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
      <CorrectionHeader detail={detail} />
      <PackageCompleteness detail={detail} />
      <SendForReviewForm detail={detail} />
      <CfoStatuses detail={detail} />
      <RemarksList detail={detail} currentUserId={currentUserId} />
      <ResubmitPanel detail={detail} />
      <HistoryLog detail={detail} />
    </div>
  );
}
