import {dehydrate, HydrationBoundary} from "@tanstack/react-query";
import {Suspense} from "react";

import {getNotificationsSuspenseQueryOptions} from "@repo/api/base/codegen/hooks/notificationsController/useGetNotificationsSuspense";

import {NotificationsContent} from "./components/notifications-content";
import {NotificationsSkeleton} from "./components/notifications-skeleton";
import {getQueryClient} from "#/utils/get-query-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
    const queryClient = getQueryClient();
    await queryClient.fetchQuery(getNotificationsSuspenseQueryOptions());

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<NotificationsSkeleton/>}>
                <NotificationsContent/>
            </Suspense>
        </HydrationBoundary>
    );
}
