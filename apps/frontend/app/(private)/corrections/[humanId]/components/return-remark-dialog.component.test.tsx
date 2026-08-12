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
		await view.getByLabelText("Описание").fill("Нет счёта за март");
		await view.getByLabelText("Что исправить").fill("Приложить счёт за март");
		await view.getByRole("button", { name: "Вернуть на доработку" }).click();

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({ description: "Нет счёта за март", requiredAction: "Приложить счёт за март" }),
		);
	});
});
