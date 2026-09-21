import type { ColumnDef } from "@tanstack/react-table";

import type { PlanDetail, PlanHistoryEntry2 } from "@/packages/api/base/codegen";

import { DataTable } from "#/components/ui/data-table";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

export function HistoryLog({ detail }: { detail: PlanDetail }) {
  const columns: ColumnDef<PlanHistoryEntry2, unknown>[] = [
    {
      id: "timestamp",
      header: "Дата и время",
      cell: ({ row }) => formatNotificationDateTime(row.original.timestamp),
    },
    {
      id: "user",
      header: "Пользователь",
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return "Система";
        return (
          <span>
            {user.fullName}
            {user.position ? `, ${user.position}` : ""}
          </span>
        );
      },
    },
    { accessorKey: "text", header: "Действие" },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">История действий</h2>
      <DataTable
        columns={columns}
        data={detail.history}
        getRowId={(entry) => String(entry.id)}
        emptyMessage="История пуста"
      />
    </div>
  );
}
