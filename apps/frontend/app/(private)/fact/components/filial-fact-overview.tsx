"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { FactPackageListItem, FactPackageStatus2 } from "@/packages/api/base/codegen";
import { useGetFactPackages } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getDirectionLabel, getFactPackageStatusLabel } from "../../lib/status-labels";
import { FACT_STAGE_GROUPS } from "../constants";
import { FactDonutChart, type FactDonutSegment } from "./fact-donut-chart";
import { OpenFactPackageLink } from "./open-fact-package-link";

function groupKeyOfStatus(status: FactPackageStatus2): string {
  return FACT_STAGE_GROUPS.find((group) => group.statuses.includes(status))?.key ?? "draft";
}

function factPackageMatchesFilter(status: FactPackageStatus2, filterValue: string): boolean {
  if (filterValue === "all") return true;
  if (filterValue.startsWith("group:")) {
    return groupKeyOfStatus(status) === filterValue.slice("group:".length);
  }
  return true;
}

const columns: ColumnDef<FactPackageListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "direction", header: "Направление", cell: ({ row }) => getDirectionLabel(row.original.direction) },
  {
    id: "status",
    header: "Статус",
    cell: ({ row }) => {
      const label = getFactPackageStatusLabel(row.original.status);
      return <Badge tone={label.tone}>{label.text}</Badge>;
    },
  },
  {
    id: "updatedAt",
    header: "Изменено",
    cell: ({ row }) => formatNotificationDateTime(row.original.updatedAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <OpenFactPackageLink id={row.original.id} humanId={row.original.humanId} />,
  },
];

/**
 * Что это: свод факт-пакетов филиала — распределение по статусам и таблица со всеми направлениями.
 * Кто видит: Филиал (только свои пакеты — фильтрует бэкенд по filialId из текущего пользователя).
 * Когда активен: всегда, пакеты создаются автоматически по направлению (см. `/fact/files`).
 * Что происходит: клик по сегменту диаграммы или строке — фильтр/переход на карточку.
 */
export function FilialFactOverview() {
  const [filterValue, setFilterValue] = useState("all");
  const factPackagesQuery = useGetFactPackages({ params: { pageSize: 100 } });

  const allFactPackages = useMemo(() => factPackagesQuery.data?.items ?? [], [factPackagesQuery.data]);

  const segments: FactDonutSegment[] = useMemo(
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
    () => allFactPackages.filter((p) => factPackageMatchesFilter(p.status, filterValue)),
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

  const selectedGroupKey = filterValue.startsWith("group:") ? filterValue.slice("group:".length) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <FactDonutChart segments={segments} total={allFactPackages.length} selectedKey={selectedGroupKey} onSegmentClick={handleSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <Select value={filterValue} onValueChange={(value) => value && setFilterValue(value)}>
          <SelectTrigger aria-label="Фильтр по статусу" className="w-full sm:w-80">
            <SelectValue>
              {(value: string) => {
                if (value === "all") return "— все статусы —";
                return FACT_STAGE_GROUPS.find((g) => g.key === value.slice("group:".length))?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">— все статусы —</SelectItem>
            <SelectGroup>
              <SelectLabel>Укрупнённая группа</SelectLabel>
              {FACT_STAGE_GROUPS.map((group) => (
                <SelectItem key={group.key} value={`group:${group.key}`}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Link href="/fact/files" className={buttonVariants({ variant: "outline" })}>
          Все файлы
        </Link>
      </div>

      <DataTable columns={columns} data={visibleFactPackages} getRowId={(p) => String(p.id)} emptyMessage="Нет факт-пакетов с таким статусом" />
    </div>
  );
}
