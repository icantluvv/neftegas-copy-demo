import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { createAuthUser } from '@/packages/api/base/codegen/mocks/createAuthUser'

const useLoginMock = vi.hoisted(() => vi.fn())

vi.mock('@/packages/api/base/codegen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/packages/api/base/codegen')>()

	return {
		...actual,
		useLogin: useLoginMock,
	}
})

const { LoginForm } = await import('./login-form')
const { useLogin } = await import('@/packages/api/base/codegen')

const state = {
	mutateMock: vi.fn(),
	mutationState: { isPending: false, isError: false },
	onSuccess: undefined as ((data: ReturnType<typeof createAuthUser>) => void) | undefined,
	onError: undefined as ((error: unknown) => void) | undefined,
}

vi.mocked(useLogin).mockImplementation((options?: Parameters<typeof useLogin>[0]) => {
	state.onSuccess = options?.mutation?.onSuccess as typeof state.onSuccess
	state.onError = options?.mutation?.onError as typeof state.onError

	return {
		mutate: state.mutateMock,
		isPending: state.mutationState.isPending,
		isError: state.mutationState.isError,
	} as unknown as ReturnType<typeof useLogin>
})

describe('<LoginForm />', () => {
	beforeEach(() => {
		state.mutateMock.mockClear()
		state.mutationState = { isPending: false, isError: false }
		state.onSuccess = undefined
		state.onError = undefined
	})

	it('отображает поля email, пароля и кнопку входа', async () => {
		const view = await render(<LoginForm />)

		await expect.element(view.getByLabelText('Email')).toBeVisible()
		await expect.element(view.getByLabelText('Пароль')).toBeVisible()
		await expect.element(view.getByRole('button', { name: 'Войти' })).toBeVisible()
	})

	it('отправляет введённые email и пароль', async () => {
		const view = await render(<LoginForm />)

		await view.getByLabelText('Email').fill('user@example.com')
		await view.getByLabelText('Пароль').fill('pass')
		await view.getByRole('button', { name: 'Войти' }).click()

		expect(state.mutateMock).toHaveBeenCalledWith({
			data: { email: 'user@example.com', password: 'pass' },
		})
	})

	it('показывает ошибку формата под полем email и не отправляет запрос', async () => {
		const view = await render(<LoginForm />)

		await view.getByLabelText('Email').fill('not-an-email')
		await view.getByLabelText('Пароль').fill('pass')
		await view.getByRole('button', { name: 'Войти' }).click()

		await expect.element(view.getByText(/email/i)).toBeVisible()
		expect(state.mutateMock).not.toHaveBeenCalled()
	})

	it('перенаправляет на /dashboard при успешном входе роли FILIAL', async () => {
		await render(<LoginForm />)

		state.onSuccess?.(createAuthUser({ role: 'FILIAL' }))

		expect(useRouter().replace).toHaveBeenCalledWith('/dashboard')
	})

	it('перенаправляет на /dashboard при успешном входе роли CFO', async () => {
		await render(<LoginForm />)

		state.onSuccess?.(createAuthUser({ role: 'CFO' }))

		expect(useRouter().replace).toHaveBeenCalledWith('/dashboard')
	})

	it('перенаправляет на /dashboard при успешном входе роли DTOE', async () => {
		await render(<LoginForm />)

		state.onSuccess?.(createAuthUser({ role: 'DTOE' }))

		expect(useRouter().replace).toHaveBeenCalledWith('/dashboard')
	})

	it('показывает тост с единым сообщением об ошибке при 401', async () => {
		await render(<LoginForm />)

		state.onError?.(new Error('Unauthorized', { cause: { status: 401 } }))

		expect(toast.error).toHaveBeenCalledWith('Неверный email или пароль')
	})

	it('показывает тост об ошибке сервера при 500 и не показывает ошибку логина/пароля', async () => {
		await render(<LoginForm />)

		state.onError?.(new Error('Internal Server Error', { cause: { status: 500 } }))

		expect(toast.error).toHaveBeenCalledWith('Ошибка сервера. Попробуйте позже')
		expect(toast.error).not.toHaveBeenCalledWith('Неверный email или пароль')
	})

	it('во время отправки блокирует кнопку и меняет её текст', async () => {
		state.mutationState = { isPending: true, isError: false }

		const view = await render(<LoginForm />)

		await expect.element(view.getByRole('button', { name: 'Входим…' })).toBeDisabled()
	})
})
