import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { FactPackagesReviewList } from "./fact-packages-review-list";

const useGetFactPackagesMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useGetFactPackages: useGetFactPackagesMock,
	};
});

describe("<FactPackagesReviewList />", () => {
	it("показывает строки со ссылкой на пакет, филиалом, направлением и статусом", async () => {
		useGetFactPackagesMock.mockReturnValue({
			data: {
				items: [
					{
						id: 1,
						humanId: "FCT-000010",
						filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
						direction: "TOIR",
						status: "UNDER_CFO_REVIEW",
					},
				],
			},
		});

		const view = await render(<FactPackagesReviewList />);

		await expect.element(view.getByRole("link", { name: "FCT-000010" })).toBeVisible();
		await expect.element(view.getByText("Черноморнефтегаз")).toBeVisible();
		await expect.element(view.getByText("Техническое обслуживание и ремонт")).toBeVisible();
	});

	it("показывает пустое состояние при отсутствии пакетов", async () => {
		useGetFactPackagesMock.mockReturnValue({ data: { items: [] } });

		const view = await render(<FactPackagesReviewList />);

		await expect.element(view.getByText("Нет факт-пакетов")).toBeVisible();
	});

	it("передаёт direction в запрос и показывает его в заголовке с кнопкой назад", async () => {
		useGetFactPackagesMock.mockReturnValue({ data: { items: [] } });
		const onBack = vi.fn();

		const view = await render(<FactPackagesReviewList direction="KR_HS" onBack={onBack} />);

		expect(useGetFactPackagesMock).toHaveBeenCalledWith({ params: { direction: "KR_HS" } });
		await expect.element(view.getByText("Файлы — Капитальный ремонт — хозяйственный способ")).toBeVisible();

		await view.getByRole("button", { name: "← Все направления" }).click();
		expect(onBack).toHaveBeenCalled();
	});
});
