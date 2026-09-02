"use client";

import Link from "next/link";

import { buttonVariants } from "#/components/ui/button";
import { useMarkFactPackageNotificationsRead } from "#/hooks/use-mark-fact-package-notifications-read";

/**
 * Что это: кнопка «Открыть» в строке факт-пакета на «Рабочем столе».
 * Кто видит: Филиал (свои пакеты) и ЦФО (направленные ему пакеты).
 * Когда активен: всегда.
 * Что происходит: помечает уведомления по этому пакету прочитанными и переходит на карточку `/fact/files/{humanId}`.
 */
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
