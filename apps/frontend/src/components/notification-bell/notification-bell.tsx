"use client";

import { Popover } from "@base-ui/react/popover";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  getNotificationsQueryKey,
  useGetNotifications,
  useOpenNotification,
  type Notification,
} from "@/packages/api/base/codegen";

import { buttonVariants } from "#/components/ui/button";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

const PANEL_LIMIT = 7;
const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationsQuery = useGetNotifications({
    query: { refetchInterval: POLL_INTERVAL_MS },
  });
  const openNotification = useOpenNotification();

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const panelItems = notifications.slice(0, PANEL_LIMIT);
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  function invalidateNotifications() {
    void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey() });
  }

  function handleSelectNotification(notification: Notification) {
    openNotification.mutate({ id: notification.id }, { onSuccess: invalidateNotifications });
    setOpen(false);
    router.push(`/corrections/${notification.correctionHumanId ?? ""}`);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label="Уведомления"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
          >
            {badgeLabel}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup className="w-80 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <div className="pb-2">
              <span className="text-sm font-semibold">
                Уведомления{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </span>
            </div>
            {panelItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Новых уведомлений нет</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {panelItems.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectNotification(notification)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-md p-2 text-left text-sm hover:bg-muted",
                        !notification.isRead && "font-bold",
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {formatNotificationDateTime(notification.createdAt)}
                      </span>
                      <span>{notification.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/notifications"
              className="mt-2 flex min-h-6 items-center justify-center text-center text-xs font-medium text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              Все уведомления
            </Link>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
