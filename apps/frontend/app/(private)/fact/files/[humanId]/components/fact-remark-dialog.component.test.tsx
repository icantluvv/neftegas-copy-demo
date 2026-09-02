import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { FactRemarkDialog } from "./fact-remark-dialog";

describe("<FactRemarkDialog />", () => {
	it("отображает триггер с переданным текстом", async () => {
		const view = await render(
			<FactRemarkDialog
				triggerLabel="Замечание"
				dialogTitle="Замечание к форме"
				submitLabel="Сохранить и вернуть на доработку"
				isSubmitting={false}
				onSubmit={vi.fn()}
				formId={3}
			/>,
		);

		await expect.element(view.getByRole("button", { name: "Замечание" })).toBeVisible();
	});

	it("открывает форму по клику и отправляет данные с привязкой к переданной форме", async () => {
		const onSubmit = vi.fn();
		const view = await render(
			<FactRemarkDialog
				triggerLabel="Замечание"
				dialogTitle="Замечание к форме"
				submitLabel="Сохранить и вернуть на доработку"
				isSubmitting={false}
				onSubmit={onSubmit}
				formId={3}
			/>,
		);

		await view.getByRole("button", { name: "Замечание" }).click();
		await view.getByLabelText("Описание").fill("Нет подписи в акте");
		await view.getByLabelText("Что исправить").fill("Приложить подписанный акт");
		await view.getByRole("button", { name: "Сохранить и вернуть на доработку" }).click();

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				description: "Нет подписи в акте",
				requiredAction: "Приложить подписанный акт",
				relatedFormId: 3,
			}),
		);
	});
});
