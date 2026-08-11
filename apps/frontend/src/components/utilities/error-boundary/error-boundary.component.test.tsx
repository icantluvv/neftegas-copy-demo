import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ErrorFallback } from './error-boundary'

describe('<ErrorBoundary />', () => {
	const errorMessage = 'Example error message'
	const error = new Error(errorMessage)

	it('renders correctly', async () => {
		const view = await render(<ErrorFallback error={error} />)

		await expect.element(view.getByTestId('error-boundary')).toBeVisible()
	})

	it('handles reset error', async () => {
		const mockFunction = vi.fn()

		const view = await render(<ErrorFallback error={error} resetError={mockFunction} />)

		await view.getByRole('button', { name: 'Попробовать еще' }).click()

		expect(mockFunction).toHaveBeenCalled()
	})
})
