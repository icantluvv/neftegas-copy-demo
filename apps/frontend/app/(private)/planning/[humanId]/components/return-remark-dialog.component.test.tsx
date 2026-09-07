import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ReturnRemarkDialog } from "./return-remark-dialog";

describe("<ReturnRemarkDialog />", () => {
	it("отображает триггер с переданным текстом", async () => {
		const view = await render(
			<ReturnRemarkDialog triggerLabel="Вернуть на доработку" isSubmitting={false} onSubmit={vi.fn()} />,
		);

		await expect.element(view.getByRole("button", { name: "Вернуть на доработку" })).toBeVisible();
	});

	it("открывает форму по клику и отправляет данные", async () => {
		const onSubmit = vi.fn();
		const view = await render(
			<ReturnRemarkDialog triggerLabel="Вернуть на доработку" isSubmitting={false} onSubmit={onSubmit} />,
		);

		await view.getByRole("button", { name: "Вернуть на доработку" }).click();
		await view.getByLabelText("Описание").fill("Нет плана-графика на март");
		await view.getByLabelText("Что исправить").fill("Приложить план-график");
		await view.getByRole("button", { name: "Вернуть на доработку" }).click();

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({ description: "Нет плана-графика на март", requiredAction: "Приложить план-график" }),
		);
	});

	it("привязывает замечание к переданному слоту и подставляет его название в заголовок", async () => {
		const onSubmit = vi.fn();
		const view = await render(
			<ReturnRemarkDialog
				triggerLabel="Оставить замечание к элементу"
				isSubmitting={false}
				onSubmit={onSubmit}
				slotId={10}
				slotLabel="Excel плана"
			/>,
		);

		await view.getByRole("button", { name: "Оставить замечание к элементу" }).click();
		await expect.element(view.getByText("Замечание к элементу: Excel плана")).toBeVisible();

		await view.getByLabelText("Описание").fill("Не хватает раздела");
		await view.getByLabelText("Что исправить").fill("Добавить раздел");
		await view.getByRole("button", { name: "Сохранить замечание" }).click();

		expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ relatedSlotId: 10 }));
	});
});
