"use client";

import Link from "next/link";

import { buttonVariants } from "#/components/ui/button";
import { useMarkPlanNotificationsRead } from "#/hooks/use-mark-plan-notifications-read";

export function OpenPlanLink({ id, humanId }: { id: number; humanId: string }) {
  const markPlanRead = useMarkPlanNotificationsRead();

  return (
    <Link
      href={`/planning/${humanId}`}
      onClick={() => markPlanRead(id)}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Открыть
    </Link>
  );
}
