"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { PlanListItem, PlanStatus2 } from "@/packages/api/base/codegen";
import { useGetPlans } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getPlanStatusLabel } from "../../../lib/status-labels";
import { OpenPlanLink } from "../../components/open-plan-link";

const ALL_STATUSES: PlanStatus2[] = [
  "DRAFT",
  "UNDER_CFO_REVIEW",
  "PARTIALLY_APPROVED",
  "RETURNED_FOR_REVISION",
  "RESUBMITTED",
  "ALL_CFO_APPROVED",
  "UNDER_DTOE_REVIEW",
  "RETURNED_BY_DTOE",
  "APPROVED_BY_DTOE",
];

const columns: ColumnDef<PlanListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "filial", header: "Филиал", cell: ({ row }) => row.original.filial.name },
  { id: "type", header: "Тип", cell: ({ row }) => row.original.planType.name },
  {
    id: "status",
    header: "Статус",
    cell: ({ row }) => {
      const label = getPlanStatusLabel(row.original.status);
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

/**
 * Архив документов модуля «План на 2027» — плоский список всех доступных роли
 * планов (видимость по-прежнему ограничена бэкендом: филиал видит свои, ЦФО —
 * направленные ему, ДТОиР/ADMIN — все) с поиском по ID и фильтром по статусу.
 * Открывает ту же карточку `/planning/{humanId}`, что и рабочий стол —
 * отдельного детального экрана под `/planning/files/{humanId}` не заводим.
 */
export function PlansArchiveList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const plansQuery = useGetPlans({ params: { pageSize: 100, q: search || undefined } });

  const allPlans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data]);

  const visiblePlans = useMemo(
    () => allPlans.filter((p) => statusFilter === "all" || p.status === statusFilter),
    [allPlans, statusFilter],
  );

  if (plansQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (plansQuery.isError) {
    return <p className="text-sm text-muted-foreground">Не удалось загрузить планы.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row">
        <Input
          aria-label="Поиск по ID плана"
          placeholder="Поиск по ID (PLN-000001)"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:w-64"
        />
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger aria-label="Фильтр по статусу" className="w-full sm:w-64">
            <SelectValue>
              {(value: string) => (value === "all" ? "— все статусы —" : getPlanStatusLabel(value as PlanStatus2).text)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">— все статусы —</SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {getPlanStatusLabel(status).text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={visiblePlans} getRowId={(p) => String(p.id)} emptyMessage="Планы не найдены" />
    </div>
  );
}
