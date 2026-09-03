import {Bell} from "lucide-react";

import {SectionPlaceholder} from "#/components/section-placeholder";

export default function ExecutionNotificationsPage() {
    return (
        <SectionPlaceholder
            icon={Bell}
            title="Уведомления"
            description="Уведомления модуля «Выполнение»."
        />
    );
}
