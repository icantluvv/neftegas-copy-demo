import type { ColumnDef } from '@tanstack/react-table'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { DataTable } from './data-table'

interface Row {
	label: string
	required: boolean
}

const columns: ColumnDef<Row, any>[] = [
	{ accessorKey: 'label', header: 'Элемент' },
	{ accessorKey: 'required', header: 'Обязателен', cell: (ctx) => (ctx.getValue() ? 'Да' : 'Нет') },
]

describe('<DataTable />', () => {
	it('рендерит строки данных по колонкам', async () => {
		const view = await render(
			<DataTable columns={columns} data={[{ label: 'Excel корректировка', required: true }]} />,
		)

		await expect.element(view.getByText('Excel корректировка')).toBeVisible()
		await expect.element(view.getByText('Да')).toBeVisible()
	})

	it('показывает сообщение о пустых данных', async () => {
		const view = await render(<DataTable columns={columns} data={[]} emptyMessage="Пока пусто" />)

		await expect.element(view.getByText('Пока пусто')).toBeVisible()
	})
})
