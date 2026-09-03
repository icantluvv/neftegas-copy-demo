"use client";

import { useMemo, useState } from "react";

import { useGetFactPackages } from "@/packages/api/base/codegen";

import { type DonutSegment } from "#/components/donut-chart";

import { FACT_CFO_STATUS_GROUPS } from "../constants";
import { factPackageMatchesCfoFilter } from "../lib/overview-filters";
import { CfoFactOverviewContent } from "./cfo-fact-overview-content";

export function CfoFactOverview() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [filialFilter, setFilialFilter] = useState("all");
  const factPackagesQuery = useGetFactPackages({ params: { pageSize: 100 } });

  const allFactPackages = useMemo(() => factPackagesQuery.data?.items ?? [], [factPackagesQuery.data]);

  const filials = useMemo(() => {
    const byId = new Map<number, string>();
    for (const item of allFactPackages) {
      byId.set(item.filial.id, item.filial.name);
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [allFactPackages]);

  const segments: DonutSegment[] = useMemo(
    () =>
      FACT_CFO_STATUS_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        value: allFactPackages.filter((p) => p.myCfoStatus === group.key).length,
        strokeClassName: group.strokeClassName,
        dotClassName: group.dotClassName,
      })),
    [allFactPackages],
  );

  const visibleFactPackages = useMemo(
    () => allFactPackages.filter((p) => factPackageMatchesCfoFilter(p, statusFilter, filialFilter)),
    [allFactPackages, statusFilter, filialFilter],
  );

  function handleSegmentClick(key: string) {
    setStatusFilter((current) => (current === key ? "all" : key));
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
        <p className="text-sm text-muted-foreground">Пока нет факт-пакетов, направленных этому подразделению</p>
      </div>
    );
  }

  return (
    <CfoFactOverviewContent
      segments={segments}
      total={allFactPackages.length}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      filialFilter={filialFilter}
      onFilialFilterChange={setFilialFilter}
      onSegmentClick={handleSegmentClick}
      filials={filials}
      visibleFactPackages={visibleFactPackages}
    />
  );
}
