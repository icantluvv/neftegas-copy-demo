import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactSubmitPanel } from "./fact-submit-panel";

const useSubmitFactPackageMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useSubmitFactPackage: useSubmitFactPackageMock,
	};
});

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000004",
		filialId: 1,
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
		availableCfos: [
			{ id: 1, code: "ОГМ", name: "ОГМ", isActive: true },
			{ id: 2, code: "ПЭО", name: "ПЭО", isActive: true },
		],
		returnedCfos: [],
		...overrides,
	};
}

function renderWithClient(detail: FactPackageDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<FactSubmitPanel detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<FactSubmitPanel />", () => {
	beforeEach(() => {
		useSubmitFactPackageMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("не рендерит ничего не-владельцу", async () => {
		const view = await renderWithClient(makeDetail({ isFilialOwner: false }));

		await expect.element(view.getByText("Направить на проверку")).not.toBeInTheDocument();
	});

	it("не рендерит ничего, когда статус не позволяет направление", async () => {
		const view = await renderWithClient(makeDetail({ canSubmit: false }));

		await expect.element(view.getByText("Направить на проверку")).not.toBeInTheDocument();
	});

	it("показывает список availableCfos для первого направления DRAFT", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByText("Направить на проверку", { exact: true })).toBeVisible();
		await expect.element(view.getByText("ОГМ")).toBeVisible();
		await expect.element(view.getByText("ПЭО")).toBeVisible();
	});

	it("показывает список returnedCfos и заголовок «Направить повторно» при RETURNED_FOR_REVISION", async () => {
		const view = await renderWithClient(
			makeDetail({
				status: "RETURNED_FOR_REVISION",
				availableCfos: [],
				returnedCfos: [{ id: 3, code: "ЮР", name: "Юрслужба", isActive: true }],
			}),
		);

		await expect.element(view.getByText("Направить повторно", { exact: true }).first()).toBeVisible();
		await expect.element(view.getByText("Юрслужба")).toBeVisible();
	});

	it("кнопка неактивна, пока не выбран ни один ЦФО", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByRole("button", { name: "Направить" })).toBeDisabled();
	});

	it("активирует кнопку после выбора ЦФО и отправляет выбранные cfoIds", async () => {
		const mutate = vi.fn();
		useSubmitFactPackageMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(makeDetail());

		await view.getByRole("checkbox").first().click();
		await expect.element(view.getByRole("button", { name: "Направить" })).toBeEnabled();

		await view.getByRole("button", { name: "Направить" }).click();

		expect(mutate).toHaveBeenCalledWith({ humanId: "FCT-000004", data: { cfoIds: [1] } });
	});

	it("кнопка активна с выбранным ЦФО, даже если пакет не укомплектован", async () => {
		const view = await renderWithClient(makeDetail({ packageComplete: false }));

		await view.getByRole("checkbox").first().click();

		await expect.element(view.getByRole("button", { name: "Направить" })).toBeEnabled();
	});
});
