"use client";

import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type OnChangeFn,
    type SortingState,
} from "@tanstack/react-table";
import {memo} from "react";

import {cn} from "@/lib/utils";
import type {Notification} from "@/packages/api/base/codegen";

import type {NotificationsTableMeta} from "./notifications-columns";

interface NotificationsTableProps {
    data: Notification[];
    columns: ColumnDef<Notification, unknown>[];
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
    onOpen: (notification: Notification) => void;
}

function NotificationsTableComponent({data, columns, sorting, onSortingChange, onOpen}: NotificationsTableProps) {
    const table = useReactTable({
        data,
        columns,
        state: {sorting},
        onSortingChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: {onOpen} satisfies NotificationsTableMeta,
    });

    if (data.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">Уведомлений нет</p>;
    }

    return (
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
    );
}

export const NotificationsTable = memo(NotificationsTableComponent);
