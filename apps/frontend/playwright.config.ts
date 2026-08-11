import { defineConfig, devices } from '@playwright/test'

const isCI = process.env.CI === 'true' || process.env.CI === '1'
const fallbackBaseURL = 'http://localhost:3000'
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL
const configuredWebServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
const configuredHttpCredentials = process.env.PLAYWRIGHT_HTTP_CREDENTIALS
const skipWebServer =
	process.env.PLAYWRIGHT_SKIP_WEB_SERVER === 'true' ||
	process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1'

const baseURL =
	configuredBaseURL != null && configuredBaseURL !== '' ? configuredBaseURL : fallbackBaseURL

const webServerCommand =
	configuredWebServerCommand != null && configuredWebServerCommand !== ''
		? configuredWebServerCommand
		: 'node --env-file=.env node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000'

const webServers = [
	{
		command: webServerCommand,
		reuseExistingServer: false,
		timeout: 120_000,
		url: baseURL,
	},
]

export function getPlaywrightHttpCredentials(credentials?: string) {
	if (credentials == null || credentials === '') {
		return undefined
	}

	const [username, password] = credentials.split(':')

	if (username == null || username === '' || password == null || password === '') {
		return undefined
	}

	return {
		password,
		username,
	}
}

const httpCredentials = getPlaywrightHttpCredentials(configuredHttpCredentials)

export default defineConfig({
	forbidOnly: isCI,
	fullyParallel: true,
	outputDir: './test-results/playwright',
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	reporter: [
		['list'],
		['html', { open: 'never', outputFolder: './playwright-report' }],
		['junit', { outputFile: './test-results/playwright.junit.xml' }],
		[
			'allure-playwright',
			{
				detail: true,
				resultsDir: './allure-results',
				suiteTitle: false,
			},
		],
	],
	retries: isCI ? 2 : 0,
	testDir: './e2e',
	testMatch: '**/*.e2e.spec.ts',
	use: {
		baseURL,
		...(httpCredentials != null ? { httpCredentials } : {}),
		trace: 'on-first-retry',
	},
	webServer: skipWebServer ? undefined : webServers,
	workers: isCI ? 1 : undefined,
})
