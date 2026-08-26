import {CalendarRange} from "lucide-react";

import {SectionPlaceholder} from "#/components/section-placeholder";

export default function PlanningPage() {
    return (
        <SectionPlaceholder
            icon={CalendarRange}
            title="План на 2027"
            description="Сводный пообъектный план ДТОиР на планируемый год: капитальный ремонт, техническое обслуживание и текущий ремонт, диагностическое обследование."
            documents={[
                {name: "Форма пообъектного плана ДТОиР (КР / ТОиТР / ДО)", reference: "Приложение Б.4"},
                {name: "Технические требования на проектирование", reference: "Приложение Б.5"},
                {name: "Акт обследования объекта основных фондов", reference: "Приложение Б.1"},
            ]}
        />
    );
}
