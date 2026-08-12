import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Badge } from './badge'

describe('<Badge />', () => {
	it('отображает переданный текст', async () => {
		const view = await render(<Badge tone="success">Согласовано</Badge>)

		await expect.element(view.getByText('Согласовано')).toBeVisible()
	})

	it.each([
		['neutral', 'bg-muted'],
		['info', 'bg-sky-100'],
		['success', 'bg-emerald-100'],
		['warning', 'bg-amber-100'],
		['danger', 'bg-red-100'],
	] as const)('применяет цвет для тона %s', async (tone, expectedClass) => {
		const view = await render(<Badge tone={tone}>Статус</Badge>)

		await expect.element(view.getByText('Статус')).toHaveClass(new RegExp(expectedClass))
	})
})
