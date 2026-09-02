"use client";

import {Popover} from "@base-ui/react/popover";
import {Bell} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useState} from "react";

import {cn} from "@/lib/utils";
import {type Notification, useGetNotifications} from "@/packages/api/base/codegen";

import {buttonVariants} from "#/components/ui/button";
import {useDesktopNotifications} from "#/hooks/use-desktop-notifications";
import {useMarkCorrectionNotificationsRead} from "#/hooks/use-mark-correction-notifications-read";
import {useMarkFactPackageNotificationsRead} from "#/hooks/use-mark-fact-package-notifications-read";

import {NotificationPanelList} from "./notification-panel-list";

const PANEL_LIMIT = 7;
const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const notificationsQuery = useGetNotifications({
        query: {refetchInterval: POLL_INTERVAL_MS},
    });
    const markCorrectionRead = useMarkCorrectionNotificationsRead();
    const markFactPackageRead = useMarkFactPackageNotificationsRead();

    const notifications = notificationsQuery.data ?? [];
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const panelItems = notifications.slice(0, PANEL_LIMIT);
    const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

    /**
     * Уведомление относится либо к корректировке, либо к факт-пакету (ровно
     * одно из полей заполнено). Для корректировки — переход на карточку, как
     * раньше. Для факт-пакета отдельной карточки по humanId в UI ещё нет
     * (см. модуль «Факт» → «Файлы» — экран по направлениям, не по ID пакета),
     * поэтому пока только помечаем прочитанным без перехода.
     */
    const handleSelectNotification = useCallback(
        (notification: Notification) => {
            setOpen(false);
            if (notification.correctionId != null) {
                markCorrectionRead(notification.correctionId);
                router.push(`/corrections/${notification.correctionHumanId ?? ""}`);
            } else if (notification.factPackageId != null) {
                markFactPackageRead(notification.factPackageId);
            }
        },
        [markCorrectionRead, markFactPackageRead, router],
    );

    useDesktopNotifications(notifications, handleSelectNotification);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
                aria-label="Уведомления"
                className={cn(buttonVariants({variant: "ghost", size: 'icon-lg'}), "relative size-12")}
            >
                <Bell className="size-5"/>
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
                    <Popover.Popup
                        className="w-80 overflow-hidden m-4 rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg">
                        <div className="px-4 mt-4 pb-2 border-border border-b">
                            <span className="text-sm font-semibold">Уведомления</span>
                        </div>
                        <NotificationPanelList notifications={panelItems} onSelect={handleSelectNotification}/>
                     <div className='border-t  border-border'>
                        <Link
                            href="/notifications"
                            className={cn(buttonVariants({variant: 'ghost'}), "rounded-none  min-h-12 w-full")}
                            onClick={() => setOpen(false)}
                        >
                            Все уведомления
                        </Link>
                     </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
