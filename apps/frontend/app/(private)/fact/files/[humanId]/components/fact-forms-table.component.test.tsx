import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactFormsTable } from "./fact-forms-table";

const useUploadFactFormVersionMock = vi.hoisted(() => vi.fn());
const useLeaveFactPackageRemarkMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useUploadFactFormVersion: useUploadFactFormVersionMock,
		useLeaveFactPackageRemark: useLeaveFactPackageRemarkMock,
	};
});

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000002",
		filialId: 1,
		cfoId: null,
		direction: "DO",
		authorId: 5,
		status: "DRAFT",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSubmit: true,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		cfo: null,
		author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
		forms: [
			{
				id: 10,
				factPackageId: 1,
				code: "ACT_WORK",
				label: "Акт выполненных работ",
				isFilled: false,
				currentVersion: null,
			},
		],
		cfoStatuses: [],
		remarks: [],
		history: [],
		packageComplete: false,
		missingForms: ["Акт выполненных работ"],
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

function renderWithClient(detail: FactPackageDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<FactFormsTable detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<FactFormsTable />", () => {
	beforeEach(() => {
		useUploadFactFormVersionMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		useLeaveFactPackageRemarkMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("отображает форму, её статус заполненности и предупреждение о неполном пакете", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByRole("cell", { name: "Акт выполненных работ" })).toBeVisible();
		await expect.element(view.getByText("Не загружена")).toBeVisible();
		await expect.element(view.getByText("Нет версий")).toBeVisible();
		await expect.element(view.getByText("Не укомплектовано")).toBeVisible();
	});

	it("скрывает предупреждение о неполном пакете, когда все формы загружены", async () => {
		const view = await renderWithClient(makeDetail({ packageComplete: true, missingForms: [] }));

		await expect.element(view.getByText("Не укомплектовано")).not.toBeInTheDocument();
	});

	it("показывает кнопку «Загрузить версию» владельцу-филиалу вне финального статуса", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true, status: "DRAFT" }));

		await expect.element(view.getByRole("button", { name: "Загрузить версию" })).toBeVisible();
	});

	it("скрывает кнопку «Загрузить версию» после финального согласования", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true, status: "APPROVED" }));

		await expect
			.element(view.getByRole("button", { name: "Загрузить версию", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("скрывает кнопку «Загрузить версию» для проверяющего ЦФО", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false, isCfoReviewer: true }));

		await expect
			.element(view.getByRole("button", { name: "Загрузить версию", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("показывает ссылку скачивания текущей версии проверяющему ЦФО", async () => {
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				forms: [
					{
						id: 10,
						factPackageId: 1,
						code: "ACT_WORK",
						label: "Акт выполненных работ",
						isFilled: true,
						currentVersion: {
							id: 100,
							formId: 10,
							versionNumber: 1,
							fileName: "act.pdf",
							fileSize: 1234,
							uploadedById: 5,
							uploadedAt: "2026-08-01T10:00:00.000Z",
							remarkId: null,
						},
					},
				],
			}),
		);

		await expect.element(view.getByText("Открыть / скачать")).toBeVisible();
	});

	it("показывает «Оставить замечание» проверяющему ЦФО, пока его статус PENDING", async () => {
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				myCfoStatus: { id: 1, factPackageId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" },
			}),
		);

		await expect.element(view.getByRole("button", { name: "Оставить замечание" })).toBeVisible();
	});

	it("скрывает «Оставить замечание» филиалу", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: true }));

		await expect
			.element(view.getByRole("button", { name: "Оставить замечание", includeHidden: true }))
			.not.toBeInTheDocument();
	});

	it("показывает «Оставить замечание» ДТОиР, пока пакет на его проверке", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false, isDtoe: true, status: "UNDER_DTOE_REVIEW" }));

		await expect.element(view.getByRole("button", { name: "Оставить замечание" })).toBeVisible();
	});

	it("отправляет relatedFormId строки и корректный текст кнопки для ЦФО при сохранении замечания", async () => {
		const mutate = vi.fn();
		useLeaveFactPackageRemarkMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(
			makeDetail({
				isFilialOwner: false,
				isCfoReviewer: true,
				myCfoStatus: { id: 1, factPackageId: 1, cfoId: 2, cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" },
			}),
		);

		await view.getByRole("button", { name: "Оставить замечание" }).click();
		await view.getByLabelText("Описание").fill("Не хватает акта за март");
		await view.getByLabelText("Что исправить").fill("Приложить акт за март");
		await view.getByRole("button", { name: "Сохранить и вернуть на доработку" }).click();

		expect(mutate).toHaveBeenCalledWith(
			expect.objectContaining({
				humanId: "FCT-000002",
				data: expect.objectContaining({ relatedFormId: 10 }),
			}),
		);
	});

	it("использует другой текст кнопки сохранения для ДТОиР (не атомарный возврат)", async () => {
		const view = await renderWithClient(
			makeDetail({ isFilialOwner: false, isDtoe: true, status: "UNDER_DTOE_REVIEW" }),
		);

		await view.getByRole("button", { name: "Оставить замечание" }).click();

		await expect.element(view.getByRole("button", { name: "Сохранить замечание" })).toBeVisible();
	});
});
