import type { JsonLogOptionalFields } from '@repo/logger'
import type { AxiosRequestConfig } from 'axios'

import _logger, { serializeError } from '@repo/logger'
import axios from 'axios'

import { getOnUnauthorized, getServerUnauthorizedRetryHeaders } from './client-handlers'
import { serializeSearchParams } from './search-params'

export { setOnUnauthorized, setServerUnauthorizedRetryHeadersHandler } from './client-handlers'

const logger = _logger.ns('api-client').seal()
const isDev = process.env.NODE_ENV !== 'production'

/** Форма конфига, которую ожидает Kubb-сгенерированный код (client-agnostic). */
export interface RequestConfig<TData = unknown> {
	baseURL?: string
	url?: string
	method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
	params?: object
	data?: TData | FormData
	signal?: AbortSignal
	headers?: [string, string][] | Record<string, string>
}

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
				...(Array.isArray(merged.headers) ? Object.fromEntries(merged.headers) : merged.headers),
				...(Array.isArray(config.headers) ? Object.fromEntries(config.headers) : config.headers),
			},
		}
	}, {})
}

export type ResponseErrorConfig<TError = unknown> = TError

export type Client = <TData, _TError = unknown, TVariables = unknown>(
	config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>

// Единственный инстанс axios на процесс. Ретраи и редиректы на 401 сделаны
// ручным ретраем запроса (как в референсном fetch-клиенте), а не через
// interceptors — так поток управления читается линейно и однозначно.
const instance = axios.create({ withCredentials: true, validateStatus: () => true })

function getBaseUrl() {
	if (typeof window === 'undefined') {
		// Сервер (RSC/route handlers) стучится в бэкенд напрямую, минуя прокси.
		return process.env.BACK_INTERNAL_URL ?? 'http://localhost:4000/api'
	}

	// Браузер всегда идёт на свой собственный origin — next.config.ts проксирует
	// /api/* на бэкенд (rewrites()). Так httpOnly-cookie остаются same-site и в
	// dev, и в контейнерах, без настройки CORS.
	return process.env.NEXT_PUBLIC_BACK_URL ?? '/api'
}

async function getForwardedCookieHeader(): Promise<string | undefined> {
	if (typeof window !== 'undefined') {
		return undefined
	}

	try {
		const { headers } = await import('next/headers')
		return (await headers()).get('cookie') ?? undefined
	} catch {
		return undefined
	}
}

function toPlainHeaders(headers?: [string, string][] | Record<string, string>) {
	return Array.isArray(headers) ? Object.fromEntries(headers) : (headers ?? {})
}

function throwApiError(status: number, statusText: string, data: unknown): never {
	throw new Error(statusText || `Request failed with status ${status}`, {
		cause: { data, status, statusText },
	})
}

async function client<TData, TError = unknown, TVariables = unknown>(
	paramsConfig: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> {
	const config = mergeConfig(getConfig(), paramsConfig)
	const baseURL = config.baseURL ?? getBaseUrl()
	const forwardedCookie = await getForwardedCookieHeader()

	const headers: Record<string, string> = {
		...(forwardedCookie ? { Cookie: forwardedCookie } : {}),
		...toPlainHeaders(config.headers),
	}

	const axiosConfig: AxiosRequestConfig = {
		baseURL,
		url: config.url,
		method: config.method ?? 'GET',
		params: config.params,
		paramsSerializer: (params) => serializeSearchParams(params as object),
		data: config.data,
		signal: config.signal,
		headers,
		responseType: isBinaryUrl(config.url) ? 'arraybuffer' : 'json',
	}

	if (isDev) {
		logger
			.meta<JsonLogOptionalFields>({ req: { method: axiosConfig.method, url: `${baseURL}${config.url ?? ''}` } })
			.info(`API Request: ${axiosConfig.method} ${baseURL}${config.url ?? ''}`)
	}

	let response = await instance.request<TData>(axiosConfig)

	if (isDev) {
		logger
			.meta<JsonLogOptionalFields>({ res: { status: response.status, statusText: response.statusText } })
			.info(`API Response: ${response.status} ${response.statusText}`)
	}

	if (response.status === 401) {
		const onUnauthorized = getOnUnauthorized()
		const retryHeaders = onUnauthorized
			? new Headers(headers)
			: await getServerUnauthorizedRetryHeaders(new Headers(headers))

		if (onUnauthorized) {
			await onUnauthorized()
		}

		if (retryHeaders === null) {
			throwApiError(response.status, response.statusText, response.data)
		}

		response = await instance.request<TData>({
			...axiosConfig,
			headers: Object.fromEntries(retryHeaders.entries()),
		})
	}

	if (response.status === 304) {
		return { data: {} as TData, status: response.status, statusText: response.statusText, headers: new Headers() }
	}

	if (response.status < 200 || response.status >= 300) {
		if (isDev) {
			logger
				.meta<JsonLogOptionalFields>({ err: serializeError(new Error(response.statusText)) })
				.error(`API Error: ${axiosConfig.method} ${baseURL}${config.url ?? ''}`)
		}
		throwApiError(response.status, response.statusText, response.data)
	}

	const responseHeaders = new Headers()
	for (const [key, value] of Object.entries(response.headers ?? {})) {
		if (typeof value === 'string') responseHeaders.set(key, value)
	}

	return { data: response.data, status: response.status, statusText: response.statusText, headers: responseHeaders }
}

function isBinaryUrl(url?: string) {
	return Boolean(url && /\/download\/?$/.test(url))
}

client.getConfig = getConfig
client.setConfig = setConfig

export default client
