import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { PlanDetail } from "@/packages/api/base/codegen";

import { HistoryLog } from "./history-log";

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
    slots: [],
    cfoStatuses: [],
    remarks: [],
    history: [
      {
        id: 1,
        planId: 1,
        timestamp: "2027-01-01T09:00:00.000Z",
        userId: 5,
        user: { id: 5, username: "ivanov", fullName: "Иванов Иван Иванович", position: "Специалист" },
        text: "Создал план",
      },
    ],
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

describe("<HistoryLog />", () => {
	it("отображает запись истории только для чтения без элементов редактирования", async () => {
		const view = await render(<HistoryLog detail={makeDetail()} />);

		await expect.element(view.getByText("Иванов Иван Иванович, Специалист")).toBeVisible();
		await expect.element(view.getByText("Создал план")).toBeVisible();

		const buttons = view.getByRole("button", { includeHidden: true }).elements();
		expect(buttons).toHaveLength(0);
	});
});
