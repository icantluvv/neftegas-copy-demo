"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { FactPackageListItem } from "@/packages/api/base/codegen";
import { useGetFactPackages } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getDirectionLabel, getFactCfoStatusLabel, getFactPackageStatusLabel } from "../../lib/status-labels";
import { FACT_CFO_STATUS_GROUPS } from "../constants";
import { FactDonutChart, type FactDonutSegment } from "./fact-donut-chart";
import { OpenFactPackageLink } from "./open-fact-package-link";

function factPackageMatchesFilter(item: FactPackageListItem, statusFilter: string, filialFilter: string): boolean {
  if (statusFilter !== "all" && item.myCfoStatus !== statusFilter) return false;
  if (filialFilter !== "all" && String(item.filial.id) !== filialFilter) return false;
  return true;
}

const columns: ColumnDef<FactPackageListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "filial", header: "Филиал", cell: ({ row }) => row.original.filial.name },
  { id: "direction", header: "Направление", cell: ({ row }) => getDirectionLabel(row.original.direction) },
  {
    id: "status",
    header: "Статус пакета",
    cell: ({ row }) => {
      const label = getFactPackageStatusLabel(row.original.status);
      return <Badge tone={label.tone}>{label.text}</Badge>;
    },
  },
  {
    id: "myCfoStatus",
    header: "Статус ЦФО",
    cell: ({ row }) => {
      if (!row.original.myCfoStatus) return "—";
      const label = getFactCfoStatusLabel(row.original.myCfoStatus);
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
 * Что это: свод факт-пакетов, направленных этому ЦФО — распределение по статусу СВОЕГО решения и таблица.
 * Кто видит: ЦФО (только пакеты, где есть строка статуса этого ЦФО — фильтрует бэкенд).
 * Когда активен: всегда.
 * Что происходит: клик по сегменту диаграммы фильтрует таблицу; строка ведёт на карточку пакета.
 */
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

  const segments: FactDonutSegment[] = useMemo(
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
    () => allFactPackages.filter((p) => factPackageMatchesFilter(p, statusFilter, filialFilter)),
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

  const selectedGroupKey = statusFilter === "all" ? null : statusFilter;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <FactDonutChart segments={segments} total={allFactPackages.length} selectedKey={selectedGroupKey} onSegmentClick={handleSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row">
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger aria-label="Фильтр по статусу ЦФО" className="w-full sm:w-64">
            <SelectValue>
              {(value: string) => {
                if (value === "all") return "— все статусы —";
                return FACT_CFO_STATUS_GROUPS.find((g) => g.key === value)?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">— все статусы —</SelectItem>
            <SelectGroup>
              <SelectLabel>Статус ЦФО</SelectLabel>
              {FACT_CFO_STATUS_GROUPS.map((group) => (
                <SelectItem key={group.key} value={group.key}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={filialFilter} onValueChange={(value) => value && setFilialFilter(value)}>
          <SelectTrigger aria-label="Фильтр по филиалу" className="w-full sm:w-64">
            <SelectValue>
              {(value: string) => {
                if (value === "all") return "Все филиалы";
                const id = Number(value);
                return filials.find((f) => f.id === id)?.name ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все филиалы</SelectItem>
            {filials.map((filial) => (
              <SelectItem key={filial.id} value={String(filial.id)}>
                {filial.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={visibleFactPackages} getRowId={(p) => String(p.id)} emptyMessage="Нет факт-пакетов с таким статусом" />
    </div>
  );
}
