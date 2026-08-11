const MOCK_MODE_HEADER = 'x-mock-mode'
const MOCK_SCENARIO_HEADER = 'x-mock-scenario'

function readHeader(headers: HeadersInit | undefined, name: string) {
	if (headers == null) return null
	if (headers instanceof Headers) return headers.get(name)
	if (Array.isArray(headers)) {
		const found = headers.find(([key]) => key.toLowerCase() === name)
		return found?.[1] ?? null
	}
	const key = Object.keys(headers).find((k) => k.toLowerCase() === name)
	return key ? (headers as Record<string, string>)[key] : null
}

export function isRequestMockModeEnabled(headers: HeadersInit | undefined) {
	return readHeader(headers, MOCK_MODE_HEADER) === 'true'
}

export function getRequestMockScenario(headers: HeadersInit | undefined) {
	return readHeader(headers, MOCK_SCENARIO_HEADER) ?? undefined
}

export function isBrowserRuntimeMockModeEnabled() {
	if (typeof window === 'undefined') return false
	return window.sessionStorage?.getItem(MOCK_MODE_HEADER) === 'true'
}

export function getBrowserMockScenario() {
	if (typeof window === 'undefined') return undefined
	return window.sessionStorage?.getItem(MOCK_SCENARIO_HEADER) ?? undefined
}
