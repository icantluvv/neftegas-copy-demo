import type { GetContestsQueryResponse } from './codegen/types/contestsController/GetContests'
import type { MockRoute, RequestMethod } from './mock-client'

export type BaseMockScenarioName = 'default'

const activeBaseMockScenario: BaseMockScenarioName = 'default'

const openZlgContest: GetContestsQueryResponse = {
	contests: [
		{
			slug: 'zlg-2026',
			registration_open: true,
		},
	],
}

const alwaysActiveMockRoutes = [
	{
		method: 'GET',
		pattern: /^\/api\/v1\/contests$/,
		create: () => openZlgContest,
	},
] satisfies MockRoute[]

const mockScenarios = {
	default: [],
} satisfies Record<BaseMockScenarioName, MockRoute[]>

export function isBaseMockScenarioName(
	value: string | null | undefined,
): value is BaseMockScenarioName {
	return value != null && new Set(Object.keys(mockScenarios)).has(value)
}

export function getMockScenarioRoute(
	method: RequestMethod,
	path: string,
	scenario: BaseMockScenarioName = activeBaseMockScenario,
): MockRoute | undefined {
	return [...mockScenarios[scenario], ...alwaysActiveMockRoutes].find((route) => {
		return route.method === method && route.pattern.test(path)
	})
}
