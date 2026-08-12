import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

import { getMe } from "@repo/api/base/codegen/clients/authController/getMe";
import { getCorrectionSuspenseQueryOptions } from "@repo/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";

import { AccessDeniedScreen } from "../../components/access-denied-screen";
import { CorrectionDetailView } from "./components/correction-detail-view";
import { CorrectionDetailSkeleton } from "./components/correction-detail-skeleton";
import { NotFoundScreen } from "./not-found-screen";
import { getQueryClient } from "#/utils/get-query-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ humanId: string }>;
};

function isHttpError(error: unknown, status: number): boolean {
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { status?: number } | undefined;
  return cause?.status === status;
}

export default async function CorrectionPage({ params }: PageProps) {
  const { humanId } = await params;
  const queryClient = getQueryClient();

  let currentUserId: number;
  try {
    const me = await getMe();
    currentUserId = me.id;
    await queryClient.fetchQuery(getCorrectionSuspenseQueryOptions({ humanId }));
  } catch (error) {
    if (isHttpError(error, 403)) {
      return <AccessDeniedScreen />;
    }
    if (isHttpError(error, 404)) {
      return <NotFoundScreen />;
    }
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CorrectionDetailSkeleton />}>
        <CorrectionDetailView humanId={humanId} currentUserId={currentUserId} />
      </Suspense>
    </HydrationBoundary>
  );
}
