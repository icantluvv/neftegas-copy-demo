import {ClipboardCheck} from "lucide-react";

import {SectionPlaceholder} from "#/components/section-placeholder";

export default function FactPage() {
    return (
        <SectionPlaceholder
            icon={ClipboardCheck}
            title="Факт"
            description="Отчётность о фактическом выполнении программы ДТОиР: план/факт по объёмам, стоимости и срокам, отклонения."
            documents={[
                {name: "Сводный отчёт о выполнении пообъектного плана ДТОиР (ДТОиР-Отчёт-1)", reference: "Приложение Б.10"},
                {name: "Сводный отчёт о выполнении плана обеспечения МТР", reference: "Приложение Б.14"},
                {name: "Пояснительная записка к сводному отчёту", reference: "п. 13.3.2 Регламента"},
            ]}
        />
    );
}
