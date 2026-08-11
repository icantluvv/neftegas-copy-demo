import { describe, expect, it } from 'vitest'

describe('component test setup', () => {
	it('подключает глобальные стили приложения', () => {
		const probe = document.createElement('div')
		probe.className = 'tw:text-text-label'
		document.body.append(probe)

		try {
			expect(
				getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim(),
			).toBe('#171717')
		} finally {
			probe.remove()
		}
	})
})
