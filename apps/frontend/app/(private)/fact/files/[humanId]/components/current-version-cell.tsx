import type { FactForm2 } from "@/packages/api/base/codegen";
import { clientEnvironment } from "#/env/client";

import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

export function CurrentVersionCell({ form, canDownload }: { form: FactForm2; canDownload: boolean }) {
  if (!form.currentVersion) {
    return <span className="text-muted-foreground">Нет версий</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span>Версия {form.currentVersion.versionNumber}</span>
      <span className="text-xs text-muted-foreground">{formatNotificationDateTime(form.currentVersion.uploadedAt)}</span>
      {canDownload && (
        <a
          href={`${clientEnvironment.NEXT_PUBLIC_BACK_URL}/fact-files/${form.currentVersion.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-xs text-primary underline-offset-4 hover:underline"
        >
          Открыть / скачать
        </a>
      )}
    </div>
  );
}
