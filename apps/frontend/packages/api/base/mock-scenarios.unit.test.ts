import { describe, expect, it } from 'vitest'

import { getMockScenarioRoute } from './mock-scenarios'

describe('base API mock scenarios', () => {
	it('всегда переопределяет список конкурсов на открытый zlg-2026', () => {
		const route = getMockScenarioRoute('GET', '/api/v1/contests')

		expect(route?.create()).toEqual({
			contests: [
				{
					slug: 'zlg-2026',
					registration_open: true,
				},
			],
		})
	})

	it('возвращает undefined для незамоканных путей', () => {
		const route = getMockScenarioRoute('GET', '/api/v1/unknown')

		expect(route).toBeUndefined()
	})
})
