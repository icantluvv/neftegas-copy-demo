import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { FactPackageDetail } from "@/packages/api/base/codegen";

import { FactPackageHeader } from "./fact-package-header";

function makeDetail(overrides: Partial<FactPackageDetail> = {}): FactPackageDetail {
	return {
		id: 1,
		humanId: "FCT-000004",
		filialId: 1,
		cfoId: null,
		direction: "TOIR",
		authorId: 5,
		status: "UNDER_CFO_REVIEW",
		createdAt: "2026-08-01T09:00:00.000Z",
		updatedAt: "2026-08-05T14:30:00.000Z",
		sentToDtoeAt: null,
		decidedAt: null,
		canSubmit: false,
		canSendToDtoe: false,
		openRemarksCount: 0,
		filial: { id: 1, code: "ЧФ", name: "Черноморнефтегаз", isActive: true },
		cfo: null,
		author: { id: 5, username: "ivanov", fullName: "Иванов Иван Иванович" },
		forms: [],
		cfoStatuses: [],
		remarks: [],
		history: [],
		packageComplete: true,
		missingForms: [],
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

describe("<FactPackageHeader />", () => {
	it("отображает ID, статус, направление, филиал, автора и даты", async () => {
		const view = await render(<FactPackageHeader detail={makeDetail()} />);

		await expect.element(view.getByText("FCT-000004")).toBeVisible();
		await expect.element(view.getByText("Техническое обслуживание и ремонт")).toBeVisible();
		await expect.element(view.getByText("Черноморнефтегаз")).toBeVisible();
		await expect.element(view.getByText("Иванов Иван Иванович")).toBeVisible();
	});
});
