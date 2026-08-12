import type { ColumnDef } from "@tanstack/react-table";

import type { CorrectionCfoStatus2, CorrectionDetail } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { DataTable } from "#/components/ui/data-table";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getCfoStatusLabel } from "../lib/status-labels";

function DecidedByCell({ cfoStatus }: { cfoStatus: CorrectionCfoStatus2 }) {
  if (!cfoStatus.decidedBy || !cfoStatus.decidedAt) {
    return "—";
  }

  return (
    <div className="flex flex-col">
      <span>
        {cfoStatus.decidedBy.fullName}
        {cfoStatus.decidedBy.position ? `, ${cfoStatus.decidedBy.position}` : ""}
      </span>
      <span className="text-xs text-muted-foreground">{formatNotificationDateTime(cfoStatus.decidedAt)}</span>
    </div>
  );
}

export function CfoStatuses({ detail }: { detail: CorrectionDetail }) {
  if (detail.cfoStatuses.length === 0) {
    return null;
  }

  const columns: ColumnDef<CorrectionCfoStatus2, unknown>[] = [
    { id: "cfo", header: "ЦФО", cell: ({ row }) => row.original.cfo.name },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => {
        const statusLabel = getCfoStatusLabel(row.original.status);
        return <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>;
      },
    },
    {
      id: "decidedBy",
      header: "Кто/когда решил",
      cell: ({ row }) => <DecidedByCell cfoStatus={row.original} />,
    },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Статусы ЦФО</h2>
      <DataTable columns={columns} data={detail.cfoStatuses} getRowId={(status) => String(status.id)} />
    </div>
  );
}
