import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

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
	onSuccess: undefined as (() => void) | undefined,
	onError: undefined as (() => void) | undefined,
}

vi.mocked(useLogin).mockImplementation((options?: Parameters<typeof useLogin>[0]) => {
	state.onSuccess = options?.mutation?.onSuccess as (() => void) | undefined
	state.onError = options?.mutation?.onError as (() => void) | undefined

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

	it('отображает поля логина, пароля и кнопку входа', async () => {
		const view = await render(<LoginForm />)

		await expect.element(view.getByLabelText('Логин')).toBeVisible()
		await expect.element(view.getByLabelText('Пароль')).toBeVisible()
		await expect.element(view.getByRole('button', { name: 'Войти' })).toBeVisible()
	})

	it('отправляет введённые логин и пароль', async () => {
		const view = await render(<LoginForm />)

		await view.getByLabelText('Логин').fill('user')
		await view.getByLabelText('Пароль').fill('pass')
		await view.getByRole('button', { name: 'Войти' }).click()

		expect(state.mutateMock).toHaveBeenCalledWith({ data: { username: 'user', password: 'pass' } })
	})

	it('перенаправляет на /dashboard при успешном входе', async () => {
		await render(<LoginForm />)

		state.onSuccess?.()

		expect(useRouter().replace).toHaveBeenCalledWith('/dashboard')
	})

	it('показывает тост с ошибкой при неудачном входе', async () => {
		await render(<LoginForm />)

		state.onError?.()

		expect(toast.error).toHaveBeenCalledWith('Неверный логин или пароль')
	})

	it('во время отправки блокирует кнопку и меняет её текст', async () => {
		state.mutationState = { isPending: true, isError: false }

		const view = await render(<LoginForm />)

		await expect.element(view.getByRole('button', { name: 'Входим…' })).toBeDisabled()
	})
})
