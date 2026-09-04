import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CfoCreateOwnPackageButton } from "./cfo-create-own-package-button";

const useCreateFactPackageMock = vi.hoisted(() => vi.fn());

vi.mock("@/packages/api/base/codegen", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/packages/api/base/codegen")>();

	return {
		...actual,
		useCreateFactPackage: useCreateFactPackageMock,
	};
});

describe("<CfoCreateOwnPackageButton />", () => {
	it("по клику создаёт свой факт-пакет для направления", async () => {
		const mutate = vi.fn();
		useCreateFactPackageMock.mockReturnValue({ mutate, isPending: false });
		const view = await render(<CfoCreateOwnPackageButton direction="KR_HS" />);

		await view.getByRole("button", { name: "Создать свой пакет" }).click();

		expect(mutate).toHaveBeenCalledWith({ data: { direction: "KR_HS" } });
	});

	it("переходит на карточку созданного пакета при успехе", async () => {
		useCreateFactPackageMock.mockImplementation(({ mutation }: { mutation: { onSuccess: (detail: { humanId: string }) => void } }) => ({
			mutate: () => mutation.onSuccess({ humanId: "FCT-000099" }),
			isPending: false,
		}));
		const view = await render(<CfoCreateOwnPackageButton direction="DO" />);

		await view.getByRole("button").click();

		expect(useRouter().push).toHaveBeenCalledWith("/fact/files/FCT-000099");
	});
});
