import { expect, test } from '@playwright/test'

const PASSWORD = 'Password123'

async function login(page: import('@playwright/test').Page, email: string) {
	await page.goto('/')
	await page.getByLabel('Email').fill(email)
	await page.getByLabel('Пароль').fill(PASSWORD)
	await page.getByRole('button', { name: 'Войти' }).click()
}

test('успешный вход FILIAL перенаправляет на /dashboard и показывает дашборд филиала', async ({ page }) => {
	await login(page, 'filial@demo.local')

	await expect(page).toHaveURL(/\/dashboard$/)
	await expect(page.getByRole('heading', { name: 'Филиал' })).toBeVisible()
})

test('успешный вход CFO перенаправляет на /dashboard и показывает дашборд ЦФО', async ({ page }) => {
	await login(page, 'cfo@demo.local')

	await expect(page).toHaveURL(/\/dashboard$/)
	await expect(page.getByRole('heading', { name: 'ЦФО' })).toBeVisible()
})

test('успешный вход DTOE перенаправляет на /dashboard и показывает дашборд ДТОиР', async ({ page }) => {
	await login(page, 'dtoe@demo.local')

	await expect(page).toHaveURL(/\/dashboard$/)
	await expect(page.getByRole('heading', { name: 'ДТОиР' })).toBeVisible()
})

test('старые ролевые маршруты /filial, /cfo, /dtoe удалены', async ({ page }) => {
	await login(page, 'cfo@demo.local')
	await expect(page).toHaveURL(/\/dashboard$/)

	const filialResponse = await page.goto('/filial')
	expect(filialResponse?.status()).toBe(404)

	const dtoeResponse = await page.goto('/dtoe')
	expect(dtoeResponse?.status()).toBe(404)
})
