"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { FactPackageListItem } from "@/packages/api/base/codegen";

import { DonutChart, type DonutSegment } from "#/components/donut-chart";
import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getDirectionLabel, getFactCfoStatusLabel, getFactPackageStatusLabel } from "../../lib/status-labels";
import { FACT_CFO_STATUS_GROUPS } from "../constants";
import { OpenFactPackageLink } from "./open-fact-package-link";

const columns: ColumnDef<FactPackageListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "filial", header: "Филиал", cell: ({ row }) => row.original.filial?.name ?? `ЦФО «${row.original.cfo?.name}»` },
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

interface CfoFactOverviewContentProps {
  segments: DonutSegment[];
  total: number;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filialFilter: string;
  onFilialFilterChange: (value: string) => void;
  onSegmentClick: (key: string) => void;
  filials: { id: number; name: string }[];
  visibleFactPackages: FactPackageListItem[];
}

export function CfoFactOverviewContent({
  segments,
  total,
  statusFilter,
  onStatusFilterChange,
  filialFilter,
  onFilialFilterChange,
  onSegmentClick,
  filials,
  visibleFactPackages,
}: CfoFactOverviewContentProps) {
  const selectedGroupKey = statusFilter === "all" ? null : statusFilter;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <DonutChart segments={segments} total={total} selectedKey={selectedGroupKey} onSegmentClick={onSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row">
        <Select value={statusFilter} onValueChange={(value) => value && onStatusFilterChange(value)}>
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

        <Select value={filialFilter} onValueChange={(value) => value && onFilialFilterChange(value)}>
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
