import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

const useSendCorrectionToDtoeMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, useSendCorrectionToDtoe: useSendCorrectionToDtoeMock };
});

const { CfoOwnerSubmitPanel } = await import("./cfo-owner-submit-panel");

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
	return {
		id: 1,
		humanId: "COR-000001",
		filialId: null,
		cfoId: 2,
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
		filial: null,
		cfo: { id: 2, code: "ОГМ", name: "ОГМ", isActive: true },
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
		isFilialOwner: false,
		isCfoOwner: true,
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
			<CfoOwnerSubmitPanel detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<CfoOwnerSubmitPanel />", () => {
	beforeEach(() => {
		useSendCorrectionToDtoeMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("не отображается для филиал-владельца (не ЦФО)", async () => {
		const view = await renderWithClient(makeDetail({ isCfoOwner: false, isFilialOwner: true }));

		await expect.element(view.getByText("Пакет готов к направлению", { exact: true })).not.toBeInTheDocument();
	});

	it("не отображается вне статусов DRAFT/RETURNED_BY_DTOE", async () => {
		const view = await renderWithClient(makeDetail({ status: "UNDER_DTOE_REVIEW" }));

		await expect.element(view.getByText("Пакет готов к направлению", { exact: true })).not.toBeInTheDocument();
	});

	it("кнопка неактивна при незаполненных обязательных слотах", async () => {
		const view = await renderWithClient(makeDetail({ missingRequirements: ["Служебная записка"] }));

		await expect.element(view.getByRole("button", { name: "Направить в ДТОиР" })).toBeDisabled();
	});

	it("кнопка активна, когда пакет укомплектован", async () => {
		const view = await renderWithClient(makeDetail());

		await expect.element(view.getByRole("button", { name: "Направить в ДТОиР" })).toBeEnabled();
	});

	it("кнопка активна для повторного направления из RETURNED_BY_DTOE", async () => {
		const view = await renderWithClient(makeDetail({ status: "RETURNED_BY_DTOE" }));

		await expect.element(view.getByRole("button", { name: "Направить в ДТОиР" })).toBeEnabled();
	});
});
