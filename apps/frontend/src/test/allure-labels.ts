import { label } from 'allure-js-commons'

export const frontendAllureLayers = {
	e2e: 'E2E-front',
	unit: 'Unit-front',
	component: 'Component-front',
} as const

export type FrontendAllureLayer = (typeof frontendAllureLayers)[keyof typeof frontendAllureLayers]

export const FRONTEND_ALLURE_FALLBACK_FEATURE = 'Инфраструктура фронта'

const featureByPath = [
	{ feature: 'Смена email', includes: ['/app/account/email-change/'] },
	{ feature: 'Личный кабинет', includes: ['/app/account/'] },
	{
		feature: 'Каталог',
		includes: [
			'/app/catalog/',
			'/e2e/logic-',
			'/e2e/quiz-',
			'/e2e/rebus-',
			'/src/components/information-dialogs/catalog/',
		],
	},
	{
		feature: 'Регистрация',
		includes: ['/app/registration/', '/e2e/registration-open.e2e.spec.ts'],
	},
	{ feature: 'Вход', includes: ['/app/login/'] },
	{
		feature: 'Главная страница',
		includes: ['/app/(public)/(home)/', '/app/api/media/hymn/'],
	},
	{
		feature: 'Роутинг',
		includes: ['/app/sitemap.unit.test.ts', '/e2e/pages-status.e2e.spec.ts'],
	},
	{ feature: 'Безопасность', includes: ['/headers.unit.test.ts'] },
	{ feature: 'Формы', includes: ['/src/components/form/'] },
	{
		feature: 'Информационные диалоги',
		includes: ['/src/components/information-dialogs/'],
	},
	{
		feature: 'Обработка ошибок',
		includes: ['/src/components/utilities/error-boundary/'],
	},
	{ feature: 'Уведомления', includes: ['/src/components/header/notifications/'] },
	{ feature: 'Навигация', includes: ['/src/components/header/'] },
	{
		feature: 'UI-компоненты',
		includes: [
			'/src/components/mascot-icon/',
			'/src/components/message-screen.component.test.tsx',
		],
	},
	{ feature: 'Авторизация', includes: ['/src/lib/auth/'] },
	{
		feature: 'Моки API',
		includes: [
			'/packages/api/base/mock-scenarios.unit.test.ts',
			'/packages/api/plugins/',
			'/src/mock-mode/',
			'/src/mock-page/',
		],
	},
	{ feature: 'API-клиент', includes: ['/packages/api/base/'] },
	{ feature: 'Утилиты', includes: ['/src/lib/pluralize.unit.test.ts', '/src/utils/'] },
	{ feature: 'Инфраструктура приложения', includes: ['/app/layout.unit.test.tsx'] },
	{ feature: 'Инфраструктура тестов', includes: ['/src/test/'] },
] as const satisfies ReadonlyArray<{
	feature: string
	includes: readonly string[]
}>

function getNormalizedPathVariants(testPath: string) {
	const normalizedPath = `/${testPath.replaceAll('\\', '/')}`
	const pathWithoutRouteGroups = normalizedPath.replace(/\/\([^)]+\)/g, '')

	return [normalizedPath, pathWithoutRouteGroups]
}

export function getFrontendAllureFeature(testPath: string) {
	const normalizedPaths = getNormalizedPathVariants(testPath)
	const matchedFeature = featureByPath.find(({ includes }) =>
		includes.some((path) =>
			normalizedPaths.some((normalizedPath) => normalizedPath.includes(path)),
		),
	)

	return matchedFeature?.feature ?? FRONTEND_ALLURE_FALLBACK_FEATURE
}

export async function setFrontendAllureLabels(testPath: string, layer: FrontendAllureLayer) {
	await label('Epic', '')
	await label('Feature', getFrontendAllureFeature(testPath))
	await label('layer', layer)
}
