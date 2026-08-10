import type { GetMeContests200 } from './codegen'

import { describe, expect, it } from 'vitest'

import { getMeContests200Schema } from './codegen'

type ParticipationType = NonNullable<
	GetMeContests200['contests'][number]['participation']
>['participation_type']

function makeResponse(participationType: ParticipationType): GetMeContests200 {
	return {
		contests: [
			{
				contest: {
					id: '018f7cf5-0000-7db6-8df8-9c4c9d47a500',
					slug: 'zlg-2026',
					name: 'Знать. Любить. Гордиться!',
					registration_opens_at: '2026-01-01T00:00:00+03:00',
					registration_closes_at: '2026-06-15T00:00:00+03:00',
					regional_stage_open: true,
					district_stage_open: false,
					country_stage_open: false,
					stage_summary_periods: {
						region: { start_date: null, end_date: null },
						district: { start_date: null, end_date: null },
						country: { start_date: null, end_date: null },
					},
				},
				registration_status: 'registered',
				participation: {
					id: '018f7cf5-2002-7db6-8df8-9c4c9d47a502',
					contest_id: '018f7cf5-0000-7db6-8df8-9c4c9d47a500',
					participation_type: participationType,
					age_group: 'adult',
					team_id: '018f7cf5-2000-7db6-8df8-9c4c9d47a500',
				},
			},
		],
	}
}

describe('getMeContests schema', () => {
	it.each(['regional_team_captain', 'regional_team_member'] as const)(
		'accepts %s participation_type',
		(participationType) => {
			expect(getMeContests200Schema.safeParse(makeResponse(participationType)).success).toBe(
				true,
			)
		},
	)
})
