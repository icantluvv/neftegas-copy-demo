import Link from "next/link";

import type { PlanDetail } from "@/packages/api/base/codegen";

import { Badge } from "#/components/ui/badge";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

import { getPlanStatusLabel } from "../../../lib/status-labels";

export function PlanHeader({ detail }: { detail: PlanDetail }) {
  const statusLabel = getPlanStatusLabel(detail.status);
  const canChangeType = detail.isFilialOwner && detail.status === "DRAFT";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{detail.humanId}</h1>
          <Badge tone={statusLabel.tone}>{statusLabel.text}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{detail.planType.name}</span>
          {canChangeType && (
            <Link href={`/planning/${detail.humanId}/edit`} className="text-sm text-primary hover:underline">
              Изменить тип
            </Link>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{detail.stageNote}</p>
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
