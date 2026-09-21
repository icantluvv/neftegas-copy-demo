import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { PlanDetail } from "@/packages/api/base/codegen";

const useSendPlanMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return { ...actual, useSendPlan: useSendPlanMock };
});

const { SendForReviewForm } = await import("./send-for-review-form");

function makeDetail(overrides: Partial<PlanDetail> = {}): PlanDetail {
	return {
		id: 1,
		humanId: "PLN-000001",
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
		slots: [],
		cfoStatuses: [],
		remarks: [],
		history: [],
		packageComplete: true,
		missingRequirements: [],
		myCfoStatus: null,
		myOpenRemarksCount: 0,
		isFilialOwner: true,
		isCfoReviewer: false,
		isDtoe: false,
		availableCfos: [{ id: 2, code: "ОГМ", name: "ОГМ", isActive: true }],
		returnedCfos: [],
		...overrides,
	};
}

function renderWithClient(detail: PlanDetail) {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<SendForReviewForm detail={detail} />
		</QueryClientProvider>,
	);
}

describe("<SendForReviewForm />", () => {
	beforeEach(() => {
		useSendPlanMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	it("не отображается вне статуса DRAFT", async () => {
		const view = await renderWithClient(makeDetail({ status: "UNDER_CFO_REVIEW" }));

		await expect.element(view.getByText("Направить на проверку", { exact: true })).not.toBeInTheDocument();
	});

	it("кнопка неактивна при незаполненных обязательных слотах", async () => {
		const view = await renderWithClient(makeDetail({ missingRequirements: ["Excel плана"] }));

		await view.getByRole("checkbox").click();

		await expect.element(view.getByRole("button", { name: "Направить" })).toBeDisabled();
	});

	it("кнопка активна при заполненных слотах и выбранном ЦФО", async () => {
		const view = await renderWithClient(makeDetail());

		await view.getByRole("checkbox").click();

		await expect.element(view.getByRole("button", { name: "Направить" })).toBeEnabled();
	});

	it("отправляет выбранные cfoIds", async () => {
		const mutate = vi.fn();
		useSendPlanMock.mockReturnValue({ mutate, isPending: false });
		const view = await renderWithClient(makeDetail());

		await view.getByRole("checkbox").click();
		await view.getByRole("button", { name: "Направить" }).click();

		expect(mutate).toHaveBeenCalledWith({ humanId: "PLN-000001", data: { cfoIds: [2] } });
	});
});
