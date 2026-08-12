import { expect, request, test } from '@playwright/test'

const PASSWORD = 'Password123'
// ID из демо-сида apps/backend/src/database/seed.ts: Донбассгаз (filialId 1)
// связан с АНГНКС (cfoId 1), единственный CorrectionType — STANDARD (id 1).
const CORRECTION_TYPE_ID = 1
const CFO_ID = 1

async function fillAndSubmitLoginForm(page: import('@playwright/test').Page, email: string) {
	await page.getByLabel('Email').fill(email)
	await page.getByLabel('Пароль').fill(PASSWORD)
	await page.getByRole('button', { name: 'Войти' }).click()
}

async function login(page: import('@playwright/test').Page, email: string) {
	await page.goto('/')
	await page.waitForLoadState('load')
	await fillAndSubmitLoginForm(page, email)

	try {
		await page.waitForURL(/\/dashboard$/, { timeout: 5_000 })
	} catch {
		// Клик мог случиться до того, как клиентский обработчик формы
		// навесился (hydration race) — форма ушла нативным GET. Повторяем.
		await page.goto('/')
		await page.waitForLoadState('load')
		await fillAndSubmitLoginForm(page, email)
		await page.waitForURL(/\/dashboard$/, { timeout: 5_000 })
	}
}

async function resetCfoUnreadNotifications(baseURL: string) {
	const api = await request.newContext({ baseURL })
	try {
		await api.post('/api/auth/login', { data: { email: 'cfo@demo.local', password: PASSWORD } })
		await api.post('/api/notifications/read-all')
	} finally {
		await api.dispose()
	}
}

async function seedCorrectionSentToCfo(baseURL: string): Promise<string> {
	await resetCfoUnreadNotifications(baseURL)

	const api = await request.newContext({ baseURL })
	try {
		await api.post('/api/auth/login', { data: { email: 'filial@demo.local', password: PASSWORD } })

		const created = await api.post('/api/corrections', { data: { correctionTypeId: CORRECTION_TYPE_ID } })
		const correction = (await created.json()) as { humanId: string; slots: { id: number }[] }
		if (!Array.isArray(correction.slots)) {
			throw new Error(`unexpected create response: ${created.status()} ${JSON.stringify(correction)}`)
		}

		for (const slot of correction.slots) {
			await api.post(`/api/corrections/${correction.humanId}/slots/${slot.id}/files`, {
				multipart: {
					file: {
						name: 'file.txt',
						mimeType: 'text/plain',
						buffer: Buffer.from('e2e-fixture'),
					},
				},
			})
		}

		await api.post(`/api/corrections/${correction.humanId}/send`, { data: { cfoIds: [CFO_ID] } })

		return correction.humanId
	} finally {
		await api.dispose()
	}
}

test('колокольчик → панель → клик по записи открывает корректировку и обнуляет бейдж', async ({ page, baseURL }) => {
	const humanId = await seedCorrectionSentToCfo(baseURL!)

	await login(page, 'cfo@demo.local')

	const bell = page.getByRole('button', { name: 'Уведомления' })
	await expect(bell.getByTestId('notification-badge')).toBeVisible()

	await bell.click()
	const entry = page.getByText(new RegExp(humanId))
	await expect(entry).toBeVisible()
	await entry.click()

	await expect(page).toHaveURL(new RegExp(`/corrections/${humanId}$`))
	await expect(bell.getByTestId('notification-badge')).not.toBeVisible()
})

test('/notifications: «Отметить все прочитанными» обнуляет бейдж и снимает выделение', async ({ page, baseURL }) => {
	await seedCorrectionSentToCfo(baseURL!)

	await login(page, 'cfo@demo.local')
	await page.goto('/notifications')

	const bell = page.getByRole('button', { name: 'Уведомления' })
	await expect(bell.getByTestId('notification-badge')).toBeVisible()

	await page.getByRole('button', { name: 'Отметить все прочитанными' }).click()

	await expect(bell.getByTestId('notification-badge')).not.toBeVisible()
	await expect(page.locator('tr.font-bold')).toHaveCount(0)
})
