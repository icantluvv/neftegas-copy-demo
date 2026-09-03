"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import type { FactPackageListItem } from "@/packages/api/base/codegen";

import { DonutChart, type DonutSegment } from "#/components/donut-chart";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getDirectionLabel, getFactPackageStatusLabel } from "../../lib/status-labels";
import { FACT_STAGE_GROUPS } from "../constants";
import { OpenFactPackageLink } from "./open-fact-package-link";

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

interface FilialFactOverviewContentProps {
  segments: DonutSegment[];
  total: number;
  filterValue: string;
  onFilterChange: (value: string) => void;
  onSegmentClick: (key: string) => void;
  visibleFactPackages: FactPackageListItem[];
}

export function FilialFactOverviewContent({
  segments,
  total,
  filterValue,
  onFilterChange,
  onSegmentClick,
  visibleFactPackages,
}: FilialFactOverviewContentProps) {
  const selectedGroupKey = filterValue.startsWith("group:") ? filterValue.slice("group:".length) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <DonutChart segments={segments} total={total} selectedKey={selectedGroupKey} onSegmentClick={onSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <Select value={filterValue} onValueChange={(value) => value && onFilterChange(value)}>
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
