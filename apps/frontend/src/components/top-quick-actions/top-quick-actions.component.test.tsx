import { describe, expect, it, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'

import { nextNavigationMock, resetNextNavigationMock } from '#/test/mocks/next-navigation'
import type { AuthUser } from '@/packages/api/base/codegen'

const { TopQuickActions } = await import('./top-quick-actions')

function user(overrides: Partial<AuthUser> = {}): AuthUser {
	return {
		id: 1,
		username: 'ivanov',
		fullName: 'Иванов Иван Иванович',
		role: 'FILIAL',
		isLocked: false,
		...overrides,
	}
}

beforeEach(() => {
	resetNextNavigationMock()
})

describe('<TopQuickActions />', () => {
	it('на модуле «Корректировка» показывает «Рабочий стол», «Создать корректировку» и «Уведомления» для роли Филиал', async () => {
		nextNavigationMock.pathname = '/dashboard'

		const view = await render(<TopQuickActions user={user({ role: 'FILIAL' })} />)

		await expect.element(view.getByRole('link', { name: 'Рабочий стол' })).toHaveAttribute('href', '/dashboard')
		await expect
			.element(view.getByRole('link', { name: 'Создать корректировку' }))
			.toHaveAttribute('href', '/corrections/create')
		await expect.element(view.getByRole('link', { name: 'Уведомления' })).toHaveAttribute('href', '/notifications')
	})

	it('на модуле «Корректировка» скрывает «Создать корректировку» для роли, отличной от Филиала', async () => {
		nextNavigationMock.pathname = '/dashboard'

		const view = await render(<TopQuickActions user={user({ role: 'CFO' })} />)

		await expect.element(view.getByRole('link', { name: 'Создать корректировку' })).not.toBeInTheDocument()
		await expect.element(view.getByRole('link', { name: 'Уведомления' })).toBeVisible()
	})

	it('остаётся на модуле «Корректировка» на вложенных маршрутах уведомлений', async () => {
		nextNavigationMock.pathname = '/notifications'

		const view = await render(<TopQuickActions user={user()} />)

		await expect.element(view.getByRole('link', { name: 'Уведомления' })).toBeVisible()
		await expect.element(view.getByRole('link', { name: 'Уведомления' })).toHaveClass('bg-primary')
	})

	it.each([
		{ module: 'План на 2027', pathname: '/planning', home: '/planning', files: '/planning/files', notifications: '/planning/notifications' },
		{ module: 'Выполнение', pathname: '/execution', home: '/execution', files: '/execution/files', notifications: '/execution/notifications' },
		{ module: 'Факт', pathname: '/fact', home: '/fact', files: '/fact/files', notifications: '/fact/notifications' },
	])('на модуле «$module» показывает «Рабочий стол», «Файлы» и «Уведомления» — все свои для модуля', async ({ pathname, home, files, notifications }) => {
		nextNavigationMock.pathname = pathname

		const view = await render(<TopQuickActions user={user()} />)

		await expect.element(view.getByRole('link', { name: 'Рабочий стол' })).toHaveAttribute('href', home)
		await expect.element(view.getByRole('link', { name: 'Файлы' })).toHaveAttribute('href', files)
		await expect.element(view.getByRole('link', { name: 'Уведомления' })).toHaveAttribute('href', notifications)
		await expect.element(view.getByRole('link', { name: 'Создать корректировку' })).not.toBeInTheDocument()
	})

	it('подсвечивает «Файлы» на модуле «Выполнение», когда открыт /execution/files', async () => {
		nextNavigationMock.pathname = '/execution/files'

		const view = await render(<TopQuickActions user={user()} />)

		await expect.element(view.getByRole('link', { name: 'Файлы' })).toHaveClass('bg-primary')
	})

	it('подсвечивает «Уведомления» на модуле «Факт», когда открыт /fact/notifications', async () => {
		nextNavigationMock.pathname = '/fact/notifications'

		const view = await render(<TopQuickActions user={user()} />)

		await expect.element(view.getByRole('link', { name: 'Уведомления' })).toHaveClass('bg-primary')
	})
})
