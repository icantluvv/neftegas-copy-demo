import { expect, test, vi } from 'vitest'

export { expect, test, vi }

export function jsonResponse<TData>(data: TData, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			'content-type': 'application/json',
			...init?.headers,
		},
	})
}
