"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import type { PlanListItem, PlanStatus2 } from "@/packages/api/base/codegen";
import { getPlansQueryKey, useDeletePlan, useGetPlans } from "@/packages/api/base/codegen";

import { DonutChart, type DonutSegment } from "#/components/donut-chart";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getPlanStatusLabel } from "../../lib/status-labels";
import { PLAN_STAGE_GROUPS } from "../constants";
import { OpenPlanLink } from "./open-plan-link";

function groupKeyOfStatus(status: PlanStatus2): string {
  return PLAN_STAGE_GROUPS.find((group) => group.statuses.includes(status))?.key ?? "draft";
}

function planMatchesFilter(status: PlanStatus2, filterValue: string): boolean {
  if (filterValue === "all") return true;
  if (filterValue.startsWith("group:")) {
    return groupKeyOfStatus(status) === filterValue.slice("group:".length);
  }
  return true;
}

function DeleteDraftPlanCell({ humanId }: { humanId: string }) {
  const queryClient = useQueryClient();
  const deletePlan = useDeletePlan({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getPlansQueryKey({ pageSize: 100 }) }),
    },
  });

  return (
    <button
      type="button"
      aria-label={`Удалить план ${humanId}`}
      title="Удалить черновик"
      disabled={deletePlan.isPending}
      onClick={() => deletePlan.mutate({ humanId })}
      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden="true">
        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

const columns: ColumnDef<PlanListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "type", header: "Тип", cell: ({ row }) => row.original.planType.name },
  {
    id: "status",
    header: "Статус",
    cell: ({ row }) => {
      const label = getPlanStatusLabel(row.original.status);
      return <Badge tone={label.tone}>{label.text}</Badge>;
    },
  },
  { id: "stage", header: "Этап", cell: ({ row }) => row.original.stageNote || "—" },
  {
    id: "createdAt",
    header: "Создано",
    cell: ({ row }) => formatNotificationDateTime(row.original.createdAt),
  },
  {
    id: "updatedAt",
    header: "Изменено",
    cell: ({ row }) => formatNotificationDateTime(row.original.updatedAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <OpenPlanLink id={row.original.id} humanId={row.original.humanId} />
        {row.original.status === "DRAFT" && <DeleteDraftPlanCell humanId={row.original.humanId} />}
      </div>
    ),
  },
];

export function FilialPlansOverview() {
  const [filterValue, setFilterValue] = useState("all");
  const plansQuery = useGetPlans({ params: { pageSize: 100 } });

  const allPlans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data]);

  const segments: DonutSegment[] = useMemo(
    () =>
      PLAN_STAGE_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        value: allPlans.filter((p) => group.statuses.includes(p.status)).length,
        strokeClassName: group.strokeClassName,
        dotClassName: group.dotClassName,
      })),
    [allPlans],
  );

  const visiblePlans = useMemo(
    () => allPlans.filter((p) => planMatchesFilter(p.status, filterValue)),
    [allPlans, filterValue],
  );

  function handleSegmentClick(key: string) {
    const next = `group:${key}`;
    setFilterValue((current) => (current === next ? "all" : next));
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
        <p className="text-sm text-muted-foreground">У вас пока нет планов</p>
        <Link href="/planning/create" className={buttonVariants()}>
          Создать первый план
        </Link>
      </div>
    );
  }

  const selectedGroupKey = filterValue.startsWith("group:") ? filterValue.slice("group:".length) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <DonutChart segments={segments} total={allPlans.length} selectedKey={selectedGroupKey} onSegmentClick={handleSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <Select value={filterValue} onValueChange={(value) => value && setFilterValue(value)}>
          <SelectTrigger aria-label="Фильтр по статусу" className="w-full sm:w-80">
            <SelectValue>
              {(value: string) => {
                if (value === "all") return "— все статусы —";
                return PLAN_STAGE_GROUPS.find((g) => g.key === value.slice("group:".length))?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">— все статусы —</SelectItem>
            <SelectGroup>
              <SelectLabel>Укрупнённая группа</SelectLabel>
              {PLAN_STAGE_GROUPS.map((group) => (
                <SelectItem key={group.key} value={`group:${group.key}`}>
                  {group.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Link href="/planning/create" className={buttonVariants()}>
          + Создать план
        </Link>
      </div>

      <DataTable columns={columns} data={visiblePlans} getRowId={(p) => String(p.id)} emptyMessage="Нет планов с таким статусом" />
    </div>
  );
}
