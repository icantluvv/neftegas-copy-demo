import { clientEnvironment } from '#/env/client'

export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'
export const isProductionApp = clientEnvironment.NEXT_PUBLIC_APP_NAME === 'gas-dashboard-prod'

export function isBrowser() {
	return Boolean(typeof window !== 'undefined')
}
