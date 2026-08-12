"use client";

import {useQueryClient} from "@tanstack/react-query";
import {type SortingState} from "@tanstack/react-table";
import {useRouter} from "next/navigation";
import {useCallback, useMemo, useState} from "react";

import {
    getNotificationsQueryKey,
    type Notification,
    useGetNotifications,
    useMarkAllNotificationsRead,
    useOpenNotification,
} from "@/packages/api/base/codegen";

import {Button} from "#/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "#/components/ui/select";

import {notificationsColumns} from "./notifications-columns";
import {NotificationsTable} from "./notifications-table";
import {READ_FILTER_LABELS, READ_FILTERS, ReadFilter} from "@/app/(private)/constants";

export function NotificationsContent() {
    const [readFilter, setReadFilter] = useState<ReadFilter>("all");
    const [sorting, setSorting] = useState<SortingState>([{id: "createdAt", desc: true}]);
    const router = useRouter();
    const queryClient = useQueryClient();

    const notificationsQuery = useGetNotifications();
    const openNotification = useOpenNotification();
    const markAllRead = useMarkAllNotificationsRead();

    const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);

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

    const handleOpen = useCallback(
        (notification: Notification) => {
            openNotification.mutate({id: notification.id}, {onSuccess: invalidateNotifications});
            router.push(`/corrections/${notification.correctionHumanId ?? ""}`);
        },
        [openNotification, invalidateNotifications, router],
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
                        disabled={markAllRead.isPending}
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
