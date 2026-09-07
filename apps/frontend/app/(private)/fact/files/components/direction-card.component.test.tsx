import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { DirectionCard } from "./direction-card";

const useCreateFactPackageMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useCreateFactPackage: useCreateFactPackageMock,
	};
});

describe("<DirectionCard />", () => {
	it("показывает название направления и предложение создать новый пакет", async () => {
		useCreateFactPackageMock.mockReturnValue({ mutate: vi.fn(), isPending: false });

		const view = await render(<DirectionCard direction="DO" />);

		await expect.element(view.getByText("Диагностическое обследование")).toBeVisible();
		await expect.element(view.getByText("Создать новый пакет")).toBeVisible();
	});

	it("по клику создаёт новый факт-пакет для своего направления", async () => {
		const mutate = vi.fn();
		useCreateFactPackageMock.mockReturnValue({ mutate, isPending: false });
		const view = await render(<DirectionCard direction="KR_HS" />);

		await view.getByRole("button").click();

		expect(mutate).toHaveBeenCalledWith({ data: { direction: "KR_HS" } });
	});

	it("переходит на карточку созданного пакета при успехе", async () => {
		useCreateFactPackageMock.mockImplementation(({ mutation }: { mutation: { onSuccess: (detail: { humanId: string }) => void } }) => ({
			mutate: () => mutation.onSuccess({ humanId: "FCT-000042" }),
			isPending: false,
		}));
		const view = await render(<DirectionCard direction="TOIR" />);

		await view.getByRole("button").click();

		expect(useRouter().push).toHaveBeenCalledWith("/fact/files/FCT-000042");
	});

	it("дизейблит кнопку, пока создание в процессе", async () => {
		useCreateFactPackageMock.mockReturnValue({ mutate: vi.fn(), isPending: true });

		const view = await render(<DirectionCard direction="DO" />);

		await expect.element(view.getByRole("button")).toBeDisabled();
		await expect.element(view.getByText("Создаём…")).toBeVisible();
	});
});
