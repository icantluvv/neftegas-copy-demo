import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Notification } from '@/packages/api/base/codegen'

function renderWithQueryClient(ui: React.ReactElement) {
	const queryClient = new QueryClient()
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const useGetNotificationsSuspenseMock = vi.hoisted(() => vi.fn())
const useOpenNotificationMock = vi.hoisted(() => vi.fn())
const useMarkAllNotificationsReadMock = vi.hoisted(() => vi.fn())

vi.mock('@/packages/api/base/codegen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/packages/api/base/codegen')>()

	return {
		...actual,
		useGetNotificationsSuspense: useGetNotificationsSuspenseMock,
		useOpenNotification: useOpenNotificationMock,
		useMarkAllNotificationsRead: useMarkAllNotificationsReadMock,
	}
})

const { NotificationsContent } = await import('./notifications-content')

function notification(overrides: Partial<Notification>): Notification {
	return {
		id: 1,
		userId: 1,
		correctionId: 1,
		correctionHumanId: 'COR-000001',
		text: 'Текст уведомления',
		isRead: false,
		createdAt: '2026-08-12T13:46:00.000Z',
		...overrides,
	}
}

const state = {
	notifications: [] as Notification[],
	openMutateMock: vi.fn(),
	markAllReadMutateMock: vi.fn(),
}

beforeEach(() => {
	state.notifications = []
	state.openMutateMock.mockClear()
	state.markAllReadMutateMock.mockClear()

	useGetNotificationsSuspenseMock.mockImplementation(() => ({
		data: state.notifications,
		isPending: false,
	}))
	useOpenNotificationMock.mockImplementation(() => ({
		mutate: state.openMutateMock,
		isPending: false,
	}))
	useMarkAllNotificationsReadMock.mockImplementation(() => ({
		mutate: state.markAllReadMutateMock,
		isPending: false,
	}))
})

describe('<NotificationsContent />', () => {
	it('кнопка «Открыть» помечает запись прочитанной и переходит на корректировку', async () => {
		state.notifications = [notification({ id: 7, correctionHumanId: 'COR-000002', text: 'Событие' })]
		const view = await renderWithQueryClient(<NotificationsContent />)

		await view.getByRole('button', { name: 'Открыть' }).click()

		expect(state.openMutateMock).toHaveBeenCalledWith({ id: 7 }, expect.anything())
		expect(useRouter().push).toHaveBeenCalledWith('/corrections/COR-000002')
	})

	it('фильтр «Только непрочитанные» скрывает прочитанные записи', async () => {
		state.notifications = [
			notification({ id: 1, text: 'Событие А', isRead: false }),
			notification({ id: 2, text: 'Событие Б', isRead: true }),
		]
		const view = await renderWithQueryClient(<NotificationsContent />)

		await view.getByRole('combobox', { name: 'Фильтр по прочитанности' }).click()
		await view.getByRole('option', { name: 'Только непрочитанные' }).click()

		await expect.element(view.getByText('Событие А')).toBeVisible()
		await expect.element(view.getByText('Событие Б')).not.toBeInTheDocument()
	})

	it('фильтр «Только прочитанные» скрывает непрочитанные записи', async () => {
		state.notifications = [
			notification({ id: 1, text: 'Событие А', isRead: false }),
			notification({ id: 2, text: 'Событие Б', isRead: true }),
		]
		const view = await renderWithQueryClient(<NotificationsContent />)

		await view.getByRole('combobox', { name: 'Фильтр по прочитанности' }).click()
		await view.getByRole('option', { name: 'Только прочитанные' }).click()

		await expect.element(view.getByText('Событие Б')).toBeVisible()
		await expect.element(view.getByText('Событие А')).not.toBeInTheDocument()
	})

	it('выключение фильтра возвращает полный список', async () => {
		state.notifications = [
			notification({ id: 1, text: 'Событие А', isRead: false }),
			notification({ id: 2, text: 'Событие Б', isRead: true }),
		]
		const view = await renderWithQueryClient(<NotificationsContent />)

		await view.getByRole('combobox', { name: 'Фильтр по прочитанности' }).click()
		await view.getByRole('option', { name: 'Только непрочитанные' }).click()
		await view.getByRole('combobox', { name: 'Фильтр по прочитанности' }).click()
		await view.getByRole('option', { name: 'Все' }).click()

		await expect.element(view.getByText('Событие Б')).toBeVisible()
	})

	it('«Отметить все прочитанными» вызывает массовую пометку', async () => {
		state.notifications = [notification({ id: 1, isRead: false })]
		const view = await renderWithQueryClient(<NotificationsContent />)

		await view.getByRole('button', { name: 'Отметить все прочитанными' }).click()

		expect(state.markAllReadMutateMock).toHaveBeenCalled()
	})
})
