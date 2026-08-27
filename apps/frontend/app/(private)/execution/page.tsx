import {PlayCircle} from "lucide-react";

import {SectionPlaceholder} from "#/components/section-placeholder";

export default function ExecutionPage() {
    return (
        <SectionPlaceholder
            icon={PlayCircle}
            title="Выполнение"
            description="Мониторинг хода производства работ по объектам плана: допуск, план-графики, приёмка."
            documents={[
                {name: "Акт вывода объекта из эксплуатации в ремонт", reference: "Приложение Б.13"},
                {name: "Еженедельная сводка по выполнению программы ДТОиР", reference: "Приложение Г"},
                {name: "Акт приёмки объекта в эксплуатацию после капитального ремонта", reference: "Приложение Б.8"},
                {name: "Акт о выявлении недостатков в гарантийный период", reference: "Приложение Б.9"},
            ]}
        />
    );
}
