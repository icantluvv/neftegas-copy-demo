"use client";

import Link from "next/link";

import { useGetOrCreateFactPackageByDirection } from "@/packages/api/base/codegen";
import type { Direction2 } from "@/packages/api/base/codegen";

import { getDirectionLabel } from "../../../lib/status-labels";

export function DirectionCard({ direction }: { direction: Direction2 }) {
    const query = useGetOrCreateFactPackageByDirection({direction});

    if (query.isPending) {
        return <div className="h-28 animate-pulse rounded-lg bg-muted"/>;
    }

    if (query.isError || !query.data) {
        return (
            <div className="flex h-28 flex-col justify-center gap-1 rounded-lg border border-border p-4">
                <span className="text-sm font-semibold">{getDirectionLabel(direction)}</span>
                <span className="text-sm text-destructive">Не удалось загрузить</span>
            </div>
        );
    }

    const factPackage = query.data;

    return (
        <Link
            href={`/fact/files/${factPackage.humanId}`}
            className="flex h-28 flex-col justify-between gap-2 rounded-lg border border-border p-4 transition-colors hover:border-primary"
        >
            <span className="text-sm font-semibold">{getDirectionLabel(direction)}</span>
            <span className="text-xs text-muted-foreground">{factPackage.humanId}</span>
        </Link>
    );
}
