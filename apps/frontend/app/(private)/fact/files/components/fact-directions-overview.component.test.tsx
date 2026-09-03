import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { FactDirectionsOverview } from "./fact-directions-overview";

const useCreateFactPackageMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useCreateFactPackage: useCreateFactPackageMock,
	};
});

describe("<FactDirectionsOverview />", () => {
	it("показывает 4 карточки направлений как точку входа для создания нового пакета", async () => {
		useCreateFactPackageMock.mockReturnValue({ mutate: vi.fn(), isPending: false });

		const view = await render(<FactDirectionsOverview />);

		await expect.element(view.getByText("Диагностическое обследование")).toBeVisible();
		await expect.element(view.getByText("Техническое обслуживание и ремонт")).toBeVisible();
		await expect.element(view.getByText("Капитальный ремонт — подрядный способ")).toBeVisible();
		await expect.element(view.getByText("Капитальный ремонт — хозяйственный способ")).toBeVisible();
		await expect.element(view.getByRole("button", { name: /Создать новый пакет/ }).first()).toBeVisible();
	});
});
