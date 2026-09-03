"use client";

import { useRouter } from "next/navigation";

import { useCreateFactPackage } from "@/packages/api/base/codegen";
import type { Direction2 } from "@/packages/api/base/codegen";

import { getDirectionLabel } from "../../../lib/status-labels";

export function DirectionCard({ direction }: { direction: Direction2 }) {
    const router = useRouter();
    const createFactPackage = useCreateFactPackage({
        mutation: {
            onSuccess: (detail) => router.push(`/fact/files/${detail.humanId}`),
        },
    });

    return (
        <button
            type="button"
            onClick={() => createFactPackage.mutate({data: {direction}})}
            disabled={createFactPackage.isPending}
            className="flex h-28 flex-col justify-between gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary disabled:opacity-60"
        >
            <span className="text-sm font-semibold">{getDirectionLabel(direction)}</span>
            <span className="text-xs text-muted-foreground">
                {createFactPackage.isPending ? "Создаём…" : "Создать новый пакет"}
            </span>
        </button>
    );
}
