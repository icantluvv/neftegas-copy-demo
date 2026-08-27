import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const usePathnameMock = vi.hoisted(() => vi.fn(() => '/planning'))

vi.mock('next/navigation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('next/navigation')>()

	return {
		...actual,
		usePathname: usePathnameMock,
	}
})

const { TopTabs } = await import('./top-tabs')

describe('<TopTabs />', () => {
	it('показывает 4 вкладки разделов ДТОиР', async () => {
		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'План на 2027' })).toHaveAttribute('href', '/planning')
		await expect.element(view.getByRole('link', { name: 'Выполнение' })).toHaveAttribute('href', '/execution')
		await expect.element(view.getByRole('link', { name: 'Корректировка' })).toHaveAttribute('href', '/dashboard')
		await expect.element(view.getByRole('link', { name: 'Факт' })).toHaveAttribute('href', '/fact')
	})

	it('подсвечивает активную вкладку по текущему маршруту', async () => {
		usePathnameMock.mockReturnValue('/planning')

		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'План на 2027' })).toHaveClass(/bg-primary/)
		await expect.element(view.getByRole('link', { name: 'Выполнение' })).not.toHaveClass(/bg-primary/)
	})

	it('оставляет вкладку «Корректировка» активной на связанных страницах модуля (/corrections/*)', async () => {
		usePathnameMock.mockReturnValue('/corrections/create')

		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'Корректировка' })).toHaveClass(/bg-primary/)
	})
})
