"use client";

import {useQueryClient} from "@tanstack/react-query";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {useRouter} from "next/navigation";
import {useCallback, useMemo, useState} from "react";

import {cn} from "@/lib/utils";
import {
    getNotificationsQueryKey,
    type Notification,
    useGetNotifications,
    useMarkAllNotificationsRead,
    useOpenNotification,
} from "@/packages/api/base/codegen";

import {Button} from "#/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "#/components/ui/select";
import {formatNotificationDateTime} from "#/utils/format-notification-date-time";

const columnHelper = createColumnHelper<Notification>();

const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

type ReadFilter = (typeof READ_FILTERS)[number];

interface NotificationsTableMeta {
    onOpen: (notification: Notification) => void;
}

const columns = [
    columnHelper.accessor("createdAt", {
        header: "Дата",
        cell: (info) => formatNotificationDateTime(info.getValue()),
    }),
    columnHelper.accessor("text", {
        header: "Сообщение",
        enableSorting: false,
    }),
    columnHelper.display({
        id: "actions",
        cell: (info) => (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-12"
                onClick={() => (info.table.options.meta as NotificationsTableMeta).onOpen(info.row.original)}
            >
                Открыть
            </Button>
        ),
    }),
];

export function NotificationsTable() {
    const [readFilter, setReadFilter] = useState<ReadFilter>("all");
    const [sorting, setSorting] = useState<SortingState>([{id: "createdAt", desc: true}]);
    const router = useRouter();
    const queryClient = useQueryClient();

    const notificationsQuery = useGetNotifications();
    const openNotification = useOpenNotification();
    const markAllRead = useMarkAllNotificationsRead();

    const visibleNotifications = useMemo(
        () =>
            (notificationsQuery.data ?? []).filter((n) => {
                if (readFilter === "unread") return !n.isRead;
                if (readFilter === "read") return n.isRead;
                return true;
            }),
        [notificationsQuery.data, readFilter],
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

    function handleMarkAllRead() {
        markAllRead.mutate(undefined, {onSuccess: invalidateNotifications});
    }

    const table = useReactTable({
        data: visibleNotifications,
        columns,
        state: {sorting},
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: {onOpen: handleOpen} satisfies NotificationsTableMeta,
    });

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:items-center">
                <h1 className="text-2xl w-full font-semibold">Уведомления</h1>
                <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                    <Select value={readFilter} onValueChange={(value) => setReadFilter(value as ReadFilter)}>
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

            {visibleNotifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Уведомлений нет</p>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-border text-xs text-muted-foreground">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className={cn(
                                        "py-3 font-medium",
                                        header.column.id === "createdAt" && "w-48",
                                        header.column.id === "actions" && "w-24",
                                        header.column.getCanSort() && "cursor-pointer select-none",
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    {header.column.getIsSorted() === "asc" && " ▲"}
                                    {header.column.getIsSorted() === "desc" && " ▼"}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            className={cn("border-b border-border", !row.original.isRead && "font-bold")}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className={cn(
                                        "py-3 align-middle",
                                        cell.column.id === "createdAt" && "text-muted-foreground",
                                        cell.column.id === "actions" && "text-right",
                                    )}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
