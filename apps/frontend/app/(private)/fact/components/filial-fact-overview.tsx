"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useGetFactPackages } from "@/packages/api/base/codegen";

import { type DonutSegment } from "#/components/donut-chart";
import { buttonVariants } from "#/components/ui/button";

import { FACT_STAGE_GROUPS } from "../constants";
import { factPackageMatchesStageFilter } from "../lib/overview-filters";
import { FilialFactOverviewContent } from "./filial-fact-overview-content";

export function FilialFactOverview() {
  const [filterValue, setFilterValue] = useState("all");
  const factPackagesQuery = useGetFactPackages({ params: { pageSize: 100 } });

  const allFactPackages = useMemo(() => factPackagesQuery.data?.items ?? [], [factPackagesQuery.data]);

  const segments: DonutSegment[] = useMemo(
    () =>
      FACT_STAGE_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        value: allFactPackages.filter((p) => group.statuses.includes(p.status)).length,
        strokeClassName: group.strokeClassName,
        dotClassName: group.dotClassName,
      })),
    [allFactPackages],
  );

  const visibleFactPackages = useMemo(
    () => allFactPackages.filter((p) => factPackageMatchesStageFilter(p.status, filterValue)),
    [allFactPackages, filterValue],
  );

  function handleSegmentClick(key: string) {
    const next = `group:${key}`;
    setFilterValue((current) => (current === next ? "all" : next));
  }

  if (factPackagesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (factPackagesQuery.isError) {
    return <p className="text-sm text-muted-foreground">Не удалось загрузить факт-пакеты.</p>;
  }

  if (allFactPackages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">У вас пока нет факт-пакетов</p>
        <Link href="/fact/files" className={buttonVariants()}>
          Перейти к файлам
        </Link>
      </div>
    );
  }

  return (
    <FilialFactOverviewContent
      segments={segments}
      total={allFactPackages.length}
      filterValue={filterValue}
      onFilterChange={setFilterValue}
      onSegmentClick={handleSegmentClick}
      visibleFactPackages={visibleFactPackages}
    />
  );
}
