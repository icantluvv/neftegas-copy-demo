import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactHistoryLog } from "./fact-history-log";

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000005",
		filialId: 1,
		cfoId: null,
		direction: "DO",
		authorId: 5,
		status: "DRAFT",
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSubmit: false,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		cfo: null,
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
		isCfoOwner: false,
		isCfoReviewer: false,
		isDtoe: false,
		availableCfos: [],
		returnedCfos: [],
		...overrides,
	};
}

describe("<FactHistoryLog />", () => {
	it("показывает запись истории с автором и текстом действия", async () => {
		const view = await render(
			<FactHistoryLog
				detail={makeDetail({
					history: [
						{
							id: 1,
							factPackageId: 1,
							userId: 5,
							user: { id: 5, username: "author", fullName: "Автор Автор Автор" },
							timestamp: "2026-08-01T10:00:00.000Z",
							text: "Пакет создан",
						},
					],
				})}
			/>,
		);

		await expect.element(view.getByText("Пакет создан")).toBeVisible();
		await expect.element(view.getByText("Автор Автор Автор")).toBeVisible();
	});

	it("показывает «Система» для записи без пользователя", async () => {
		const view = await render(
			<FactHistoryLog
				detail={makeDetail({
					history: [
						{ id: 2, factPackageId: 1, userId: null, user: null, timestamp: "2026-08-01T10:00:00.000Z", text: "Автоматическое действие" },
					],
				})}
			/>,
		);

		await expect.element(view.getByText("Система")).toBeVisible();
	});
});
