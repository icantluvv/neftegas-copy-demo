"use client";

import type { Direction2 } from "@/packages/api/base/codegen";

import { DirectionCard } from "./direction-card";

const DIRECTIONS: Direction2[] = ["DO", "TOIR", "KR_PD", "KR_HS"];

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
