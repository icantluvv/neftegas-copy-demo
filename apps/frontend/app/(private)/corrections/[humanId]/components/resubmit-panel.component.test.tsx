import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";

const mutationMocks = vi.hoisted(() => ({
	useResubmitCorrection: vi.fn(),
	useResubmitCorrectionToDtoe: vi.fn(),
}));

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, ...mutationMocks };
});

const { ResubmitPanel } = await import("./resubmit-panel");

function makeRemark(overrides: Partial<Remark> = {}): Remark {
	return {
		id: 1,
		humanId: "REM-000001",
		correctionId: 1,
		cfoId: 3,
		authorId: 20,
		createdAt: "2026-08-01T00:00:00.000Z",
		relatedSlotId: 10,
		fileVersionId: null,
		sheetName: "",
		rowRef: "",
		cellRef: "",
		description: "Нет счёта за март",
		requiredAction: "Приложить счёт за март",
		status: "OPEN",
		closedById: null,
		closedAt: null,
		issuerLabel: "ОГМ",
		...overrides,
	};
}

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
	return {
		id: 1,
		humanId: "COR-000002",
		filialId: 1,
		cfoId: null,
		correctionTypeId: 1,
		authorId: 5,
		status: "RETURNED_FOR_REVISION",
		stageNote: "",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSend: false,
		canSendToDtoe: false,
		openRemarksCount: 1,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		cfo: null,
		correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		slots: [],
		cfoStatuses: [],
		remarks: [makeRemark()],
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
		returnedCfos: [{ id: 3, code: "ОГМ", name: "ОГМ", isActive: true }],
		...overrides,
	};
}

function renderWithClient(detail: CorrectionDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<ResubmitPanel detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<ResubmitPanel />", () => {
	beforeEach(() => {
		for (const mock of Object.values(mutationMocks)) {
			mock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		}
	});

	it("не отображает блок, если ни один ЦФО не возвращал пакет", async () => {
		const view = await renderWithClient(makeDetail({ returnedCfos: [] }));

		await expect.element(view.getByText("Повторное направление", { exact: true })).not.toBeInTheDocument();
	});

	it("показывает список вернувших ЦФО и неактивную кнопку, пока не выбран чекбокс", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByText("ОГМ")).toBeVisible();
		await expect.element(view.getByRole("button", { name: "Перенаправить" })).toBeDisabled();
	});

	it("оставляет кнопку неактивной, пока остались открытые замечания выбранного ЦФО", async () => {
		const view = await renderWithClient(makeDetail());

		await view.getByRole("checkbox").click();

		await expect.element(view.getByRole("button", { name: "Перенаправить" })).toBeDisabled();
	});

	it("активирует кнопку, когда все замечания выбранного ЦФО исправлены", async () => {
		const view = await renderWithClient(makeDetail({ remarks: [makeRemark({ status: "FIXED_BY_FILIAL" })] }));

		await view.getByRole("checkbox").click();

		await expect.element(view.getByRole("button", { name: "Перенаправить" })).toBeEnabled();
	});

	it("показывает кнопку повторного направления в ДТОиР при RETURNED_BY_DTOE", async () => {
		const view = await renderWithClient(
			makeDetail({
				status: "RETURNED_BY_DTOE",
				returnedCfos: [],
				remarks: [makeRemark({ cfoId: null, status: "OPEN" })],
			}),
		);

		await expect
			.element(view.getByRole("button", { name: "Повторно направить в ДТОиР" }))
			.toBeDisabled();
	});
});
