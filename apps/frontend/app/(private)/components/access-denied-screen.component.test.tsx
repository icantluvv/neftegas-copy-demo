import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { AccessDeniedScreen } from './access-denied-screen'

describe('<AccessDeniedScreen />', () => {
	it('отображает сообщение «Доступ запрещён»', async () => {
		const view = await render(<AccessDeniedScreen />)

		await expect.element(view.getByText('Доступ запрещён')).toBeVisible()
	})
})
