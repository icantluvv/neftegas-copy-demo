"use client";

import {useQueryClient} from "@tanstack/react-query";
import {type SortingState} from "@tanstack/react-table";
import {useRouter} from "next/navigation";
import {useCallback, useMemo, useState} from "react";

import {
    getNotificationsQueryKey,
    type Notification,
    useGetNotificationsSuspense,
    useMarkAllNotificationsRead,
} from "@/packages/api/base/codegen";

import {Button} from "#/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "#/components/ui/select";
import {useMarkCorrectionNotificationsRead} from "#/hooks/use-mark-correction-notifications-read";
import {useMarkFactPackageNotificationsRead} from "#/hooks/use-mark-fact-package-notifications-read";

import {notificationsColumns} from "./notifications-columns";
import {NotificationsTable} from "./notifications-table";
import {READ_FILTER_LABELS, READ_FILTERS, ReadFilter} from "@/app/(private)/constants";

export function NotificationsContent() {
    const [readFilter, setReadFilter] = useState<ReadFilter>("all");
    const [sorting, setSorting] = useState<SortingState>([{id: "createdAt", desc: true}]);
    const router = useRouter();
    const queryClient = useQueryClient();

    const notificationsQuery = useGetNotificationsSuspense();
    const markCorrectionRead = useMarkCorrectionNotificationsRead();
    const markFactPackageRead = useMarkFactPackageNotificationsRead();
    const markAllRead = useMarkAllNotificationsRead();

    const notifications = notificationsQuery.data;

    const hasUnread = useMemo(() => notifications.some((n) => !n.isRead), [notifications]);

    const visibleNotifications = useMemo(
        () =>
            notifications.filter((n) => {
                if (readFilter === "unread") return !n.isRead;
                if (readFilter === "read") return n.isRead;
                return true;
            }),
        [notifications, readFilter],
    );

    const invalidateNotifications = useCallback(() => {
        void queryClient.invalidateQueries({queryKey: getNotificationsQueryKey()});
    }, [queryClient]);

    /** Уведомление относится либо к корректировке, либо к факт-пакету — см. notification-bell.tsx. */
    const handleOpen = useCallback(
        (notification: Notification) => {
            if (notification.correctionId != null) {
                markCorrectionRead(notification.correctionId);
                router.push(`/corrections/${notification.correctionHumanId ?? ""}`);
            } else if (notification.factPackageId != null) {
                markFactPackageRead(notification.factPackageId);
            }
        },
        [markCorrectionRead, markFactPackageRead, router],
    );

    const handleMarkAllRead = useCallback(() => {
        markAllRead.mutate(undefined, {onSuccess: invalidateNotifications});
    }, [markAllRead, invalidateNotifications]);

    const handleReadFilterChange = useCallback((value: ReadFilter | null) => {
        if (value) setReadFilter(value);
    }, []);

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:items-center">
                <h1 className="text-2xl w-full font-semibold">Уведомления</h1>
                <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                    <Select value={readFilter} onValueChange={handleReadFilterChange}>
                        <SelectTrigger
                            aria-label="Фильтр по прочитанности"
                            className="h-12 min-h-12 w-full md:w-74"
                        >
                            <SelectValue>{(value: ReadFilter) => READ_FILTER_LABELS[value]}</SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {READ_FILTERS.map((filter) => (
                                <SelectItem key={filter} value={filter}>
                                    {READ_FILTER_LABELS[filter]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-12"
                        onClick={handleMarkAllRead}
                        disabled={markAllRead.isPending || !hasUnread}
                    >
                        Отметить все прочитанными
                    </Button>
                </div>
            </div>

            <NotificationsTable
                data={visibleNotifications}
                columns={notificationsColumns}
                sorting={sorting}
                onSortingChange={setSorting}
                onOpen={handleOpen}
            />
        </div>
    );
}
