"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { PlanListItem } from "@/packages/api/base/codegen";
import { useGetPlans } from "@/packages/api/base/codegen";

import { DonutChart, type DonutSegment } from "#/components/donut-chart";
import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getPlanCfoStatusLabel, getPlanStatusLabel } from "../../lib/status-labels";
import { PLAN_CFO_STATUS_GROUPS } from "../constants";
import { OpenPlanLink } from "./open-plan-link";

function planMatchesFilter(item: PlanListItem, statusFilter: string, filialFilter: string): boolean {
  if (statusFilter !== "all" && item.myCfoStatus !== statusFilter) return false;
  if (filialFilter !== "all" && String(item.filial.id) !== filialFilter) return false;
  return true;
}

const columns: ColumnDef<PlanListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "filial", header: "Филиал", cell: ({ row }) => row.original.filial.name },
  { id: "type", header: "Тип", cell: ({ row }) => row.original.planType.name },
  {
    id: "status",
    header: "Статус плана",
    cell: ({ row }) => {
      const label = getPlanStatusLabel(row.original.status);
      return <Badge tone={label.tone}>{label.text}</Badge>;
    },
  },
  {
    id: "myCfoStatus",
    header: "Статус ЦФО",
    cell: ({ row }) => {
      if (!row.original.myCfoStatus) return "—";
      const label = getPlanCfoStatusLabel(row.original.myCfoStatus);
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
    cell: ({ row }) => <OpenPlanLink id={row.original.id} humanId={row.original.humanId} />,
  },
];

export function CfoPlansOverview() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [filialFilter, setFilialFilter] = useState("all");
  const plansQuery = useGetPlans({ params: { pageSize: 100 } });

  const allPlans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data]);

  const filials = useMemo(() => {
    const byId = new Map<number, string>();
    for (const item of allPlans) {
      byId.set(item.filial.id, item.filial.name);
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [allPlans]);

  const segments: DonutSegment[] = useMemo(
    () =>
      PLAN_CFO_STATUS_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        value: allPlans.filter((p) => p.myCfoStatus === group.key).length,
        strokeClassName: group.strokeClassName,
        dotClassName: group.dotClassName,
      })),
    [allPlans],
  );

  const visiblePlans = useMemo(
    () => allPlans.filter((p) => planMatchesFilter(p, statusFilter, filialFilter)),
    [allPlans, statusFilter, filialFilter],
  );

  function handleSegmentClick(key: string) {
    setStatusFilter((current) => (current === key ? "all" : key));
  }

  if (plansQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (plansQuery.isError) {
    return <p className="text-sm text-muted-foreground">Не удалось загрузить планы.</p>;
  }

  if (allPlans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">Пока нет планов, направленных этому подразделению</p>
      </div>
    );
  }

  const selectedGroupKey = statusFilter === "all" ? null : statusFilter;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <DonutChart segments={segments} total={allPlans.length} selectedKey={selectedGroupKey} onSegmentClick={handleSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row">
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger aria-label="Фильтр по статусу ЦФО" className="w-full sm:w-64">
            <SelectValue>
              {(value: string) => {
                if (value === "all") return "— все статусы —";
                return PLAN_CFO_STATUS_GROUPS.find((g) => g.key === value)?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">— все статусы —</SelectItem>
            <SelectGroup>
              <SelectLabel>Статус ЦФО</SelectLabel>
              {PLAN_CFO_STATUS_GROUPS.map((group) => (
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

      <DataTable columns={columns} data={visiblePlans} getRowId={(p) => String(p.id)} emptyMessage="Нет планов с таким статусом" />
    </div>
  );
}
