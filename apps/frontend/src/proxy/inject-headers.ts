import type { NextRequest } from 'next/server'

import type { ProxyFn } from './chain'

import { NextResponse } from 'next/server'

export const injectHeaders: ProxyFn = (request: NextRequest, response) => {
	const requestHeaders = new Headers(request.headers)

	requestHeaders.set('x-url', request.url)

	const nextResponse = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	})

	for (const cookie of response.cookies.getAll()) {
		nextResponse.cookies.set(cookie)
	}

	return nextResponse
}
