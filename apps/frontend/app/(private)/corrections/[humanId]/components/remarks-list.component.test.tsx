import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail, Remark } from "@/packages/api/base/codegen";

const mutationMocks = vi.hoisted(() => ({
	useApproveCorrectionByCfo: vi.fn(),
	useApproveCorrectionByDtoe: vi.fn(),
	useDeleteRemark: vi.fn(),
	useMarkRemarkFixed: vi.fn(),
	useReturnCorrectionByCfo: vi.fn(),
	useReturnCorrectionByDtoe: vi.fn(),
	useSendCorrectionToDtoe: vi.fn(),
}));

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, ...mutationMocks };
});

const { RemarksList } = await import("./remarks-list");

function makeRemark(overrides: Partial<Remark> = {}): Remark {
	return {
		id: 1,
		humanId: "REM-000001",
		correctionId: 1,
		cfoId: 2,
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
		correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		slots: [
			{ id: 10, correctionId: 1, requirementId: 1, label: "Счета на оплату", isFilled: true, isRequired: true, responsibleCfo: null, currentVersion: null },
		],
		cfoStatuses: [],
		remarks: [makeRemark()],
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

function renderWithClient(detail: CorrectionDetail, currentUserId = 5) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<RemarksList detail={detail} currentUserId={currentUserId} />
		</QueryClientProvider>,
	);
}

describe("<RemarksList />", () => {
	beforeEach(() => {
		for (const mock of Object.values(mutationMocks)) {
			mock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		}
	});

	it("отображает элемент пакета, от кого, описание и статус замечания", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByText("Счета на оплату")).toBeVisible();
		await expect.element(view.getByText("ОГМ")).toBeVisible();
		await expect.element(view.getByText("Нет счёта за март")).toBeVisible();
		await expect.element(view.getByText("Открыто")).toBeVisible();
	});

	it("показывает «Отметить исправленным» филиалу для своего OPEN-замечания", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true }));

		await expect.element(view.getByRole("button", { name: "Отметить исправленным" })).toBeVisible();
	});

	it("скрывает «Отметить исправленным» для CLOSED-замечания", async () => {
		const view = await renderWithClient(
			makeDetail({ isFilialOwner: true, remarks: [makeRemark({ status: "CLOSED" })] }),
		);

		await expect
			.element(view.getByRole("button", { name: "Отметить исправленным", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("показывает «Удалить» только автору собственного OPEN-замечания", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false }), 20);

		await expect.element(view.getByRole("button", { name: "Удалить" })).toBeVisible();
	});

	it("скрывает «Удалить» для чужого замечания", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false }), 999);

		await expect
			.element(view.getByRole("button", { name: "Удалить", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("показывает «Согласовать» ЦФО, когда его статус PENDING", async () => {
		const view = await renderWithClient(
			makeDetail({
				isCfoReviewer: true,
				isFilialOwner: false,
				myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedBy: null, decidedAt: null },
			}),
		);

		await expect.element(view.getByRole("button", { name: "Согласовать" })).toBeVisible();
	});

	it("показывает «Направить в ДТОиР», когда статус ALL_CFO_APPROVED и мой ЦФО согласовал", async () => {
		const view = await renderWithClient(
			makeDetail({
				status: "ALL_CFO_APPROVED",
				isCfoReviewer: true,
				isFilialOwner: false,
				myCfoStatus: { id: 1, correctionId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED", isRequired: true, decidedById: 9, decidedBy: null, decidedAt: "2026-08-01T00:00:00.000Z" },
			}),
		);

		await expect.element(view.getByRole("button", { name: "Направить в ДТОиР" })).toBeVisible();
	});
});
