import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Button } from '../button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from './dialog'

function TestDialog() {
	return (
		<Dialog>
			<DialogTrigger render={<Button>Открыть</Button>} />
			<DialogContent>
				<DialogTitle>Заголовок диалога</DialogTitle>
				<DialogDescription>Описание диалога</DialogDescription>
				<DialogFooter>
					<Button>Подтвердить</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

describe('<Dialog />', () => {
	it('не показывает содержимое до открытия', async () => {
		const view = await render(<TestDialog />)

		await expect
			.element(view.getByText('Заголовок диалога', { exact: true }))
			.not.toBeInTheDocument()
	})

	it('открывается по клику на триггер и показывает заголовок/описание', async () => {
		const view = await render(<TestDialog />)

		await view.getByRole('button', { name: 'Открыть' }).click()

		await expect.element(view.getByText('Заголовок диалога')).toBeVisible()
		await expect.element(view.getByText('Описание диалога')).toBeVisible()
	})

	it('закрывается по клику на кнопку закрытия', async () => {
		const view = await render(<TestDialog />)

		await view.getByRole('button', { name: 'Открыть' }).click()
		await view.getByRole('button', { name: 'Закрыть' }).click()

		await expect
			.element(view.getByText('Заголовок диалога', { exact: true }))
			.not.toBeInTheDocument()
	})
})
