import type { MockClientRouteDefinition } from './mock-client-routes'

import { describe, expect, it } from 'vitest'

import { renderMockClientRoutes } from './mock-client-routes'

describe('pluginMockClientRoutes', () => {
	it('генерирует route table для base mock-client из OpenAPI операций', () => {
		const routes: MockClientRouteDefinition[] = [
			{
				method: 'get',
				path: '/api/v1/tasks',
				operationId: 'getTasks',
				status: 200,
				tag: 'Tasks',
			},
			{
				method: 'post',
				path: '/api/v1/family-teams',
				operationId: 'createFamilyTeam',
				status: 201,
				tag: 'Registration',
			},
			{
				method: 'get',
				path: '/api/v1/family-teams/{team_id}',
				operationId: 'getFamilyTeam',
				status: 200,
				tag: 'Registration',
			},
		]

		const source = renderMockClientRoutes(routes, {
			mocksImportPath: './codegen/mocks',
			mockClientImportPath: './mock-client',
		})

		expect(source).toContain(
			"import { createGetTasksQueryResponse } from './codegen/mocks/tasksController/createGetTasks'",
		)
		expect(source).toContain(
			"import { createCreateFamilyTeamMutationResponse } from './codegen/mocks/registrationController/createCreateFamilyTeam'",
		)
		expect(source).toContain(
			"{ method: 'POST', pattern: /^\\/api\\/v1\\/family-teams$/, status: 201, create: createCreateFamilyTeamMutationResponse }",
		)
		expect(source).toContain(
			"{ method: 'GET', pattern: /^\\/api\\/v1\\/family-teams\\/[^/]+$/, create: createGetFamilyTeamQueryResponse }",
		)
	})
})
