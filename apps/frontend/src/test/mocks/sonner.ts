import type { HTMLAttributes } from 'react'

import { createElement } from 'react'
import { vi } from 'vitest'

export type ToasterProps = HTMLAttributes<HTMLDivElement>

export const toastMock = {
	custom: vi.fn(),
	dismiss: vi.fn(),
	error: vi.fn(),
	info: vi.fn(),
	loading: vi.fn(),
	message: vi.fn(),
	promise: vi.fn(),
	success: vi.fn(),
	warning: vi.fn(),
}

export const toast = toastMock

export function Toaster(props: ToasterProps) {
	return createElement('div', {
		...props,
		'data-testid': 'sonner-toaster',
	})
}

export function resetSonnerMock() {
	toastMock.custom.mockReset()
	toastMock.dismiss.mockReset()
	toastMock.error.mockReset()
	toastMock.info.mockReset()
	toastMock.loading.mockReset()
	toastMock.message.mockReset()
	toastMock.promise.mockReset()
	toastMock.success.mockReset()
	toastMock.warning.mockReset()
}
