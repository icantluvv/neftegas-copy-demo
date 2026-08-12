"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  getNotificationsQueryKey,
  useGetNotifications,
  useMarkAllNotificationsRead,
  useOpenNotification,
  type Notification,
} from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";
import { formatNotificationDateTime } from "#/utils/format-notification-date-time";

export function NotificationsTable() {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationsQuery = useGetNotifications();
  const openNotification = useOpenNotification();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data ?? [];
  const visibleNotifications = onlyUnread ? notifications.filter((n) => !n.isRead) : notifications;

  function invalidateNotifications() {
    void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey() });
  }

  function handleOpen(notification: Notification) {
    openNotification.mutate({ id: notification.id }, { onSuccess: invalidateNotifications });
    router.push(`/corrections/${notification.correctionHumanId ?? ""}`);
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, { onSuccess: invalidateNotifications });
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Уведомления</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              role="checkbox"
              aria-label="Только непрочитанные"
              className="size-6"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
            />
            Только непрочитанные
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-12"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
          >
            Отметить все прочитанными
          </Button>
        </div>
      </div>

      {visibleNotifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Уведомлений нет</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="w-48 py-2 font-medium">Дата</th>
              <th className="py-2 font-medium">Сообщение</th>
              <th className="w-24 py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleNotifications.map((notification) => (
              <tr
                key={notification.id}
                className={cn("border-b border-border", !notification.isRead && "font-bold")}
              >
                <td className="py-3 align-top text-muted-foreground">
                  {formatNotificationDateTime(notification.createdAt)}
                </td>
                <td className="py-3 align-top">{notification.text}</td>
                <td className="py-3 text-right align-top">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleOpen(notification)}>
                    Открыть
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
