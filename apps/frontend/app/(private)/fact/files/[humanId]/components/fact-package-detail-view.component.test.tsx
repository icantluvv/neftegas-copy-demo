import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000007",
		filialId: 1,
		direction: "DO",
		authorId: 5,
		status: "DRAFT",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSubmit: false,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		forms: [],
		cfoStatuses: [],
		remarks: [],
		history: [],
		packageComplete: true,
		missingForms: [],
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

const useGetFactPackageSuspenseMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, useGetFactPackageSuspense: useGetFactPackageSuspenseMock };
});

const { FactPackageDetailView } = await import("./fact-package-detail-view");

describe("<FactPackageDetailView />", () => {
	it("компонует все блоки карточки из одного запроса детали", async () => {
		useGetFactPackageSuspenseMock.mockReturnValue({ data: makeDetail() });
		const queryClient = new QueryClient();

		const view = await render(
			<QueryClientProvider client={queryClient}>
				<FactPackageDetailView humanId="FCT-000007" currentUserId={5} />
			</QueryClientProvider>,
		);

		await expect.element(view.getByText("FCT-000007")).toBeVisible();
		await expect.element(view.getByText("Замечания")).toBeVisible();
		await expect.element(view.getByText("История действий")).toBeVisible();
	});
});
