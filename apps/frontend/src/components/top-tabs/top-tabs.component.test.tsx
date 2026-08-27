import { beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { nextNavigationMock, resetNextNavigationMock } from '#/test/mocks/next-navigation'

const { TopTabs } = await import('./top-tabs')

describe('<TopTabs />', () => {
	beforeEach(() => {
		resetNextNavigationMock()
	})

	it('показывает 4 вкладки разделов ДТОиР', async () => {
		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'План на 2027' })).toHaveAttribute('href', '/planning')
		await expect.element(view.getByRole('link', { name: 'Выполнение' })).toHaveAttribute('href', '/execution')
		await expect.element(view.getByRole('link', { name: 'Корректировка' })).toHaveAttribute('href', '/dashboard')
		await expect.element(view.getByRole('link', { name: 'Факт' })).toHaveAttribute('href', '/fact')
	})

	it('подсвечивает активную вкладку по текущему маршруту', async () => {
		nextNavigationMock.pathname = '/planning'

		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'План на 2027' })).toHaveClass(/bg-primary/)
		await expect.element(view.getByRole('link', { name: 'Выполнение' })).not.toHaveClass(/bg-primary/)
	})

	it('оставляет вкладку «Корректировка» активной на /corrections/*', async () => {
		nextNavigationMock.pathname = '/corrections/create'

		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'Корректировка' })).toHaveClass(/bg-primary/)
	})

	it('оставляет вкладку «Корректировка» активной на /notifications', async () => {
		nextNavigationMock.pathname = '/notifications'

		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'Корректировка' })).toHaveClass(/bg-primary/)
	})

	it('оставляет вкладку «План на 2027» активной на /planning/create', async () => {
		nextNavigationMock.pathname = '/planning/create'

		const view = await render(<TopTabs />)

		await expect.element(view.getByRole('link', { name: 'План на 2027' })).toHaveClass(/bg-primary/)
	})
})
