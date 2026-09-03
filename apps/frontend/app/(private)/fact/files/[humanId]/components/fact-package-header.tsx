import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getDirectionLabel, getFactPackageStatusLabel } from "../../../../lib/status-labels";

export function FactPackageHeader({ detail }: { detail: FactPackageDetail }) {
  const statusLabel = getFactPackageStatusLabel(detail.status);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{detail.humanId}</h1>
          <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>
        </div>
        <span className="text-sm text-muted-foreground">{getDirectionLabel(detail.direction)}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Филиал</dt>
          <dd>{detail.filial.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Автор</dt>
          <dd>{detail.author.fullName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Создано</dt>
          <dd>{formatNotificationDateTime(detail.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Изменено</dt>
          <dd>{formatNotificationDateTime(detail.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
