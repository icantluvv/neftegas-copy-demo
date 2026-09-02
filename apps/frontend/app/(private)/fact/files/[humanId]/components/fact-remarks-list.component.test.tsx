import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactRemarksList } from "./fact-remarks-list";

const useFixFactPackageRemarkMock = vi.hoisted(() => vi.fn());
const useDeleteFactPackageRemarkMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useFixFactPackageRemark: useFixFactPackageRemarkMock,
		useDeleteFactPackageRemark: useDeleteFactPackageRemarkMock,
	};
});

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000005",
		filialId: 1,
		direction: "DO",
		authorId: 5,
		status: "RETURNED_FOR_REVISION",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSubmit: true,
		canSendToDtoe: false,
		openRemarksCount: 1,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		forms: [{ id: 10, factPackageId: 1, code: "ACT_WORK", label: "Акт выполненных работ", isFilled: false, currentVersion: null }],
		cfoStatuses: [],
		remarks: [
			{
				id: 1,
				humanId: "FCT-REM-000001",
				factPackageId: 1,
				cfoId: 2,
				relatedFormId: 10,
				authorId: 20,
				createdAt: "2026-08-01T00:00:00.000Z",
				description: "Нет акта за март",
				requiredAction: "Приложить акт за март",
				status: "OPEN",
				closedAt: null,
				issuerLabel: "ОГМ",
			},
		],
		history: [],
		packageComplete: false,
		missingForms: ["Акт выполненных работ"],
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

function renderWithClient(detail: FactPackageDetail, currentUserId: number) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<FactRemarksList detail={detail} currentUserId={currentUserId} />
		</QueryClientProvider>,
	);
}

describe("<FactRemarksList />", () => {
	beforeEach(() => {
		useFixFactPackageRemarkMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		useDeleteFactPackageRemarkMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("отображает строку замечания с формой, отправителем, описанием и статусом", async () => {
		const view = await renderWithClient(makeDetail(), 5);

		await expect.element(view.getByText("FCT-REM-000001")).toBeVisible();
		await expect.element(view.getByText("Акт выполненных работ")).toBeVisible();
		await expect.element(view.getByText("ОГМ")).toBeVisible();
		await expect.element(view.getByText("Нет акта за март")).toBeVisible();
	});

	it("показывает «Отметить исправленным» филиалу-владельцу для открытого замечания", async () => {
		const view = await renderWithClient(makeDetail(), 5);

		await expect.element(view.getByRole("button", { name: "Отметить исправленным" })).toBeVisible();
	});

	it("скрывает «Отметить исправленным» не-владельцу", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false }), 5);

		await expect
			.element(view.getByRole("button", { name: "Отметить исправленным", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("показывает «Удалить» только автору замечания и вызывает мутацию с remarkId", async () => {
		const mutate = vi.fn();
		useDeleteFactPackageRemarkMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(makeDetail(), 20);

		await view.getByRole("button", { name: "Удалить" }).click();

		expect(mutate).toHaveBeenCalledWith({ humanId: "FCT-000005", remarkId: 1 });
	});

	it("скрывает «Удалить» для не-автора замечания", async () => {
		const view = await renderWithClient(makeDetail(), 999);

		await expect
			.element(view.getByRole("button", { name: "Удалить", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("скрывает обе кнопки для замечания в статусе CLOSED", async () => {
		const view = await renderWithClient(
			makeDetail({
				remarks: [
					{
						id: 1,
						humanId: "FCT-REM-000001",
						factPackageId: 1,
						cfoId: 2,
						relatedFormId: 10,
						authorId: 20,
						createdAt: "2026-08-01T00:00:00.000Z",
						description: "Нет акта за март",
						requiredAction: "Приложить акт за март",
						status: "CLOSED",
						closedAt: "2026-08-02T00:00:00.000Z",
						issuerLabel: "ОГМ",
					},
				],
			}),
			20,
		);

		await expect
			.element(view.getByRole("button", { name: "Отметить исправленным", includeHidden: true }))
			.not.toBeInTheDocument();
		await expect.element(view.getByRole("button", { name: "Удалить", includeHidden: true })).not.toBeInTheDocument();
	});

	it("показывает «Замечаний нет» при пустом списке", async () => {
		const view = await renderWithClient(makeDetail({ remarks: [] }), 5);

		await expect.element(view.getByText("Замечаний нет")).toBeVisible();
	});
});
