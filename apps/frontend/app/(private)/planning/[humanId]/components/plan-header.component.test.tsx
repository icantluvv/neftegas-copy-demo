import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { PlanDetail } from "@/packages/api/base/codegen";

import { PlanHeader } from "./plan-header";

function makeDetail(overrides: Partial<PlanDetail> = {}): PlanDetail {
  return {
    id: 1,
    humanId: "PLN-000002",
    filialId: 1,
    planTypeId: 1,
    authorId: 5,
    status: "PARTIALLY_APPROVED",
    stageNote: "Один ЦФО согласовал, один вернул с замечанием",
    createdAt: "2027-01-01T09:00:00.000Z",
    updatedAt: "2027-01-05T14:30:00.000Z",
    sentToDtoeAt: null,
    decidedAt: null,
    canSend: false,
    canSendToDtoe: false,
    openRemarksCount: 1,
    filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
    planType: { id: 1, code: "DTOIR_2027", name: "План на 2027", isActive: true },
    author: { id: 5, username: "ivanov", fullName: "Иванов Иван Иванович" },
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
    availableCfos: [],
    returnedCfos: [],
    ...overrides,
  };
}

describe("<PlanHeader />", () => {
	it("отображает филиал, ID, тип, статус, этап и автора", async () => {
		const view = await render(<PlanHeader detail={makeDetail()} />);

		await expect.element(view.getByText("PLN-000002")).toBeVisible();
		await expect.element(view.getByText("Черноморнефтегаз")).toBeVisible();
		await expect.element(view.getByText("План на 2027")).toBeVisible();
		await expect.element(view.getByText("Частично согласовано")).toBeVisible();
		await expect.element(view.getByText("Один ЦФО согласовал, один вернул с замечанием")).toBeVisible();
		await expect.element(view.getByText("Иванов Иван Иванович")).toBeVisible();
	});

	it("показывает «Изменить тип» филиалу-автору только в DRAFT", async () => {
		const view = await render(<PlanHeader detail={makeDetail({ status: "DRAFT" })} />);

		await expect.element(view.getByRole("link", { name: "Изменить тип" })).toBeVisible();
	});

	it("скрывает «Изменить тип» вне DRAFT", async () => {
		const view = await render(<PlanHeader detail={makeDetail({ status: "UNDER_CFO_REVIEW" })} />);

		await expect
			.element(view.getByRole("link", { name: "Изменить тип", includeHidden: true }))
			.not.toBeInTheDocument();
	});
});
