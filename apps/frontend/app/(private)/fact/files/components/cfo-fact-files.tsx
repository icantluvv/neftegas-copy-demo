"use client";

import { useState } from "react";

import type { Direction2 } from "@/packages/api/base/codegen";

import { CfoCreateOwnPackageButton } from "./cfo-create-own-package-button";
import { CfoDirectionCard } from "./cfo-direction-card";
import { FactPackagesReviewList } from "./fact-packages-review-list";

const DIRECTIONS: Direction2[] = ["DO", "TOIR", "KR_PD", "KR_HS"];

export function CfoFactFiles() {
    const [direction, setDirection] = useState<Direction2 | null>(null);

    if (direction) {
        return (
            <FactPackagesReviewList
                direction={direction}
                onBack={() => setDirection(null)}
                headerAction={<CfoCreateOwnPackageButton direction={direction}/>}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Файлы</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {DIRECTIONS.map((d) => (
                    <CfoDirectionCard key={d} direction={d} onClick={() => setDirection(d)}/>
                ))}
            </div>
        </div>
    );
}
