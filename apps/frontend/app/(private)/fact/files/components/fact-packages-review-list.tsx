"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { useGetFactPackages } from "@/packages/api/base/codegen";
import type { Direction2, FactPackageListItem } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";

import { getDirectionLabel, getFactPackageStatusLabel } from "../../../lib/status-labels";

export function FactPackagesReviewList({
    direction,
    onBack,
    headerAction,
}: {
    direction?: Direction2;
    onBack?: () => void;
    headerAction?: React.ReactNode;
}) {
    const query = useGetFactPackages({params: direction ? {direction} : undefined});
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
        {id: "filial", header: "Филиал", cell: ({row}) => row.original.filial?.name ?? `ЦФО «${row.original.cfo?.name}»`},
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
            {onBack ? (
                <Button type="button" variant="outline" className="w-fit" onClick={onBack}>
                    ← Все направления
                </Button>
            ) : null}
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-2xl font-semibold">
                    {direction ? `Файлы — ${getDirectionLabel(direction)}` : "Файлы"}
                </h1>
                {headerAction}
            </div>
            <DataTable
                columns={columns}
                data={items}
                getRowId={(item) => String(item.id)}
                emptyMessage="Нет факт-пакетов"
            />
        </div>
    );
}
