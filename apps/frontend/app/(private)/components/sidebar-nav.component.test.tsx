import { page } from '@vitest/browser/context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const DESKTOP_VIEWPORT = { width: 1280, height: 800 } as const
const MOBILE_VIEWPORT = { width: 375, height: 800 } as const

const useLogoutMock = vi.hoisted(() => vi.fn())

vi.mock('@/packages/api/base/codegen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/packages/api/base/codegen')>()

	return {
		...actual,
		useLogout: useLogoutMock,
	}
})

const { SidebarNav } = await import('./sidebar-nav')
const { useLogout } = await import('@/packages/api/base/codegen')

const state = {
	mutateMock: vi.fn(),
	mutationState: { isPending: false, isError: false },
	onSuccess: undefined as (() => void) | undefined,
	onError: undefined as (() => void) | undefined,
}

vi.mocked(useLogout).mockImplementation((options?: Parameters<typeof useLogout>[0]) => {
	state.onSuccess = options?.mutation?.onSuccess as (() => void) | undefined
	state.onError = options?.mutation?.onError as (() => void) | undefined

	return {
		mutate: state.mutateMock,
		isPending: state.mutationState.isPending,
		isError: state.mutationState.isError,
	} as unknown as ReturnType<typeof useLogout>
})

describe('<SidebarNav />', () => {
	beforeEach(async () => {
		state.mutateMock.mockClear()
		state.mutationState = { isPending: false, isError: false }
		state.onSuccess = undefined
		state.onError = undefined
		await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height)
	})

	it('показывает пункт навигации «Дашборд» и кнопку «Выйти»', async () => {
		const view = await render(<SidebarNav />)

		await expect.element(view.getByRole('link', { name: 'Дашборд' })).toHaveAttribute(
			'href',
			'/dashboard',
		)
		await expect.element(view.getByRole('button', { name: 'Выйти' })).toBeVisible()
	})

	it('вызывает мутацию выхода и перенаправляет на /login при успехе', async () => {
		const view = await render(<SidebarNav />)

		await view.getByRole('button', { name: 'Выйти' }).click()
		state.onSuccess?.()

		expect(state.mutateMock).toHaveBeenCalled()
		expect(useRouter().replace).toHaveBeenCalledWith('/login')
	})

	it('показывает тост с ошибкой при неудачном выходе и не перенаправляет', async () => {
		const view = await render(<SidebarNav />)

		await view.getByRole('button', { name: 'Выйти' }).click()
		state.onError?.()

		expect(toast.error).toHaveBeenCalledWith('Не удалось выйти из аккаунта')
		expect(useRouter().replace).not.toHaveBeenCalled()
	})

	describe('на мобильном экране', () => {
		beforeEach(async () => {
			await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height)
		})

		it('скрывает сайдбар и показывает кнопку-бургер по умолчанию', async () => {
			const view = await render(<SidebarNav />)

			await expect.element(view.getByRole('link', { name: 'Дашборд', includeHidden: true })).not.toBeVisible()
			await expect.element(view.getByRole('button', { name: 'Открыть меню' })).toBeVisible()
		})

		it('открывает сайдбар на всю ширину экрана по клику на бургер', async () => {
			const view = await render(<SidebarNav />)

			await view.getByRole('button', { name: 'Открыть меню' }).click()

			await expect.element(view.getByRole('link', { name: 'Дашборд' })).toBeVisible()
		})

		it('закрывает сайдбар по повторному клику на бургер', async () => {
			const view = await render(<SidebarNav />)

			await view.getByRole('button', { name: 'Открыть меню' }).click()
			await view.getByRole('button', { name: 'Закрыть меню' }).click()

			await expect.element(view.getByRole('link', { name: 'Дашборд', includeHidden: true })).not.toBeVisible()
		})

		it('закрывает сайдбар при выборе пункта навигации', async () => {
			const view = await render(<SidebarNav />)

			await view.getByRole('button', { name: 'Открыть меню' }).click()
			await view.getByRole('link', { name: 'Дашборд' }).click()

			await expect.element(view.getByRole('link', { name: 'Дашборд', includeHidden: true })).not.toBeVisible()
		})
	})
})
