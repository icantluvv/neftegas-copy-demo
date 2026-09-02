"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { useGetFactPackages } from "@/packages/api/base/codegen";
import type { FactPackageListItem } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";

import { getDirectionLabel, getFactPackageStatusLabel } from "../../../lib/status-labels";

/**
 * Что это: список факт-пакетов, доступных на проверку.
 * Кто видит: ЦФО — только пакеты, направленные его ЦФО; ДТОиР — все пакеты всех филиалов (аудит).
 * Когда активен: всегда — состав списка ограничивает бэкенд по роли, а не эта страница.
 * Что происходит: строка ведёт на карточку факт-пакета `/fact/files/{humanId}`.
 */
export function FactPackagesReviewList() {
    const query = useGetFactPackages();
    const items = query.data?.items ?? [];

    const columns: ColumnDef<FactPackageListItem, unknown>[] = [
        {
            id: "humanId",
            header: "ID",
            cell: ({row}) => (
                <Link href={`/fact/files/${row.original.humanId}`} className="text-primary hover:underline">
                    {row.original.humanId}
                </Link>
            ),
        },
        {id: "filial", header: "Филиал", cell: ({row}) => row.original.filial.name},
        {id: "direction", header: "Направление", cell: ({row}) => getDirectionLabel(row.original.direction)},
        {
            id: "status",
            header: "Статус",
            cell: ({row}) => {
                const statusLabel = getFactPackageStatusLabel(row.original.status);
                return <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>;
            },
        },
    ];

    return (
        <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Файлы</h1>
            <DataTable
                columns={columns}
                data={items}
                getRowId={(item) => String(item.id)}
                emptyMessage="Нет факт-пакетов"
            />
        </div>
    );
}
