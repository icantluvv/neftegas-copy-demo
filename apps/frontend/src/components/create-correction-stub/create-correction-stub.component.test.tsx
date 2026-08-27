import { useRouter } from 'next/navigation'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { CreateCorrectionStub } from './create-correction-stub'

describe('<CreateCorrectionStub />', () => {
	it('показывает заголовок и список элементов пакета документов', async () => {
		const view = await render(
			<CreateCorrectionStub cancelHref="/planning" documentNames={['Excel корректировка', 'Пакет документов', 'Счета на оплату']} />,
		)

		await expect.element(view.getByText('Создать корректировку')).toBeVisible()
		await expect.element(view.getByText('Excel корректировка')).toBeVisible()
		await expect.element(view.getByText('Пакет документов')).toBeVisible()
		await expect.element(view.getByText('Счета на оплату')).toBeVisible()
	})

	it('кнопка «Создать» задизейблена — раздел не подключён к бэкенду', async () => {
		const view = await render(<CreateCorrectionStub cancelHref="/planning" documentNames={['Excel корректировка']} />)

		await expect.element(view.getByRole('button', { name: 'Создать' })).toBeDisabled()
	})

	it('«Отмена» возвращает на переданный cancelHref', async () => {
		const view = await render(<CreateCorrectionStub cancelHref="/planning" documentNames={['Excel корректировка']} />)

		await view.getByRole('button', { name: 'Отмена' }).click()

		expect(useRouter().push).toHaveBeenCalledWith('/planning')
	})
})
