import type {ColumnDef} from "@tanstack/react-table";

import type {Notification} from "@/packages/api/base/codegen";

import {Button} from "#/components/ui/button";
import {formatNotificationDateTime} from "#/utils/format-notification-date-time";

export interface NotificationsTableMeta {
    onOpen: (notification: Notification) => void;
}

export const notificationsColumns: ColumnDef<Notification, unknown>[] = [
    {
        accessorKey: "createdAt",
        header: "Дата",
        cell: ({row}) => formatNotificationDateTime(row.original.createdAt),
    },
    {
        accessorKey: "text",
        header: "Сообщение",
        enableSorting: false,
    },
    {
        id: "actions",
        cell: ({row, table}) => (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-12"
                onClick={() => (table.options.meta as NotificationsTableMeta).onOpen(row.original)}
            >
                Открыть
            </Button>
        ),
    },
];
