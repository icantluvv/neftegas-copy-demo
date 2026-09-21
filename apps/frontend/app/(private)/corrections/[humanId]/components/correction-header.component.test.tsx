import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

import { CorrectionHeader } from "./correction-header";

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
  return {
    id: 1,
    humanId: "COR-000002",
    filialId: 1,
    cfoId: null,
    correctionTypeId: 1,
    authorId: 5,
    status: "PARTIALLY_APPROVED",
    stageNote: "Один ЦФО согласовал, один вернул с замечанием",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-05T14:30:00.000Z",
    sentToDtoeAt: null,
    decidedAt: null,
    canSend: false,
    canSendToDtoe: false,
    openRemarksCount: 1,
    filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
    cfo: null,
    correctionType: { id: 1, code: "TYPE", name: "Корректировка тарифа", isActive: true },
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
    isCfoOwner: false,
    isCfoReviewer: false,
    isDtoe: false,
    availableCfos: [],
    returnedCfos: [],
    ...overrides,
  };
}

describe("<CorrectionHeader />", () => {
	it("отображает филиал, ID, тип, статус, этап, автора и даты", async () => {
		const view = await render(<CorrectionHeader detail={makeDetail()} />);

		await expect.element(view.getByText("COR-000002")).toBeVisible();
		await expect.element(view.getByText("Черноморнефтегаз")).toBeVisible();
		await expect.element(view.getByText("Корректировка тарифа")).toBeVisible();
		await expect.element(view.getByText("Частично согласовано")).toBeVisible();
		await expect.element(view.getByText("Один ЦФО согласовал, один вернул с замечанием")).toBeVisible();
		await expect.element(view.getByText("Иванов Иван Иванович")).toBeVisible();
	});
});
