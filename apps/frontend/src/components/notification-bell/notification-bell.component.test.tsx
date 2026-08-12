import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { userEvent } from '@vitest/browser/context'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Notification } from '@/packages/api/base/codegen'

function renderWithQueryClient(ui: React.ReactElement) {
	const queryClient = new QueryClient()
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const useGetNotificationsMock = vi.hoisted(() => vi.fn())
const useOpenNotificationMock = vi.hoisted(() => vi.fn())
const useMarkAllNotificationsReadMock = vi.hoisted(() => vi.fn())

vi.mock('@/packages/api/base/codegen', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/packages/api/base/codegen')>()

	return {
		...actual,
		useGetNotifications: useGetNotificationsMock,
		useOpenNotification: useOpenNotificationMock,
		useMarkAllNotificationsRead: useMarkAllNotificationsReadMock,
	}
})

const { NotificationBell } = await import('./notification-bell')

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
	refetchIntervalSeen: undefined as number | undefined,
}

beforeEach(() => {
	state.notifications = []
	state.openMutateMock.mockClear()
	state.markAllReadMutateMock.mockClear()
	state.refetchIntervalSeen = undefined

	useGetNotificationsMock.mockImplementation((options?: { query?: { refetchInterval?: number } }) => {
		state.refetchIntervalSeen = options?.query?.refetchInterval
		return {
			data: state.notifications,
			isPending: false,
		}
	})
	useOpenNotificationMock.mockImplementation(() => ({
		mutate: state.openMutateMock,
		isPending: false,
	}))
	useMarkAllNotificationsReadMock.mockImplementation(() => ({
		mutate: state.markAllReadMutateMock,
		isPending: false,
	}))
})

describe('<NotificationBell />', () => {
	it('скрывает бейдж при нуле непрочитанных', async () => {
		state.notifications = [notification({ id: 1, isRead: true })]
		const view = await renderWithQueryClient(<NotificationBell />)

		await expect.element(view.getByTestId('notification-badge')).not.toBeInTheDocument()
	})

	it('показывает точное число непрочитанных от 1 до 9', async () => {
		state.notifications = [
			notification({ id: 1, isRead: false }),
			notification({ id: 2, isRead: false }),
			notification({ id: 3, isRead: true }),
		]
		const view = await renderWithQueryClient(<NotificationBell />)

		await expect.element(view.getByTestId('notification-badge')).toHaveTextContent('2')
	})

	it('показывает «9+» при числе непрочитанных больше 9', async () => {
		state.notifications = Array.from({ length: 14 }, (_, i) => notification({ id: i + 1, isRead: false }))
		const view = await renderWithQueryClient(<NotificationBell />)

		await expect.element(view.getByTestId('notification-badge')).toHaveTextContent('9+')
	})

	it('настраивает фоновый опрос раз в 60 секунд', async () => {
		await renderWithQueryClient(<NotificationBell />)

		expect(state.refetchIntervalSeen).toBe(60_000)
	})

	it('клик по колокольчику открывает панель без перехода маршрута', async () => {
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()

		await expect.element(view.getByText('Новых уведомлений нет')).toBeVisible()
		expect(useRouter().push).not.toHaveBeenCalled()
	})

	it('повторный клик по колокольчику закрывает панель', async () => {
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()
		await view.getByRole('button', { name: 'Уведомления' }).click()

		await expect.element(view.getByText('Новых уведомлений нет')).not.toBeInTheDocument()
	})

	it('Escape закрывает панель', async () => {
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()
		await userEvent.keyboard('{Escape}')

		await expect.element(view.getByText('Новых уведомлений нет')).not.toBeInTheDocument()
	})

	it('клик вне панели закрывает её', async () => {
		const view = await renderWithQueryClient(
			<div>
				<NotificationBell />
				<button type="button">Снаружи</button>
			</div>,
		)

		await view.getByRole('button', { name: 'Уведомления' }).click()
		await view.getByRole('button', { name: 'Снаружи' }).click()

		await expect.element(view.getByText('Новых уведомлений нет')).not.toBeInTheDocument()
	})

	it('показывает не более 7 последних уведомлений и выделяет непрочитанные', async () => {
		state.notifications = Array.from({ length: 9 }, (_, i) =>
			notification({ id: i + 1, text: `Событие ${i + 1}`, isRead: i % 2 === 0 }),
		)
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()

		await expect.element(view.getByText('Событие 1')).toBeVisible()
		await expect.element(view.getByText('Событие 7')).toBeVisible()
		await expect.element(view.getByText('Событие 8')).not.toBeInTheDocument()
		await expect.element(view.getByText('Событие 2').element().closest('button')!).toHaveClass(/font-bold/)
	})

	it('ссылка «Все уведомления» ведёт на /notifications', async () => {
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()

		await expect.element(view.getByRole('link', { name: 'Все уведомления' })).toHaveAttribute('href', '/notifications')
	})

	it('клик по записи помечает её прочитанной и переходит на корректировку', async () => {
		state.notifications = [notification({ id: 42, correctionHumanId: 'COR-000002', text: 'Важное событие' })]
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()
		await view.getByText('Важное событие').click()

		expect(state.openMutateMock).toHaveBeenCalledWith({ id: 42 }, expect.anything())
		expect(useRouter().push).toHaveBeenCalledWith('/corrections/COR-000002')
		await expect.element(view.getByText('Важное событие')).not.toBeInTheDocument()
	})

	it('«Отметить все прочитанными» вызывает массовую пометку', async () => {
		state.notifications = [notification({ id: 1, isRead: false })]
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()
		await view.getByRole('button', { name: 'Отметить все прочитанными' }).click()

		expect(state.markAllReadMutateMock).toHaveBeenCalled()
	})

	it('открытие панели не вызывает мутации пометки', async () => {
		state.notifications = [notification({ id: 1, isRead: false })]
		const view = await renderWithQueryClient(<NotificationBell />)

		await view.getByRole('button', { name: 'Уведомления' }).click()

		expect(state.openMutateMock).not.toHaveBeenCalled()
		expect(state.markAllReadMutateMock).not.toHaveBeenCalled()
	})
})
