import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

const useSendCorrectionMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, useSendCorrection: useSendCorrectionMock };
});

const { SendForReviewForm } = await import("./send-for-review-form");

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
	return {
		id: 1,
		humanId: "COR-000001",
		filialId: 1,
		cfoId: null,
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
		cfo: null,
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
		isFilialOwner: true,
		isCfoOwner: false,
		isCfoReviewer: false,
		isDtoe: false,
		availableCfos: [{ id: 2, code: "ОГМ", name: "ОГМ", isActive: true }],
		returnedCfos: [],
		...overrides,
	};
}

function renderWithClient(detail: CorrectionDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<SendForReviewForm detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<SendForReviewForm />", () => {
	beforeEach(() => {
		useSendCorrectionMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("не отображается вне статуса DRAFT", async () => {
		const view = await renderWithClient(makeDetail({ status: "UNDER_CFO_REVIEW" }));

		await expect.element(view.getByText("Направить на проверку", { exact: true })).not.toBeInTheDocument();
	});

	it("кнопка неактивна при незаполненных обязательных слотах", async () => {
		const view = await renderWithClient(makeDetail({ missingRequirements: ["Счета на оплату"] }));

		await view.getByRole("checkbox").click();

		await expect.element(view.getByRole("button", { name: "Направить" })).toBeDisabled();
	});

	it("кнопка активна при заполненных слотах и выбранном ЦФО", async () => {
		const view = await renderWithClient(makeDetail());

		await view.getByRole("checkbox").click();

		await expect.element(view.getByRole("button", { name: "Направить" })).toBeEnabled();
	});
});
