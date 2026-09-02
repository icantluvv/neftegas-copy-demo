import {CalendarRange} from "lucide-react";
import {describe, expect, it} from "vitest";
import {render} from "vitest-browser-react";

import {SectionPlaceholder} from "./section-placeholder";

describe("<SectionPlaceholder />", () => {
    it("отображает заголовок, описание и список форм документов", async () => {
        const view = await render(
            <SectionPlaceholder
                icon={CalendarRange}
                title="План на 2027"
                description="Годовое планирование ДТОиР"
                documents={[{name: "Форма пообъектного плана ДТОиР", reference: "Приложение Б.4"}]}
            />
        );

        await expect.element(view.getByText("План на 2027")).toBeVisible();
        await expect.element(view.getByText("Форма пообъектного плана ДТОиР")).toBeVisible();
        await expect.element(view.getByText("Приложение Б.4")).toBeVisible();
    });

    it("без documents не показывает блок форм документов", async () => {
        const view = await render(
            <SectionPlaceholder icon={CalendarRange} title="Файлы" description="Архив документов раздела."/>
        );

        await expect.element(view.getByText("Файлы")).toBeVisible();
        await expect.element(view.getByText("Формы документов раздела")).not.toBeInTheDocument();
    });
});
