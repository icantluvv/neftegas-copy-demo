import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { FactDirectionsOverview } from "./fact-directions-overview";

const useGetOrCreateFactPackageByDirectionMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useGetOrCreateFactPackageByDirection: useGetOrCreateFactPackageByDirectionMock,
	};
});

describe("<FactDirectionsOverview />", () => {
	it("показывает 4 карточки направлений со ссылкой на пакет, без статуса", async () => {
		useGetOrCreateFactPackageByDirectionMock.mockImplementation(({ direction }: { direction: string }) => ({
			isPending: false,
			isError: false,
			data: { humanId: `FCT-${direction}`, status: "DRAFT" },
		}));

		const view = await render(<FactDirectionsOverview />);

		await expect.element(view.getByText("Диагностическое обследование")).toBeVisible();
		await expect.element(view.getByText("Техническое обслуживание и ремонт")).toBeVisible();
		await expect.element(view.getByText("Капитальный ремонт — подрядный способ")).toBeVisible();
		await expect.element(view.getByText("Капитальный ремонт — хозяйственный способ")).toBeVisible();
		await expect.element(view.getByRole("link", { name: /FCT-DO/ })).toBeVisible();
	});

	it("показывает состояние ошибки для направления, если запрос упал", async () => {
		useGetOrCreateFactPackageByDirectionMock.mockImplementation(({ direction }: { direction: string }) => {
			if (direction === "KR_HS") {
				return { isPending: false, isError: true, data: undefined };
			}
			return { isPending: false, isError: false, data: { humanId: `FCT-${direction}`, status: "DRAFT" } };
		});

		const view = await render(<FactDirectionsOverview />);

		await expect.element(view.getByText("Не удалось загрузить")).toBeVisible();
	});
});
