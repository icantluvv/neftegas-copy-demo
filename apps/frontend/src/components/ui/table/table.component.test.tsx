import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

describe('<Table />', () => {
	it('отображает заголовки и строки данных', async () => {
		const view = await render(
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Элемент</TableHead>
						<TableHead>Обязателен</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>Excel корректировка</TableCell>
						<TableCell>Да</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		)

		await expect.element(view.getByText('Элемент')).toBeVisible()
		await expect.element(view.getByText('Excel корректировка')).toBeVisible()
	})
})
