import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

import { getMe } from "@repo/api/base/codegen/clients/authController/getMe";
import { getPlanSuspenseQueryOptions } from "@repo/api/base/codegen/hooks/plansController/useGetPlanSuspense";

import { AccessDeniedScreen } from "../../components/access-denied-screen";
import { PlanDetailView } from "./components/plan-detail-view";
import { PlanDetailSkeleton } from "./plan-detail-skeleton";
import { NotFoundScreen } from "./not-found-screen";
import { getQueryClient } from "#/utils/get-query-client";
import { isHttpError } from "#/utils/http-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ humanId: string }>;
};

export default async function PlanPage({ params }: PageProps) {
  const { humanId } = await params;
  const queryClient = getQueryClient();

  let currentUserId: number;
  try {
    const me = await getMe();
    currentUserId = me.id;
    await queryClient.fetchQuery(getPlanSuspenseQueryOptions({ humanId }));
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
      <Suspense fallback={<PlanDetailSkeleton />}>
        <PlanDetailView humanId={humanId} currentUserId={currentUserId} />
      </Suspense>
    </HydrationBoundary>
  );
}
