"use client";

import { useRouter } from "next/navigation";

import { useCreateFactPackage } from "@/packages/api/base/codegen";
import type { Direction2 } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";

export function CfoCreateOwnPackageButton({ direction }: { direction: Direction2 }) {
    const router = useRouter();
    const createFactPackage = useCreateFactPackage({
        mutation: {
            onSuccess: (detail) => router.push(`/fact/files/${detail.humanId}`),
        },
    });

    return (
        <Button
            type="button"
            disabled={createFactPackage.isPending}
            onClick={() => createFactPackage.mutate({data: {direction}})}
        >
            {createFactPackage.isPending ? "Создаём…" : "Создать свой пакет"}
        </Button>
    );
}
