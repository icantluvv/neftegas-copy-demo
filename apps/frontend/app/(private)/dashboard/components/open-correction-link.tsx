"use client";

import Link from "next/link";

import { buttonVariants } from "#/components/ui/button";
import { useMarkCorrectionNotificationsRead } from "#/hooks/use-mark-correction-notifications-read";

export function OpenCorrectionLink({ id, humanId }: { id: number; humanId: string }) {
  const markCorrectionRead = useMarkCorrectionNotificationsRead();

  return (
    <Link
      href={`/corrections/${humanId}`}
      onClick={() => markCorrectionRead(id)}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Открыть
    </Link>
  );
}
