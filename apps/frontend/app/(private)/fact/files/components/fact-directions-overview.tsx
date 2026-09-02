"use client";

import Link from "next/link";

import { useGetOrCreateFactPackageByDirection } from "@/packages/api/base/codegen";
import type { Direction2 } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";

import { getDirectionLabel, getFactPackageStatusLabel } from "../../../lib/status-labels";

const DIRECTIONS: Direction2[] = ["DO", "TOIR", "KR_PD", "KR_HS"];

/**
 * Что это: карточка одного направления факт-пакета на «Рабочем столе» модуля «Факт» → «Файлы».
 * Кто видит: Филиал.
 * Когда активен: всегда — если пакета для этого направления ещё нет, он создаётся автоматически при первом открытии (getOrCreateFactPackageByDirection).
 * Что происходит: клик по карточке переходит на карточку факт-пакета `/fact/files/{humanId}`.
 */
function DirectionCard({ direction }: { direction: Direction2 }) {
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
    const statusLabel = getFactPackageStatusLabel(factPackage.status);

    return (
        <Link
            href={`/fact/files/${factPackage.humanId}`}
            className="flex h-28 flex-col justify-between gap-2 rounded-lg border border-border p-4 transition-colors hover:border-primary"
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{getDirectionLabel(direction)}</span>
                <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{factPackage.humanId}</span>
        </Link>
    );
}

export function FactDirectionsOverview() {
    return (
        <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Файлы</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {DIRECTIONS.map((direction) => (
                    <DirectionCard key={direction} direction={direction}/>
                ))}
            </div>
        </div>
    );
}
