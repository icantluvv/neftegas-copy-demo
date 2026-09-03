import type { FactPackageCfoStatus2 } from "@/packages/api/base/codegen";

import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

export function DecidedByCell({ cfoStatus }: { cfoStatus: FactPackageCfoStatus2 }) {
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
