import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
	return {
		id: 1,
		humanId: "COR-000002",
		filialId: 1,
		cfoId: null,
		correctionTypeId: 1,
		authorId: 5,
		status: "DRAFT",
		stageNote: "Пакет собирается филиалом",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSend: true,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		cfo: null,
		correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
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
		isCfoOwner: false,
		isCfoReviewer: false,
		isDtoe: false,
		availableCfos: [],
		returnedCfos: [],
		...overrides,
	};
}

const useGetCorrectionSuspenseMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, useGetCorrectionSuspense: useGetCorrectionSuspenseMock };
});

const { CorrectionDetailView } = await import("./correction-detail-view");

describe("<CorrectionDetailView />", () => {
	it("компонует все блоки карточки из одного запроса детали", async () => {
		useGetCorrectionSuspenseMock.mockReturnValue({ data: makeDetail() });
		const queryClient = new QueryClient();

		const view = await render(
			<QueryClientProvider client={queryClient}>
				<CorrectionDetailView humanId="COR-000002" currentUserId={5} />
			</QueryClientProvider>,
		);

		await expect.element(view.getByText("COR-000002")).toBeVisible();
		await expect.element(view.getByText("Комплектность пакета")).toBeVisible();
		await expect.element(view.getByText("Замечания")).toBeVisible();
		await expect.element(view.getByText("История действий")).toBeVisible();
	});
});
