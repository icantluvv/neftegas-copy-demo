"use client";

import type { Direction2 } from "@/packages/api/base/codegen";

import { getDirectionLabel } from "../../../lib/status-labels";

export function CfoDirectionCard({ direction, onClick }: { direction: Direction2; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-28 flex-col justify-between gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary"
        >
            <span className="text-sm font-semibold">{getDirectionLabel(direction)}</span>
            <span className="text-xs text-muted-foreground">Пакеты на проверке</span>
        </button>
    );
}
