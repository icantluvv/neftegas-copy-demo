import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

import { HistoryLog } from "./history-log";

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
  return {
    id: 1,
    humanId: "COR-000002",
    filialId: 1,
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
    correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
    author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
    slots: [],
    cfoStatuses: [],
    remarks: [],
    history: [
      {
        id: 1,
        correctionId: 1,
        timestamp: "2026-08-01T09:00:00.000Z",
        userId: 5,
        user: { id: 5, username: "ivanov", fullName: "Иванов Иван Иванович", position: "Специалист" },
        text: "Создал корректировку",
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
		await expect.element(view.getByText("Создал корректировку")).toBeVisible();

		const buttons = view.getByRole("button", { includeHidden: true }).elements();
		expect(buttons).toHaveLength(0);
	});
});
