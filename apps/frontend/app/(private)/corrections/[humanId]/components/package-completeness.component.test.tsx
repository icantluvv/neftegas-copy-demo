import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

import { PackageCompleteness } from "./package-completeness";

const useUploadFileVersionMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useUploadFileVersion: useUploadFileVersionMock,
	};
});

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
	return {
		id: 1,
		humanId: "COR-000002",
		filialId: 1,
		correctionTypeId: 1,
		authorId: 5,
		status: "DRAFT",
		stageNote: "",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSend: true,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		slots: [
			{
				id: 10,
				correctionId: 1,
				requirementId: 1,
				label: "Excel корректировка",
				isFilled: false,
				isRequired: true,
				responsibleCfo: null,
				currentVersion: null,
			},
		],
		cfoStatuses: [],
		remarks: [],
		history: [],
		packageComplete: false,
		missingRequirements: ["Excel корректировка"],
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

function renderWithClient(detail: CorrectionDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<PackageCompleteness detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<PackageCompleteness />", () => {
	beforeEach(() => {
		useUploadFileVersionMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("отображает слот, обязательность и проверяющий ЦФО", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByText("Excel корректировка")).toBeVisible();
		await expect.element(view.getByText("Да")).toBeVisible();
		await expect.element(view.getByText("Все ЦФО маршрута")).toBeVisible();
		await expect.element(view.getByText("Нет версий")).toBeVisible();
	});

	it("показывает кнопку загрузки версии филиалу-автору до APPROVED_BY_DTOE", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true, status: "UNDER_CFO_REVIEW" }));

		await expect.element(view.getByRole("button", { name: "Загрузить версию" })).toBeVisible();
	});

	it("скрывает кнопку загрузки после APPROVED_BY_DTOE", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true, status: "APPROVED_BY_DTOE" }));

		await expect
			.element(view.getByRole("button", { name: "Загрузить версию", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("скрывает кнопку загрузки для роли ЦФО", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false, isCfoReviewer: true }));

		await expect
			.element(view.getByRole("button", { name: "Загрузить версию", includeHidden: true }))
			.not.toBeInTheDocument();
	});
});
