import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactActionsBar } from "./fact-actions-bar";

const useApproveFactPackageByCfoMock = vi.hoisted(() => vi.fn());
const useSendFactPackageToDtoeMock = vi.hoisted(() => vi.fn());
const useDecideFactPackageByDtoeMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useApproveFactPackageByCfo: useApproveFactPackageByCfoMock,
		useSendFactPackageToDtoe: useSendFactPackageToDtoeMock,
		useDecideFactPackageByDtoe: useDecideFactPackageByDtoeMock,
	};
});

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000003",
		filialId: 1,
		direction: "DO",
		authorId: 5,
		status: "UNDER_CFO_REVIEW",
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
		isFilialOwner: false,
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
			<FactActionsBar detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<FactActionsBar />", () => {
	beforeEach(() => {
		useApproveFactPackageByCfoMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		useSendFactPackageToDtoeMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
		useDecideFactPackageByDtoeMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("не рендерит ничего, если ни одно действие недоступно", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByRole("button", { includeHidden: true })).not.toBeInTheDocument();
	});

	it("показывает «Согласовать» ЦФО со своим статусом PENDING и вызывает мутацию с cfoId", async () => {
		const mutate = vi.fn();
		useApproveFactPackageByCfoMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(
			makeDetail({
				isCfoReviewer: true,
				myCfoStatus: { id: 1, factPackageId: 1, cfoId: 7, cfo: { id: 7, code: "ОГМ", name: "ОГМ", isActive: true }, status: "PENDING" },
			}),
		);

		await view.getByRole("button", { name: "Согласовать" }).click();

		expect(mutate).toHaveBeenCalledWith({ humanId: "FCT-000003", cfoId: 7 });
	});

	it("показывает «Направить в ДТОиР» согласовавшему ЦФО, когда пакет готов", async () => {
		const mutate = vi.fn();
		useSendFactPackageToDtoeMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(
			makeDetail({
				isCfoReviewer: true,
				canSendToDtoe: true,
				myCfoStatus: { id: 1, factPackageId: 1, cfoId: 7, cfo: { id: 7, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED" },
			}),
		);

		await view.getByRole("button", { name: "Направить в ДТОиР" }).click();

		expect(mutate).toHaveBeenCalledWith({ humanId: "FCT-000003" });
	});

	it("показывает обе кнопки решения ДТОиР и вызывает мутацию с нужным decision", async () => {
		const mutate = vi.fn();
		useDecideFactPackageByDtoeMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(makeDetail({ isDtoe: true, status: "UNDER_DTOE_REVIEW" }));

		await view.getByRole("button", { name: "Согласовать (ДТОиР)" }).click();
		expect(mutate).toHaveBeenCalledWith({ humanId: "FCT-000003", data: { decision: "APPROVE" } });

		await view.getByRole("button", { name: "Вернуть на доработку (ДТОиР)" }).click();
		expect(mutate).toHaveBeenCalledWith({ humanId: "FCT-000003", data: { decision: "RETURN" } });
	});

	it("скрывает «Согласовать», если ЦФО уже принял решение", async () => {
		const view = await renderWithClient(
			makeDetail({
				isCfoReviewer: true,
				myCfoStatus: { id: 1, factPackageId: 1, cfoId: 7, cfo: { id: 7, code: "ОГМ", name: "ОГМ", isActive: true }, status: "APPROVED" },
			}),
		);

		await expect
			.element(view.getByRole("button", { name: "Согласовать", includeHidden: true }))
			.not.toBeInTheDocument();
	});
});
