import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Notification } from '@/packages/api/base/codegen'

import { notificationsColumns } from './notifications-columns'
import { NotificationsTable } from './notifications-table'

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

const noop = () => {}

describe('<NotificationsTable />', () => {
	it('показывает колонки «Дата» и «Сообщение»', async () => {
		const view = await render(
			<NotificationsTable
				data={[notification({ id: 1 })]}
				columns={notificationsColumns}
				sorting={[]}
				onSortingChange={noop}
				onOpen={noop}
			/>,
		)

		await expect.element(view.getByText('Дата')).toBeVisible()
		await expect.element(view.getByText('Сообщение')).toBeVisible()
	})

	it('выделяет непрочитанные строки жирным', async () => {
		const view = await render(
			<NotificationsTable
				data={[
					notification({ id: 1, text: 'Событие А', isRead: false }),
					notification({ id: 2, text: 'Событие Б', isRead: true }),
				]}
				columns={notificationsColumns}
				sorting={[]}
				onSortingChange={noop}
				onOpen={noop}
			/>,
		)

		await expect.element(view.getByText('Событие А').element().closest('tr')!).toHaveClass(/font-bold/)
		await expect.element(view.getByText('Событие Б').element().closest('tr')!).not.toHaveClass(/font-bold/)
	})

	it('показывает «Уведомлений нет» при пустом списке', async () => {
		const view = await render(
			<NotificationsTable data={[]} columns={notificationsColumns} sorting={[]} onSortingChange={noop} onOpen={noop} />,
		)

		await expect.element(view.getByText('Уведомлений нет')).toBeVisible()
	})

	it('кнопка «Открыть» вызывает onOpen с данными строки', async () => {
		const onOpen = vi.fn()
		const view = await render(
			<NotificationsTable
				data={[notification({ id: 7, correctionHumanId: 'COR-000002', text: 'Событие' })]}
				columns={notificationsColumns}
				sorting={[]}
				onSortingChange={noop}
				onOpen={onOpen}
			/>,
		)

		await view.getByRole('button', { name: 'Открыть' }).click()

		expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
	})
})
