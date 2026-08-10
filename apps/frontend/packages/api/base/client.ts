import { isDev } from '#/constants/env'
import { clientEnvironment } from '#/env/client'
import { serverEnvironment } from '#/env/server'
import {
	getBrowserMockScenario,
	getRequestMockScenario,
	isBrowserRuntimeMockModeEnabled,
	isRequestMockModeEnabled,
} from '#/mock-mode/runtime'

import {
	getOnProfileIncomplete,
	getOnUnauthorized,
	getServerUnauthorizedRetryHeaders,
} from './client-handlers'
import { serializeSearchParams } from './search-params'

export { setOnProfileIncomplete, setOnUnauthorized } from './client-handlers'

/** Subset of FetchRequestConfig */
export interface RequestConfig<TData = unknown> {
	baseURL?: string
	url?: string
	method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
	params?: object
	data?: TData | FormData
	signal?: AbortSignal
	headers?: [string, string][] | Record<string, string>
	credentials?: RequestCredentials
}

/** Subset of FetchResponse */
export interface ResponseConfig<TData = unknown> {
	data: TData
	status: number
	statusText: string
	headers: Headers
}

let _config: Partial<RequestConfig> = {}

export const getConfig = () => _config

export function setConfig(config: Partial<RequestConfig>) {
	_config = config
	return getConfig()
}

export function mergeConfig<T extends RequestConfig>(...configs: Array<Partial<T>>): Partial<T> {
	return configs.reduce<Partial<T>>((merged, config) => {
		return {
			...merged,
			...config,
			headers: {
				...(Array.isArray(merged.headers)
					? Object.fromEntries(merged.headers)
					: merged.headers),
				...(Array.isArray(config.headers)
					? Object.fromEntries(config.headers)
					: config.headers),
			},
		}
	}, {})
}

export type ResponseErrorConfig<TError = unknown> = TError

export type Client = <TData, _TError = unknown, TVariables = unknown>(
	config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>

function getBaseUrl() {
	if (typeof window === 'undefined') {
		return serverEnvironment.BACK_INTERNAL_URL
	}

	if (isDev) {
		return clientEnvironment.NEXT_PUBLIC_BFF_PATH
	}

	return clientEnvironment.NEXT_PUBLIC_BACK_URL
}

function isEnvFlagEnabled(value: boolean | string | undefined) {
	// В CI skipValidation возвращает raw env-строки без zod transform.
	return value === true || value === 'true'
}

async function isMockModeEnabled(config: Partial<RequestConfig>) {
	if (typeof window === 'undefined') {
		if (
			isEnvFlagEnabled(process.env.MOCK_MODE) ||
			isEnvFlagEnabled(serverEnvironment.MOCK_MODE) ||
			isRequestMockModeEnabled(config.headers)
		) {
			return true
		}

		if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') {
			return false
		}

		try {
			const { headers } = await import('next/headers')
			return isRequestMockModeEnabled(await headers())
		} catch {
			return false
		}
	}

	return (
		isEnvFlagEnabled(process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE) ||
		isEnvFlagEnabled(clientEnvironment.NEXT_PUBLIC_MOCK_MODE) ||
		isRequestMockModeEnabled(config.headers) ||
		isBrowserRuntimeMockModeEnabled()
	)
}

async function getRawMockScenario(config: Partial<RequestConfig>) {
	const rawFromConfig = getRequestMockScenario(config.headers)
	if (rawFromConfig != null) {
		return rawFromConfig
	}

	if (typeof window === 'undefined') {
		if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') {
			return
		}

		try {
			const { headers } = await import('next/headers')
			return getRequestMockScenario(await headers())
		} catch {
			return
		}
	}

	return getBrowserMockScenario()
}

async function getMockScenario(config: Partial<RequestConfig>) {
	const raw = await getRawMockScenario(config)
	if (raw == null) return

	const { isBaseMockScenarioName } = await import('./mock-scenarios')
	if (!isBaseMockScenarioName(raw)) return
	return raw
}

async function getResponseJson<TData>(response: Response) {
	try {
		return (await response.json()) as TData
	} catch {
		return undefined
	}
}

async function getAuthHeaders(): Promise<HeadersInit> {
	const resolvedHeaders: HeadersInit = {}
	if (typeof window !== 'undefined') return resolvedHeaders
	const basicAuth = serverEnvironment.BACK_INTERNAL_BASIC_AUTH
	if (basicAuth != null) {
		resolvedHeaders.Authorization = `Basic ${basicAuth}`
	}
	const { headers } = await import('next/headers')
	const cookiesHeader = (await headers()).get('Cookie')
	if (cookiesHeader != null) {
		resolvedHeaders.Cookie = cookiesHeader
	}
	return resolvedHeaders
}

async function fetch<TData, TError = unknown, TVariables = unknown>(
	paramsConfig: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> {
	const config = mergeConfig(getConfig(), paramsConfig)

	const isMockMode = await isMockModeEnabled(config)
	if (isMockMode) {
		const { getMockResponse } = await import('./mock-client')
		const scenario = await getMockScenario(config)
		return getMockResponse<TData>(config, scenario)
	}

	const baseURL = getBaseUrl()
	let targetUrl = [baseURL, config.url].filter(Boolean).join('')

	if (config.params) {
		const serializedSearchParams = serializeSearchParams(config.params)
		if (serializedSearchParams !== '') {
			targetUrl += `?${serializedSearchParams}`
		}
	}

	const isFormData = config.data instanceof FormData
	const authHeaders = await getAuthHeaders()
	const requestHeaders = new Headers({
		...authHeaders,
		...(Array.isArray(config.headers) ? Object.fromEntries(config.headers) : config.headers),
		...(!isFormData && { 'Content-Type': 'application/json' }),
	})
	const method = config.method ?? 'GET'

	const response = await globalThis.fetch(targetUrl, {
		credentials: config.credentials ?? 'include',
		method,
		body: isFormData ? (config.data as FormData) : JSON.stringify(config.data),
		signal: config.signal,
		headers: requestHeaders,
	})

	if (response.status === 401) {
		const onUnauthorized = getOnUnauthorized()
		const retryHeaders = onUnauthorized
			? requestHeaders
			: await getServerUnauthorizedRetryHeaders(requestHeaders)

		if (onUnauthorized) {
			await onUnauthorized()
		}

		if (retryHeaders === null) {
			const errorData = await getResponseJson<TError>(response)

			throw new Error(response.statusText, {
				cause: {
					data: errorData,
					status: response.status,
					statusText: response.statusText,
				},
			})
		}

		const retryResponse = await globalThis.fetch(targetUrl, {
			credentials: config.credentials ?? 'include',
			method: config.method?.toUpperCase(),
			body: isFormData ? (config.data as FormData) : JSON.stringify(config.data),
			signal: config.signal,
			headers: retryHeaders,
		})
		if (retryResponse.status === 304) {
			return {
				data: {} as TData,
				status: retryResponse.status,
				statusText: retryResponse.statusText,
				headers: retryResponse.headers,
			}
		}
		if (!retryResponse.ok) {
			const errorData = await getResponseJson<TError>(retryResponse)

			throw new Error(retryResponse.statusText, {
				cause: {
					data: errorData,
					status: retryResponse.status,
					statusText: retryResponse.statusText,
				},
			})
		}
		const retryData =
			[204, 205, 304].includes(retryResponse.status) || !retryResponse.body
				? {}
				: await getResponseJson(retryResponse)
		return {
			data: retryData as TData,
			status: retryResponse.status,
			statusText: retryResponse.statusText,
			headers: retryResponse.headers,
		}
	}

	if (response.status === 304) {
		return {
			data: {} as TData,
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		}
	}

	if (!response.ok) {
		const errorData = await getResponseJson<{ error?: string }>(response)
		if (response.status === 403 && errorData?.error === 'profile_incomplete') {
			getOnProfileIncomplete()?.()
		}
		throw new Error(response.statusText, {
			cause: {
				data: errorData,
				status: response.status,
				statusText: response.statusText,
			},
		})
	}

	const data =
		[204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

	return {
		data: data as TData,
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	}
}

fetch.getConfig = getConfig
fetch.setConfig = setConfig

export default fetch
