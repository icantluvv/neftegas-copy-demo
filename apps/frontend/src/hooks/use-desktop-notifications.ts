"use client";

import { useEffect, useRef } from "react";

import type { Notification as AppNotification } from "@/packages/api/base/codegen";

const APP_TITLE = "Согласование корректировок";

function canUseDesktopNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Показывает системные (ОС) уведомления об уже опрошенных, но ранее не виденных
 * непрочитанных записях — работают, даже когда вкладка свёрнута или не в фокусе,
 * пока браузер с этой вкладкой открыт (опрос идёт фоново через refetchInterval).
 */
export function useDesktopNotifications(
  notifications: AppNotification[],
  onSelect: (notification: AppNotification) => void,
) {
  const seenIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!canUseDesktopNotifications()) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!canUseDesktopNotifications() || Notification.permission !== "granted") return;

    // Первый прогон после монтирования — не показывать как «новые» уже
    // существующие непрочитанные, только запомнить базовый набор id.
    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }

    const newlyArrived = notifications.filter((n) => !n.isRead && !seenIds.current!.has(n.id));
    for (const notification of newlyArrived) {
      const desktopNotification = new Notification(APP_TITLE, {
        body: notification.text,
        tag: `notification-${notification.id}`,
      });
      desktopNotification.onclick = () => {
        window.focus();
        onSelect(notification);
        desktopNotification.close();
      };
    }

    seenIds.current = new Set(notifications.map((n) => n.id));
  }, [notifications, onSelect]);
}
