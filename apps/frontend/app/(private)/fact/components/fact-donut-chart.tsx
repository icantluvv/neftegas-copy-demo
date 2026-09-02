"use client";

import { cn } from "@/lib/utils";

export interface FactDonutSegment {
  key: string;
  label: string;
  value: number;
  strokeClassName: string;
  dotClassName: string;
}

interface FactDonutChartProps {
  segments: FactDonutSegment[];
  total: number;
  selectedKey: string | null;
  onSegmentClick: (key: string) => void;
}

const RADIUS = 40;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;

interface Arc {
  segment: FactDonutSegment;
  length: number;
  dashOffset: number;
}

function layoutArcs(segments: FactDonutSegment[], total: number): Arc[] {
  return segments.reduce<{ arcs: Arc[]; offset: number }>(
    (acc, segment) => {
      if (segment.value === 0) return acc;
      const share = segment.value / total;
      const length = Math.max(share * CIRCUMFERENCE - SEGMENT_GAP, 0);
      return {
        arcs: [...acc.arcs, { segment, length, dashOffset: -acc.offset }],
        offset: acc.offset + share * CIRCUMFERENCE,
      };
    },
    { arcs: [], offset: 0 },
  ).arcs;
}

/** Зеркало `dashboard/components/donut-chart.tsx` для факт-пакетов (см. AGENTS.md — route-модули самодостаточны). */
export function FactDonutChart({ segments, total, selectedKey, onSegmentClick }: FactDonutChartProps) {
  const arcs = layoutArcs(segments, total);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative flex size-40 shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="size-40 -rotate-90" role="img" aria-label="Распределение факт-пакетов по статусам">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth={STROKE_WIDTH} className="stroke-muted" />
          {arcs.map(({ segment, length, dashOffset }) => {
            const isDimmed = selectedKey !== null && selectedKey !== segment.key;

            return (
              <circle
                key={segment.key}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={`${length} ${CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                className={cn(segment.strokeClassName, "cursor-pointer transition-opacity", isDimmed && "opacity-30")}
                onClick={() => onSegmentClick(segment.key)}
              >
                <title>{`${segment.label}: ${segment.value}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold">{total}</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1">
        {segments.map((segment) => (
          <li key={segment.key}>
            <button
              type="button"
              onClick={() => onSegmentClick(segment.key)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                selectedKey === segment.key && "bg-muted",
              )}
            >
              <span className={cn("size-2.5 shrink-0 rounded-full", segment.dotClassName)} aria-hidden="true" />
              <span className="flex-1 text-foreground">{segment.label}</span>
              <span className="tabular-nums text-muted-foreground">{segment.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
