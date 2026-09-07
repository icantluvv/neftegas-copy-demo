import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { PlanDetail } from "@/packages/api/base/codegen";

function makeDetail(overrides: Partial<PlanDetail> = {}): PlanDetail {
	return {
		id: 1,
		humanId: "PLN-000002",
		filialId: 1,
		planTypeId: 1,
		authorId: 5,
		status: "DRAFT",
		stageNote: "Пакет собирается филиалом",
		createdAt: "2027-01-01T00:00:00.000Z",
		updatedAt: "2027-01-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSend: true,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		planType: { id: 1, code: "DTOIR_2027", name: "План на 2027", isActive: true },
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		slots: [],
		cfoStatuses: [],
		remarks: [],
		history: [],
		packageComplete: true,
		missingRequirements: [],
		myCfoStatus: null,
		myOpenRemarksCount: 0,
		isFilialOwner: true,
		isCfoReviewer: false,
		isDtoe: false,
		availableCfos: [],
		returnedCfos: [],
		...overrides,
	};
}

const useGetPlanSuspenseMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, useGetPlanSuspense: useGetPlanSuspenseMock };
});

const { PlanDetailView } = await import("./plan-detail-view");

describe("<PlanDetailView />", () => {
	it("компонует все блоки карточки из одного запроса детали", async () => {
		useGetPlanSuspenseMock.mockReturnValue({ data: makeDetail() });
		const queryClient = new QueryClient();

		const view = await render(
			<QueryClientProvider client={queryClient}>
				<PlanDetailView humanId="PLN-000002" currentUserId={5} />
			</QueryClientProvider>,
		);

		await expect.element(view.getByText("PLN-000002")).toBeVisible();
		await expect.element(view.getByText("Комплектность пакета")).toBeVisible();
		await expect.element(view.getByText("Замечания")).toBeVisible();
		await expect.element(view.getByText("История действий")).toBeVisible();
	});
});
