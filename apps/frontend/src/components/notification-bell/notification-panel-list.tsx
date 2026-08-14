import {cn} from "@/lib/utils";
import type {Notification} from "@/packages/api/base/codegen";

import {Button} from "#/components/ui/button";
import {formatNotificationDateTime} from "#/utils/format-notification-date-time";

type NotificationPanelListProps = {
    notifications: Notification[];
    onSelect: (notification: Notification) => void;
};

export function NotificationPanelList({notifications, onSelect}: NotificationPanelListProps) {
    if (notifications.length === 0) {
        return <p className="py-4 text-center text-sm text-muted-foreground">Новых уведомлений нет</p>;
    }

    return (
        <ul className="flex flex-col gap-1 max-h-100 overflow-y-auto">
            {notifications.map((notification) => (
                <li key={notification.id}>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onSelect(notification)}
                        className={cn(
                            "h-auto w-full flex-col items-start justify-start gap-0.5 p-4 text-left font-normal whitespace-normal",
                            !notification.isRead && "font-bold",
                        )}
                    >
                        <span className="text-xs text-muted-foreground">
                            {formatNotificationDateTime(notification.createdAt)}
                        </span>
                        <span>{notification.text}</span>
                    </Button>
                </li>
            ))}
        </ul>
    );
}
