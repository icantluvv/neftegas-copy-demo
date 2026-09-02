import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

import { getMe } from "@repo/api/base/codegen/clients/authController/getMe";
import { getFactPackageSuspenseQueryOptions } from "@repo/api/base/codegen/hooks/factPackagesController/useGetFactPackageSuspense";

import { AccessDeniedScreen } from "../../../components/access-denied-screen";
import { FactPackageDetailSkeleton } from "./components/fact-package-detail-skeleton";
import { FactPackageDetailView } from "./components/fact-package-detail-view";
import { NotFoundScreen } from "./not-found-screen";
import { getQueryClient } from "#/utils/get-query-client";
import { isHttpError } from "#/utils/http-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ humanId: string }>;
};

export default async function FactPackagePage({ params }: PageProps) {
  const { humanId } = await params;
  const queryClient = getQueryClient();

  let currentUserId: number;
  try {
    const me = await getMe();
    currentUserId = me.id;
    await queryClient.fetchQuery(getFactPackageSuspenseQueryOptions({ humanId }));
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
      <Suspense fallback={<FactPackageDetailSkeleton />}>
        <FactPackageDetailView humanId={humanId} currentUserId={currentUserId} />
      </Suspense>
    </HydrationBoundary>
  );
}
