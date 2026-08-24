// https://vitest.dev/config/
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { isAgent } from 'std-env'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

const sonnerMock = fileURLToPath(new URL('./src/test/mocks/sonner.ts', import.meta.url))
const nextNavigationMock = fileURLToPath(
	new URL('./src/test/mocks/next-navigation.ts', import.meta.url),
)
const nextScriptMock = fileURLToPath(new URL('./src/test/mocks/next-script.tsx', import.meta.url))
const nextImageMock = fileURLToPath(new URL('./src/test/mocks/next-image.tsx', import.meta.url))
const nextLinkMock = fileURLToPath(new URL('./src/test/mocks/next-link.tsx', import.meta.url))
const dotEnvPath = new URL('./.env', import.meta.url)
const appRoot = fileURLToPath(new URL('./', import.meta.url))

const testExclude = [
	'**/.next/**',
	'**/allure-results/**',
	'**/blob-report/**',
	'**/coverage/**',
	'**/dist/**',
	'**/node_modules/**',
	'**/playwright-report/**',
	'**/test-results/**',
]

const testEnvironmentKeys = [
	'BACK_INTERNAL_URL',
	'BACK_INTERNAL_BASIC_AUTH',
	'MOCK_MODE',
	'DATABASE_URL',
	'NEXT_PUBLIC_APP_NAME',
	'NEXT_PUBLIC_FRONT_URL',
	'NEXT_PUBLIC_BFF_PATH',
	'NEXT_PUBLIC_BACK_URL',
	'NEXT_PUBLIC_MOCK_MODE',
] as const

// Фолбэк для прогона без локального .env (свежий клон, CI): схемы в
// src/env/*.ts валидируются на импорте, и без значений падает любой тест,
// который тянет клиент codegen. Реальные process.env и .env имеют приоритет.
const testEnvironmentFallback: Partial<Record<(typeof testEnvironmentKeys)[number], string>> = {
	BACK_INTERNAL_URL: 'http://localhost:4000',
	MOCK_MODE: 'false',
	NEXT_PUBLIC_APP_NAME: 'Дэшборд Нефтегаз',
	NEXT_PUBLIC_FRONT_URL: 'http://localhost:3000',
	NEXT_PUBLIC_BFF_PATH: '/api',
	NEXT_PUBLIC_BACK_URL: 'http://localhost:4000',
	NEXT_PUBLIC_MOCK_MODE: 'false',
}

const dotEnvEnvironment = existsSync(dotEnvPath) ? parseEnv(readFileSync(dotEnvPath, 'utf8')) : {}

const testEnvironment = Object.fromEntries(
	testEnvironmentKeys.flatMap((key) => {
		const value = process.env[key] ?? dotEnvEnvironment[key] ?? testEnvironmentFallback[key]

		return value === undefined ? [] : [[key, value]]
	}),
)

const testProcessEnvironment: Partial<NodeJS.ProcessEnv> = {
	NODE_ENV: 'test',
	...testEnvironment,
}

export default defineConfig({
	define: {
		__BCP_TEST_ENV__: JSON.stringify(testProcessEnvironment),
	},
	optimizeDeps: {
		exclude: ['@faker-js/faker', 'undici'],
		include: [
			'@base-ui/react/button',
			'@base-ui/react/input',
			'@base-ui/react/select',
			'@hookform/resolvers/zod',
			'@t3-oss/env-nextjs',
			'@tanstack/react-query',
			'class-variance-authority',
			'clsx',
			'nanoid',
			'next/headers',
			'next/link',
			'next/link.js',
			'react-hook-form',
			'tailwind-merge',
			'zod',
			'zod/mini',
		],
	},
	plugins: [
		react(),
		svgr({
			include: '**/*.svg',
			svgrOptions: {
				svgoConfig: {
					plugins: [
						{
							name: 'preset-default',
							params: {
								overrides: {
									removeViewBox: false,
								},
							},
						},
					],
				},
			},
		}),
	],
	resolve: {
		alias: [
			// tsconfigPaths резолвит "@/..." для самих модулей, но не для мокера
			// vitest: importOriginal() внутри vi.mock падает на "Cannot resolve".
			// Явный алиас закрывает оба пути резолва.
			{ find: /^@\//, replacement: appRoot },
			{ find: /^next\/navigation$/, replacement: nextNavigationMock },
			{ find: /^next\/script$/, replacement: nextScriptMock },
			{ find: /^next\/image$/, replacement: nextImageMock },
			{ find: /^next\/link$/, replacement: nextLinkMock },
			{ find: /^sonner$/, replacement: sonnerMock },
		],
		tsconfigPaths: true,
	},
	test: {
		clearMocks: true,
		coverage: {
			exclude: [
				...testExclude,
				'**/*.d.ts',
				'**/*.{test,spec}.{ts,tsx}',
				'**/*.stories.{ts,tsx}',
				'**/codegen/**',
				'**/openapi/**',
				'**/*.config.{ts,tsx,mts,cts,js,mjs,cjs}',
				'next-env.d.ts',
				'src/fonts/**',
				'src/styles/**',
			],
			include: ['app/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov', 'json', 'json-summary', 'cobertura'],
			reportsDirectory: './coverage/vitest',
		},
		css: true,
		env: testProcessEnvironment,
		deps: {
			optimizer: {
				client: {
					enabled: true,
					include: [
						'@faker-js/faker',
						'class-variance-authority',
						'nanoid',
						'next/dist/client/components/navigation',
						'next/dist/client/link',
						'next/dist/shared/lib/app-router-context.shared-runtime',
						'next/headers',
						'next/link',
						'next/link.js',
						'vitest-browser-react',
					],
				},
			},
		},
		globals: true,
		setupFiles: ['./src/test/setup-env.ts'],
		outputFile: {
			json: './test-results/vitest.json',
			junit: './test-results/vitest.junit.xml',
		},
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: testExclude,
					include: ['**/*.unit.test.{ts,tsx}'],
					name: 'unit',
					setupFiles: [
						'allure-vitest/setup',
						'./src/test/setup-env.ts',
						'./src/test/setup-allure-unit.ts',
					],
				},
			},
			{
				extends: true,
				test: {
					browser: {
						enabled: true,
						headless: true,
						instances: [{ browser: 'chromium' }],
						provider: playwright(),
					},
					exclude: testExclude,
					include: ['**/*.component.test.{ts,tsx}'],
					name: 'component',
					setupFiles: [
						'allure-vitest/browser/setup',
						'./src/test/setup-env.ts',
						'./src/test/setup-browser.ts',
						'./src/test/setup-allure-component.ts',
					],
				},
			},
		],
		reporters: isAgent
			? ['agent']
			: [
					'default',
					'junit',
					'json',
					['allure-vitest/reporter', { resultsDir: './allure-results' }],
				],
		restoreMocks: true,
		unstubGlobals: true,
	},
})
