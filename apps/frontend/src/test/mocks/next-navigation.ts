import { vi } from 'vitest'

/* eslint-disable react/no-unnecessary-use-prefix -- Next.js navigation exports are hook-compatible mocks. */

export const nextRouterMock = {
	back: vi.fn(),
	forward: vi.fn(),
	prefetch: vi.fn(),
	push: vi.fn(),
	refresh: vi.fn(),
	replace: vi.fn(),
}

export const nextNavigationMock = {
	params: {} as Record<string, string | string[]>,
	pathname: '/',
	searchParams: new URLSearchParams(),
}

export const redirect = vi.fn()
export const permanentRedirect = vi.fn()
export const notFound = vi.fn()

export const RedirectType = {
	push: 'push',
	replace: 'replace',
} as const

export function useRouter() {
	return nextRouterMock
}

export function usePathname() {
	return nextNavigationMock.pathname
}

export function useSearchParams() {
	return nextNavigationMock.searchParams
}

export function useParams() {
	return nextNavigationMock.params
}

export function resetNextNavigationMock() {
	nextRouterMock.back.mockReset()
	nextRouterMock.forward.mockReset()
	nextRouterMock.prefetch.mockReset()
	nextRouterMock.push.mockReset()
	nextRouterMock.refresh.mockReset()
	nextRouterMock.replace.mockReset()
	redirect.mockReset()
	permanentRedirect.mockReset()
	notFound.mockReset()
	nextNavigationMock.params = {}
	nextNavigationMock.pathname = '/'
	nextNavigationMock.searchParams = new URLSearchParams()
}
