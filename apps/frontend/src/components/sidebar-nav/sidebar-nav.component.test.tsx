import { page } from '@vitest/browser/context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { AuthUser } from '@/packages/api/base/codegen'

const DESKTOP_VIEWPORT = { width: 1280, height: 800 } as const
const MOBILE_VIEWPORT = { width: 375, height: 800 } as const

const testUser: AuthUser = {
	id: 1,
	username: 'ivanov',
	fullName: 'Иванов Иван Иванович',
	role: 'FILIAL',
	isLocked: false,
}

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

	it('показывает кнопку «Выйти»', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await expect.element(view.getByRole('button', { name: 'Выйти' })).toBeVisible()
	})

	it('вызывает мутацию выхода и перенаправляет на / при успехе', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await view.getByRole('button', { name: 'Выйти' }).click()
		state.onSuccess?.()

		expect(state.mutateMock).toHaveBeenCalled()
		expect(useRouter().replace).toHaveBeenCalledWith('/')
	})

	it('показывает тост с ошибкой при неудачном выходе и не перенаправляет', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await view.getByRole('button', { name: 'Выйти' }).click()
		state.onError?.()

		expect(toast.error).toHaveBeenCalledWith('Не удалось выйти из аккаунта')
		expect(useRouter().replace).not.toHaveBeenCalled()
	})

	it('показывает брендинг: круглый логотип-плейсхолдер и название компании', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await expect.element(view.getByText('Черноморнефтегаз')).toBeVisible()
		await expect.element(view.getByTestId('sidebar-logo')).toBeVisible()
	})

	it('содержит пункт меню «Рабочий стол» со ссылкой на /dashboard', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await expect
			.element(view.getByRole('link', { name: 'Рабочий стол' }))
			.toHaveAttribute('href', '/dashboard')
	})

	it('содержит пункт меню «Уведомления» со ссылкой на /notifications', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await expect
			.element(view.getByRole('link', { name: 'Уведомления' }))
			.toHaveAttribute('href', '/notifications')
	})

	it('показывает блок профиля с инициалами и ФИО пользователя из пропа', async () => {
		const view = await render(<SidebarNav user={testUser} />)

		await expect.element(view.getByText('Иванов Иван Иванович')).toBeVisible()
		await expect.element(view.getByText('ИИ')).toBeVisible()
	})

	it('не выполняет собственный запрос за данными пользователя при наличии пропа', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch')

		await render(<SidebarNav user={testUser} />)

		expect(fetchSpy).not.toHaveBeenCalled()
	})

	describe('на мобильном экране', () => {
		beforeEach(async () => {
			await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height)
		})

		it('скрывает сайдбар и показывает кнопку-бургер по умолчанию', async () => {
			const view = await render(<SidebarNav user={testUser} />)

			await expect.element(view.getByRole('button', { name: 'Выйти', includeHidden: true })).not.toBeVisible()
			await expect.element(view.getByRole('button', { name: 'Открыть меню' })).toBeVisible()
		})

		it('открывает сайдбар на всю ширину экрана по клику на бургер', async () => {
			const view = await render(<SidebarNav user={testUser} />)

			await view.getByRole('button', { name: 'Открыть меню' }).click()

			await expect.element(view.getByRole('button', { name: 'Выйти' })).toBeVisible()
		})

		it('закрывает сайдбар по повторному клику на бургер', async () => {
			const view = await render(<SidebarNav user={testUser} />)

			await view.getByRole('button', { name: 'Открыть меню' }).click()
			await view.getByRole('button', { name: 'Закрыть меню' }).click()

			await expect.element(view.getByRole('button', { name: 'Выйти', includeHidden: true })).not.toBeVisible()
		})
	})
})
