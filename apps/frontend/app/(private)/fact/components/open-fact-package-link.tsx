"use client";

import Link from "next/link";

import { buttonVariants } from "#/components/ui/button";
import { useMarkFactPackageNotificationsRead } from "#/hooks/use-mark-fact-package-notifications-read";

export function OpenFactPackageLink({ id, humanId }: { id: number; humanId: string }) {
  const markFactPackageRead = useMarkFactPackageNotificationsRead();

  return (
    <Link
      href={`/fact/files/${humanId}`}
      onClick={() => markFactPackageRead(id)}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Открыть
    </Link>
  );
}
