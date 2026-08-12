import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { CorrectionDetail } from "@/packages/api/base/codegen";

import { CfoStatuses } from "./cfo-statuses";

function makeDetail(overrides: Partial<CorrectionDetail> = {}): CorrectionDetail {
  return {
    id: 1,
    humanId: "COR-000002",
    filialId: 1,
    correctionTypeId: 1,
    authorId: 5,
    status: "PARTIALLY_APPROVED",
    stageNote: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    sentToDtoeAt: null,
    decidedAt: null,
    canSend: false,
    canSendToDtoe: false,
    openRemarksCount: 0,
    filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
    correctionType: { id: 1, code: "TYPE", name: "Тип", isActive: true },
    author: { id: 5, username: "author", fullName: "Автор Автор Автор" },
    slots: [],
    cfoStatuses: [
      {
        id: 1,
        correctionId: 1,
        cfoId: 2,
        cfo: { id: 2, code: "АНГНКС", name: "АНГНКС", isActive: true },
        status: "APPROVED",
        isRequired: true,
        decidedById: 9,
        decidedBy: { id: 9, username: "petrov", fullName: "Петров Пётр Петрович", position: "Начальник отдела" },
        decidedAt: "2026-08-03T10:15:00.000Z",
      },
      {
        id: 2,
        correctionId: 1,
        cfoId: 3,
        cfo: { id: 3, code: "ОГМ", name: "ОГМ", isActive: true },
        status: "RETURNED",
        isRequired: true,
        decidedById: 8,
        decidedBy: { id: 8, username: "sidorova", fullName: "Сидорова Анна Ивановна", position: "Специалист" },
        decidedAt: "2026-08-04T11:00:00.000Z",
      },
    ],
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

describe("<CfoStatuses />", () => {
	it("отображает статус, ФИО и должность каждого решившего ЦФО без элементов управления", async () => {
		const view = await render(<CfoStatuses detail={makeDetail()} />);

		await expect.element(view.getByText("АНГНКС")).toBeVisible();
		await expect.element(view.getByText("Согласовано")).toBeVisible();
		await expect.element(view.getByText("ОГМ")).toBeVisible();
		await expect.element(view.getByText("Возвращено")).toBeVisible();
		await expect.element(view.getByText("Петров Пётр Петрович, Начальник отдела")).toBeVisible();

		const buttons = view.getByRole("button", { includeHidden: true }).elements();
		expect(buttons).toHaveLength(0);
	});

	it("не отображает блок, если ЦФО ещё не направлялись", async () => {
		const view = await render(<CfoStatuses detail={makeDetail({ cfoStatuses: [] })} />);

		await expect.element(view.getByText("Статусы ЦФО", { exact: true })).not.toBeInTheDocument();
	});
});
