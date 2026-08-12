import type { CorrectionDetail } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getCfoStatusLabel } from "../lib/status-labels";

export function CfoStatuses({ detail }: { detail: CorrectionDetail }) {
  if (detail.cfoStatuses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Статусы ЦФО</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ЦФО</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Кто/когда решил</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.cfoStatuses.map((cfoStatus) => {
            const statusLabel = getCfoStatusLabel(cfoStatus.status);
            return (
              <TableRow key={cfoStatus.id}>
                <TableCell>{cfoStatus.cfo.name}</TableCell>
                <TableCell>
                  <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>
                </TableCell>
                <TableCell>
                  {cfoStatus.decidedBy && cfoStatus.decidedAt ? (
                    <div className="flex flex-col">
                      <span>
                        {cfoStatus.decidedBy.fullName}
                        {cfoStatus.decidedBy.position ? `, ${cfoStatus.decidedBy.position}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatNotificationDateTime(cfoStatus.decidedAt)}
                      </span>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
