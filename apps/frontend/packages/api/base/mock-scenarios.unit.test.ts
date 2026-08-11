import { describe, expect, it } from 'vitest'

import { getMockScenarioRoute } from './mock-scenarios'

describe('base API mock scenarios', () => {
	it('возвращает undefined для незамоканных путей', () => {
		const route = getMockScenarioRoute('GET', '/api/v1/unknown')

		expect(route).toBeUndefined()
	})
})
