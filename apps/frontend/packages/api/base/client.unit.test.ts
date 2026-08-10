import type { RequestConfig, ResponseConfig } from './client'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import request from './client'
import { getContests } from './codegen/clients/contestsController/getContests'
import { getTaskDirections } from './codegen/clients/tasksController/getTaskDirections'
import { getTasks } from './codegen/clients/tasksController/getTasks'

const nextHeadersFn = vi.fn<() => Promise<Headers>>()

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type MockResponseMock<TData> = (
	config: Partial<RequestConfig>,
	scenario?: string,
) => Promise<ResponseConfig<TData>>
const clientTestTimeoutMs = 10_000
const clientMockModeTestTimeoutMs = 30_000

function jsonResponse(data: unknown, status = 200, statusText = 'OK') {
	return new Response(JSON.stringify(data), {
		status,
		statusText,
		headers: { 'content-type': 'application/json' },
	})
}

function mockMockResponse<TData>(data: TData) {
	const getMockResponse = vi.fn<MockResponseMock<TData>>(async () => ({
		data,
		status: 200,
		statusText: 'OK',
		headers: new Headers({ 'x-mock-mode': 'true' }),
	}))

	vi.doMock('./mock-client', () => ({ getMockResponse }))

	return getMockResponse
}

function mockBaseMockScenarioNames(...names: string[]) {
	const isBaseMockScenarioName = vi.fn(
		(value: string | null | undefined) => value != null && names.includes(value),
	)

	vi.doMock('./mock-scenarios', () => ({ isBaseMockScenarioName }))

	return isBaseMockScenarioName
}

describe('base API client', () => {
	beforeEach(() => {
		vi.doUnmock('#/mock-mode/config')
		vi.doUnmock('./mock-client')
		vi.doUnmock('./mock-scenarios')
		nextHeadersFn.mockReset()
		nextHeadersFn.mockResolvedValue(new Headers())
		vi.doMock('next/headers', () => ({ headers: nextHeadersFn }))
		vi.stubEnv('MOCK_MODE', 'false')
		vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false')
		vi.stubEnv('NEXT_RUNTIME', '')
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	}, clientTestTimeoutMs)

	it(
		'возвращает mock-данные без сетевого запроса при MOCK_MODE=true',
		async () => {
			vi.stubEnv('MOCK_MODE', 'true')
			mockMockResponse({
				tasks: [],
				pagination: {
					page: 1,
					per_page: 10,
					total_items: 0,
					total_pages: 0,
				},
			})
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await getTasks()

			expect(result).toEqual({
				tasks: [],
				pagination: {
					page: 1,
					per_page: 10,
					total_items: 0,
					total_pages: 0,
				},
			})
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientMockModeTestTimeoutMs,
	)

	it(
		'возвращает открытый конкурс zlg-2026 в mock mode',
		async () => {
			vi.stubEnv('MOCK_MODE', 'true')
			mockMockResponse({
				contests: [
					{
						slug: 'zlg-2026',
						registration_open: true,
					},
				],
			})
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await getContests()

			expect(result.contests).toEqual([
				{
					slug: 'zlg-2026',
					registration_open: true,
				},
			])
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'использует NEXT_PUBLIC_MOCK_MODE для mock-данных в browser branch',
		async () => {
			vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true')
			vi.stubGlobal('window', {})
			mockMockResponse({
				directions: [
					{
						id: '018f7cf5-0010-7db6-8df8-9c4c9d47a510',
						name: 'История',
						source: 'organic',
					},
				],
			})
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await getTaskDirections()

			expect(result.directions).toEqual([
				{
					id: '018f7cf5-0010-7db6-8df8-9c4c9d47a510',
					name: 'История',
					source: 'organic',
				},
			])
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'использует mock-данные для серверного запроса со страницы из runtime config',
		async () => {
			vi.resetModules()
			vi.doMock('#/mock-mode/config', () => ({
				mockModePagePaths: ['/catalog', '/family/team/create'],
				mockModeExcludedPagePaths: [],
			}))
			mockMockResponse({ pagination: { page: 1 } })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const { default: isolatedRequest } = await import('./client')

			const result = await isolatedRequest<{ pagination: { page: number } }>({
				url: '/api/v1/tasks',
				headers: {
					'x-url': 'http://localhost:3000/catalog?page=1',
				},
			})

			expect(typeof result.data.pagination.page).toBe('number')
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'не включает mock-данные для соседнего pathname вне runtime config',
		async () => {
			vi.resetModules()
			vi.doMock('#/mock-mode/config', () => ({
				mockModePagePaths: ['/catalog'],
				mockModeExcludedPagePaths: [],
			}))
			const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
			vi.stubGlobal('fetch', fetchMock)

			const { default: isolatedRequest } = await import('./client')

			const result = await isolatedRequest<{ ok: boolean }>({
				url: '/api/v1/tasks',
				headers: {
					'x-url': 'http://localhost:3000/catalog-old',
				},
			})

			expect(result.data).toEqual({ ok: true })
			expect(fetchMock).toHaveBeenCalledTimes(1)
		},
		clientTestTimeoutMs,
	)

	it(
		'читает pathname mock-страницы из текущего Next request на сервере',
		async () => {
			vi.resetModules()
			vi.stubEnv('NEXT_RUNTIME', 'nodejs')
			nextHeadersFn.mockResolvedValue(
				new Headers({ 'x-url': 'http://localhost:3000/catalog' }),
			)
			vi.doMock('#/mock-mode/config', () => ({
				mockModePagePaths: ['/catalog'],
				mockModeExcludedPagePaths: [],
			}))
			mockMockResponse({ pagination: { page: 1 } })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const { default: isolatedRequest } = await import('./client')

			const result = await isolatedRequest<{ pagination: { page: number } }>({
				url: '/api/v1/tasks',
			})

			expect(typeof result.data.pagination.page).toBe('number')
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'использует runtime config для mock-данных в browser branch',
		async () => {
			vi.resetModules()
			vi.doMock('#/mock-mode/config', () => ({
				mockModePagePaths: ['/catalog'],
				mockModeExcludedPagePaths: [],
			}))
			vi.stubGlobal('window', { location: { pathname: '/catalog' } })
			vi.stubGlobal('document', { cookie: '' })
			mockMockResponse({ directions: [{ name: 'История' }] })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const { default: isolatedRequest } = await import('./client')

			const result = await isolatedRequest<{ directions: Array<{ name: string }> }>({
				url: '/api/v1/tasks/directions',
			})

			expect(result.data.directions.length).toBeGreaterThan(0)
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'использует RegExp из runtime config для mock-данных',
		async () => {
			vi.resetModules()
			vi.doMock('#/mock-mode/config', () => ({
				mockModePagePaths: [/^\/catalog(?:\/.*)?$/],
				mockModeExcludedPagePaths: [],
			}))
			mockMockResponse({ pagination: { page: 1 } })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const { default: isolatedRequest } = await import('./client')

			const result = await isolatedRequest<{ pagination: { page: number } }>({
				url: '/api/v1/tasks',
				headers: {
					'x-url': 'http://localhost:3000/catalog/tasks',
				},
			})

			expect(typeof result.data.pagination.page).toBe('number')
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'не включает mock-данные для pathname вне RegExp из runtime config',
		async () => {
			vi.resetModules()
			vi.doMock('#/mock-mode/config', () => ({
				mockModePagePaths: [/^\/catalog(?:\/.*)?$/],
				mockModeExcludedPagePaths: [],
			}))
			const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
			vi.stubGlobal('fetch', fetchMock)

			const { default: isolatedRequest } = await import('./client')

			const result = await isolatedRequest<{ ok: boolean }>({
				url: '/api/v1/tasks',
				headers: {
					'x-url': 'http://localhost:3000/catalog-old',
				},
			})

			expect(result.data).toEqual({ ok: true })
			expect(fetchMock).toHaveBeenCalledTimes(1)
		},
		clientTestTimeoutMs,
	)

	it(
		'использует mock-данные для серверного запроса с cookie mock-mode=true',
		async () => {
			mockMockResponse({ pagination: { page: 1 } })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await request<{ pagination: { page: number } }>({
				url: '/api/v1/tasks',
				headers: {
					cookie: 'session=real; mock-mode=true',
				},
			})

			expect(typeof result.data.pagination.page).toBe('number')
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'использует cookie mock-scenario для regional account mock только при mock-mode',
		async () => {
			mockBaseMockScenarioNames('regionalTeamTaskDeadlineMissed')
			const getMockResponse = mockMockResponse({
				task_summary: { ui_state: 'task_deadline_missed' },
				participation: { role: 'regional_team_captain' },
			})
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await request<{
				task_summary: { ui_state: string }
				participation: { role: string }
			}>({
				url: '/api/v1/regional-teams/team-123',
				headers: {
					cookie: 'mock-mode=true; mock-scenario=regionalTeamTaskDeadlineMissed',
					'x-regional-account-flow': 'true',
					'x-url': 'http://localhost:3000/account?tab=task',
				},
			})

			expect(result.data.participation.role).toBe('regional_team_captain')
			expect(result.data.task_summary.ui_state).toBe('task_deadline_missed')
			expect(getMockResponse).toHaveBeenCalledWith(
				expect.objectContaining({ url: '/api/v1/regional-teams/team-123' }),
				'regionalTeamTaskDeadlineMissed',
			)
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'игнорирует cookie mock-scenario без mock-mode и отправляет backend-запрос',
		async () => {
			const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
			vi.stubGlobal('fetch', fetchMock)

			const result = await request<{ ok: boolean }>({
				url: '/api/v1/regional-teams/team-123',
				headers: {
					cookie: 'mock-scenario=regionalTeamTaskDeadlineMissed',
					'x-regional-account-flow': 'true',
					'x-url': 'http://localhost:3000/account?tab=task',
				},
			})

			expect(result.data).toEqual({ ok: true })
			expect(fetchMock).toHaveBeenCalledTimes(1)
		},
		clientTestTimeoutMs,
	)

	it(
		'не использует query param для выбора regional scenario',
		async () => {
			mockBaseMockScenarioNames('regionalTeamTaskActive')
			const getMockResponse = mockMockResponse({ status: 'not_started' })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await request<{ status: string }>({
				url: '/api/v1/regional-team-tasks/018f7cf5-2000-7db6-8df8-9c4c9d47a500',
				headers: {
					cookie: 'mock-mode=true; mock-scenario=regionalTeamTaskActive',
					'x-regional-account-flow': 'true',
					'x-url': `http://localhost:3000/account?regional_${'account'}_scenario=regionalTeamTaskDeadlineMissed`,
				},
			})

			expect(result.data.status).toBe('not_started')
			const [mockConfig, scenario] = getMockResponse.mock.calls[0]!
			expect(mockConfig.headers).toMatchObject({
				cookie: 'mock-mode=true; mock-scenario=regionalTeamTaskActive',
			})
			expect(scenario).toBe('regionalTeamTaskActive')
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'использует cookie mock-mode=true для mock-данных в browser branch',
		async () => {
			vi.stubGlobal('window', { location: { pathname: '/account' } })
			vi.stubGlobal('document', { cookie: 'mock-mode=true' })
			mockMockResponse({ directions: [{ name: 'История' }] })
			const fetchMock = vi
				.fn<FetchMock>()
				.mockRejectedValue(new Error('fetch should not be called'))
			vi.stubGlobal('fetch', fetchMock)

			const result = await request<{ directions: Array<{ name: string }> }>({
				url: '/api/v1/tasks/directions',
			})

			expect(result.data.directions.length).toBeGreaterThan(0)
			expect(fetchMock).not.toHaveBeenCalled()
		},
		clientTestTimeoutMs,
	)

	it(
		'не задаёт Content-Type вручную для FormData',
		async () => {
			const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
			vi.stubGlobal('fetch', fetchMock)

			const formData = new FormData()
			formData.set('file', new Blob(['test']), 'test.txt')

			await request<{ ok: boolean }>({
				url: '/api/v1/upload',
				method: 'POST',
				data: formData,
			})

			const [, init] = fetchMock.mock.calls[0]!
			expect(init?.body).toBe(formData)
			expect(init?.headers).not.toHaveProperty('Content-Type')
		},
		clientTestTimeoutMs,
	)

	it(
		'возвращает пустой объект для 204 ответа',
		async () => {
			const fetchMock = vi
				.fn<FetchMock>()
				.mockResolvedValue(new Response(null, { status: 204 }))
			vi.stubGlobal('fetch', fetchMock)

			await expect(
				request({
					url: '/api/v1/items/1',
					method: 'DELETE',
				}),
			).resolves.toMatchObject({
				data: {},
				status: 204,
			})
		},
		clientTestTimeoutMs,
	)

	it(
		'не считает 304 Not Modified fatal error',
		async () => {
			const fetchMock = vi
				.fn<FetchMock>()
				.mockResolvedValue(new Response(null, { status: 304, statusText: 'Not Modified' }))
			vi.stubGlobal('fetch', fetchMock)

			await expect(
				request({
					url: '/api/v1/me/notifications',
					headers: { 'If-None-Match': '"a1b2c3d4"' },
				}),
			).resolves.toMatchObject({
				data: {},
				status: 304,
			})
		},
		clientTestTimeoutMs,
	)

	it('вызывает unauthorized handler и повторяет запрос после 401', async () => {
		vi.resetModules()
		const fetchMock = vi
			.fn<FetchMock>()
			.mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, 401, 'Unauthorized'))
			.mockResolvedValueOnce(jsonResponse({ ok: true }))
		vi.stubGlobal('fetch', fetchMock)

		const { default: isolatedRequest, setOnUnauthorized: setIsolatedOnUnauthorized } =
			await import('./client')
		const onUnauthorized = vi.fn().mockResolvedValue(undefined)
		setIsolatedOnUnauthorized(onUnauthorized)

		await expect(
			isolatedRequest<{ ok: boolean }>({
				url: '/api/v1/me',
			}),
		).resolves.toMatchObject({
			data: { ok: true },
		})

		expect(onUnauthorized).toHaveBeenCalledTimes(1)
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it('использует browser-safe unauthorized handler без импорта request client', async () => {
		vi.resetModules()
		const fetchMock = vi
			.fn<FetchMock>()
			.mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, 401, 'Unauthorized'))
			.mockResolvedValueOnce(jsonResponse({ ok: true }))
		vi.stubGlobal('fetch', fetchMock)

		const { setOnUnauthorized: setBrowserOnUnauthorized } = await import('./client-handlers')
		const { default: isolatedRequest } = await import('./client')
		const onUnauthorized = vi.fn().mockResolvedValue(undefined)
		setBrowserOnUnauthorized(onUnauthorized)

		await expect(
			isolatedRequest<{ ok: boolean }>({
				url: '/api/v1/me',
			}),
		).resolves.toMatchObject({
			data: { ok: true },
		})

		expect(onUnauthorized).toHaveBeenCalledTimes(1)
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it(
		'подставляет куку сессии из next/headers в серверный запрос',
		async () => {
			nextHeadersFn.mockResolvedValue(new Headers({ cookie: 'session=test-session-token' }))
			const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
			vi.stubGlobal('fetch', fetchMock)

			await request<{ ok: boolean }>({ url: '/api/v1/me/profile' })

			const [, init] = fetchMock.mock.calls[0]!
			expect((init?.headers as Headers).get('cookie')).toBe('session=test-session-token')
		},
		clientTestTimeoutMs,
	)

	it(
		'не подставляет куку сессии в браузерный запрос',
		async () => {
			vi.stubGlobal('window', { location: { pathname: '/account' } })
			const fetchMock = vi.fn<FetchMock>().mockResolvedValue(jsonResponse({ ok: true }))
			vi.stubGlobal('fetch', fetchMock)

			await request<{ ok: boolean }>({ url: '/api/v1/me/profile' })

			const [, init] = fetchMock.mock.calls[0]!
			expect((init?.headers as Headers).get('cookie')).toBeNull()
		},
		clientTestTimeoutMs,
	)

	it(
		'вызывает profile incomplete handler для 403 profile_incomplete',
		async () => {
			vi.resetModules()
			const fetchMock = vi
				.fn<FetchMock>()
				.mockResolvedValue(jsonResponse({ error: 'profile_incomplete' }, 403, 'Forbidden'))
			vi.stubGlobal('fetch', fetchMock)

			const {
				default: isolatedRequest,
				setOnProfileIncomplete: setIsolatedOnProfileIncomplete,
			} = await import('./client')
			const onProfileIncomplete = vi.fn()
			setIsolatedOnProfileIncomplete(onProfileIncomplete)

			await expect(
				isolatedRequest({
					url: '/api/v1/me/profile',
				}),
			).rejects.toThrow('Forbidden')

			expect(onProfileIncomplete).toHaveBeenCalledTimes(1)
		},
		clientTestTimeoutMs,
	)
})
