import { expect, test } from '@playwright/test'

const PASSWORD = 'Password123'

async function login(page: import('@playwright/test').Page, email: string) {
	await page.goto('/')
	await page.getByLabel('Email').fill(email)
	await page.getByLabel('Пароль').fill(PASSWORD)
	await page.getByRole('button', { name: 'Войти' }).click()
}

test('успешный вход FILIAL перенаправляет на /filial', async ({ page }) => {
	await login(page, 'filial@demo.local')

	await expect(page).toHaveURL(/\/filial$/)
})

test('успешный вход CFO перенаправляет на /cfo', async ({ page }) => {
	await login(page, 'cfo@demo.local')

	await expect(page).toHaveURL(/\/cfo$/)
})

test('CFO, открывший /dtoe напрямую, видит экран «Доступ запрещён»', async ({ page }) => {
	await login(page, 'cfo@demo.local')
	await expect(page).toHaveURL(/\/cfo$/)

	await page.goto('/dtoe')

	await expect(page.getByText('Доступ запрещён')).toBeVisible()
})
