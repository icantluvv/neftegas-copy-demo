import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { PlanDetail } from "@/packages/api/base/codegen";

import { PackageCompleteness } from "./package-completeness";

const useUploadPlanFileVersionMock = vi.hoisted(() => vi.fn());
const useLeavePlanRemarkMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useUploadPlanFileVersion: useUploadPlanFileVersionMock,
		useLeavePlanRemark: useLeavePlanRemarkMock,
	};
});

function makeDetail(overrides: Partial<PlanDetail> = {}): PlanDetail {
	return {
		id: 1,
		humanId: "PLN-000002",
		filialId: 1,
		planTypeId: 1,
		authorId: 5,
		status: "DRAFT",
		stageNote: "",
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
		slots: [
			{
				id: 10,
				planId: 1,
				requirementId: 1,
				label: "Excel плана",
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
		missingRequirements: ["Excel плана"],
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

function renderWithClient(detail: PlanDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<PackageCompleteness detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<PackageCompleteness />", () => {
	beforeEach(() => {
		useUploadPlanFileVersionMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		useLeavePlanRemarkMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("отображает слот, обязательность и проверяющий ЦФО", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByText("Excel плана")).toBeVisible();
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

	it("показывает «Оставить замечание к элементу» ЦФО, пока его статус PENDING", async () => {
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedBy: null, decidedAt: null },
			}),
		);

		await expect.element(view.getByRole("button", { name: "Оставить замечание к элементу" })).toBeVisible();
	});

	it("скрывает «Оставить замечание к элементу» филиалу", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true }));

		await expect
			.element(view.getByRole("button", { name: "Оставить замечание к элементу", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("отправляет relatedSlotId и slotId запроса при сохранении замечания", async () => {
		const mutate = vi.fn();
		useLeavePlanRemarkMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedBy: null, decidedAt: null },
			}),
		);

		await view.getByRole("button", { name: "Оставить замечание к элементу" }).click();
		await view.getByLabelText("Описание").fill("Не хватает раздела");
		await view.getByLabelText("Что исправить").fill("Добавить раздел");
		await view.getByRole("button", { name: "Сохранить замечание" }).click();

		expect(mutate).toHaveBeenCalledWith(
			expect.objectContaining({
				humanId: "PLN-000002",
				data: expect.objectContaining({ relatedSlotId: 10 }),
			}),
		);
	});

	it("не скрывает кнопку после уже оставленного замечания — можно оставить ещё одно за тот же заход", async () => {
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedBy: null, decidedAt: null },
				remarks: [
					{
						id: 1,
						humanId: "PLR-000001",
						planId: 1,
						cfoId: 2,
						authorId: 20,
						createdAt: "2027-01-01T00:00:00.000Z",
						relatedSlotId: 10,
						fileVersionId: null,
						sheetName: "",
						rowRef: "",
						cellRef: "",
						description: "Уже оставленное замечание",
						requiredAction: "Исправить",
						status: "OPEN",
						closedById: null,
						closedAt: null,
						issuerLabel: "ОГМ",
					},
				],
			}),
		);

		await expect.element(view.getByRole("button", { name: "Оставить замечание к элементу" })).toBeVisible();
	});

	it("скрывает кнопку по галочке «Проверено» и возвращает при снятии", async () => {
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				myCfoStatus: { id: 1, planId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING", isRequired: true, decidedById: null, decidedBy: null, decidedAt: null },
			}),
		);

		const checkbox = view.getByRole("checkbox", { name: /Excel плана/ });
		await expect.element(view.getByRole("button", { name: "Оставить замечание к элементу" })).toBeVisible();

		await checkbox.click();
		await expect
			.element(view.getByRole("button", { name: "Оставить замечание к элементу", includeHidden: true }))
			.not.toBeInTheDocument();

		await checkbox.click();
		await expect.element(view.getByRole("button", { name: "Оставить замечание к элементу" })).toBeVisible();
	});

	it("скрывает столбец «Проверено» для филиала", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true, isCfoReviewer: false, isDtoe: false }));

		await expect.element(view.getByText("Проверено", { exact: true })).not.toBeInTheDocument();
	});
});
