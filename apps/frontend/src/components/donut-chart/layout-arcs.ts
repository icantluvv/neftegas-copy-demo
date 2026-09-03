import type { DonutSegment } from "./donut-chart";

export interface Arc {
  segment: DonutSegment;
  length: number;
  dashOffset: number;
}

export function layoutArcs(segments: DonutSegment[], total: number, circumference: number, segmentGap: number): Arc[] {
  return segments.reduce<{ arcs: Arc[]; offset: number }>(
    (acc, segment) => {
      if (segment.value === 0) return acc;
      const share = segment.value / total;
      const length = Math.max(share * circumference - segmentGap, 0);
      return {
        arcs: [...acc.arcs, { segment, length, dashOffset: -acc.offset }],
        offset: acc.offset + share * circumference,
      };
    },
    { arcs: [], offset: 0 },
  ).arcs;
}
