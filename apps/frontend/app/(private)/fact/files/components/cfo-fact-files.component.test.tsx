import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CfoFactFiles } from "./cfo-fact-files";

const useGetFactPackagesMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useGetFactPackages: useGetFactPackagesMock,
	};
});

describe("<CfoFactFiles />", () => {
	it("показывает 4 карточки направлений", async () => {
		const view = await render(<CfoFactFiles />);

		await expect.element(view.getByText("Диагностическое обследование")).toBeVisible();
		await expect.element(view.getByText("Техническое обслуживание и ремонт")).toBeVisible();
		await expect.element(view.getByText("Капитальный ремонт — подрядный способ")).toBeVisible();
		await expect.element(view.getByText("Капитальный ремонт — хозяйственный способ")).toBeVisible();
	});

	it("по клику на карточку открывает список пакетов направления, назад возвращает к карточкам", async () => {
		useGetFactPackagesMock.mockReturnValue({ data: { items: [] } });
		const view = await render(<CfoFactFiles />);

		await view.getByText("Диагностическое обследование").click();

		await expect.element(view.getByText("Файлы — Диагностическое обследование")).toBeVisible();
		expect(useGetFactPackagesMock).toHaveBeenCalledWith({ params: { direction: "DO" } });

		await view.getByRole("button", { name: "← Все направления" }).click();

		await expect.element(view.getByText("Диагностическое обследование")).toBeVisible();
		await expect.element(view.getByText("Файлы — Диагностическое обследование")).not.toBeInTheDocument();
	});
});
