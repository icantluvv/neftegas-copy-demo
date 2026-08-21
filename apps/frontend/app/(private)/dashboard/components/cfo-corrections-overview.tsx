"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { CfoStatusValue2, CorrectionListItem } from "@/packages/api/base/codegen";
import { useGetCorrections } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "#/components/ui/select";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getCfoStatusLabel, getCorrectionStatusLabel } from "../../lib/status-labels";
import { DonutChart, type DonutSegment } from "./donut-chart";

interface CfoStatusGroup {
  key: CfoStatusValue2;
  label: string;
  strokeClassName: string;
  dotClassName: string;
}

// Группировка по статусу СВОЕГО ЦФО (не общему статусу пакета) — ЧТЗ «Кабинет
// ЦФО», раздел 2.4: две колонки/оси намеренно разведены, «статус пакета» может
// отличаться от «статуса нашего ЦФО» (другой ЦФО ещё не решил или уже вернул).
const CFO_STATUS_GROUPS: CfoStatusGroup[] = [
  { key: "PENDING", label: "На проверке у нас", strokeClassName: "stroke-sky-500", dotClassName: "bg-sky-500" },
  { key: "RETURNED", label: "Мы вернули", strokeClassName: "stroke-red-500", dotClassName: "bg-red-500" },
  { key: "APPROVED", label: "Мы согласовали", strokeClassName: "stroke-emerald-500", dotClassName: "bg-emerald-500" },
];

function correctionMatchesFilter(item: CorrectionListItem, statusFilter: string, filialFilter: string): boolean {
  if (statusFilter !== "all" && item.myCfoStatus !== statusFilter) return false;
  if (filialFilter !== "all" && String(item.filial.id) !== filialFilter) return false;
  return true;
}

const columns: ColumnDef<CorrectionListItem, unknown>[] = [
  { accessorKey: "humanId", header: "ID" },
  { id: "filial", header: "Филиал", cell: ({ row }) => row.original.filial.name },
  { id: "type", header: "Тип", cell: ({ row }) => row.original.correctionType.name },
  {
    id: "status",
    header: "Статус пакета",
    cell: ({ row }) => {
      const label = getCorrectionStatusLabel(row.original.status);
      return <Badge tone={label.tone}>{label.text}</Badge>;
    },
  },
  {
    id: "myCfoStatus",
    header: "Статус ЦФО",
    cell: ({ row }) => {
      if (!row.original.myCfoStatus) return "—";
      const label = getCfoStatusLabel(row.original.myCfoStatus);
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
    cell: ({ row }) => (
      <Link href={`/corrections/${row.original.humanId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Открыть
      </Link>
    ),
  },
];

export function CfoCorrectionsOverview() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [filialFilter, setFilialFilter] = useState("all");
  const correctionsQuery = useGetCorrections({ params: { pageSize: 100 } });

  const allCorrections = useMemo(() => correctionsQuery.data?.items ?? [], [correctionsQuery.data]);

  const filials = useMemo(() => {
    const byId = new Map<number, string>();
    for (const item of allCorrections) {
      byId.set(item.filial.id, item.filial.name);
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [allCorrections]);

  const segments: DonutSegment[] = useMemo(
    () =>
      CFO_STATUS_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        value: allCorrections.filter((c) => c.myCfoStatus === group.key).length,
        strokeClassName: group.strokeClassName,
        dotClassName: group.dotClassName,
      })),
    [allCorrections],
  );

  const visibleCorrections = useMemo(
    () => allCorrections.filter((c) => correctionMatchesFilter(c, statusFilter, filialFilter)),
    [allCorrections, statusFilter, filialFilter],
  );

  function handleSegmentClick(key: string) {
    setStatusFilter((current) => (current === key ? "all" : key));
  }

  if (correctionsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (correctionsQuery.isError) {
    return <p className="text-sm text-muted-foreground">Не удалось загрузить корректировки.</p>;
  }

  if (allCorrections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">Пока нет корректировок, направленных этому подразделению</p>
      </div>
    );
  }

  const selectedGroupKey = statusFilter === "all" ? null : statusFilter;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-base font-semibold">Распределение по статусам</h2>
        <DonutChart segments={segments} total={allCorrections.length} selectedKey={selectedGroupKey} onSegmentClick={handleSegmentClick} />
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row">
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
          <SelectTrigger aria-label="Фильтр по статусу ЦФО" className="w-full sm:w-64">
            <SelectValue>
              {(value: string) => {
                if (value === "all") return "— все статусы —";
                return CFO_STATUS_GROUPS.find((g) => g.key === value)?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">— все статусы —</SelectItem>
            <SelectGroup>
              <SelectLabel>Статус ЦФО</SelectLabel>
              {CFO_STATUS_GROUPS.map((group) => (
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

      <DataTable columns={columns} data={visibleCorrections} getRowId={(c) => String(c.id)} emptyMessage="Нет корректировок с таким статусом" />
    </div>
  );
}
