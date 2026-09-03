import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactCfoStatuses } from "./fact-cfo-statuses";

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000006",
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

describe("<FactCfoStatuses />", () => {
	it("ничего не рендерит, если ЦФО ещё не назначены", async () => {
		const view = await render(<FactCfoStatuses detail={makeDetail()} />);

		await expect.element(view.getByText("Статусы ЦФО", { exact: false })).not.toBeInTheDocument();
	});

	it("показывает ЦФО, статус и кто/когда принял решение", async () => {
		const view = await render(
			<FactCfoStatuses
				detail={makeDetail({
					cfoStatuses: [
						{
							id: 1,
							factPackageId: 1,
							cfoId: 7,
							cfo: { id: 7, code: "ОГМ", name: "ОГМ", isActive: true },
							status: "APPROVED",
							decidedById: 9,
							decidedBy: { id: 9, username: "petrov", fullName: "Петров Пётр Петрович" },
							decidedAt: "2026-08-02T12:00:00.000Z",
						},
					],
				})}
			/>,
		);

		await expect.element(view.getByText("ОГМ")).toBeVisible();
		await expect.element(view.getByText("Петров Пётр Петрович")).toBeVisible();
	});
});
