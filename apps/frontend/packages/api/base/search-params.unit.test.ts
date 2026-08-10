import { describe, expect, it } from 'vitest'

import { serializeSearchParams } from './search-params'

describe('serializeSearchParams', () => {
	it('сериализует массивы повторяющимися query params', () => {
		expect(
			serializeSearchParams({
				source: ['organic', 'region'],
				direction_id: [
					'018f7cf5-0010-7db6-8df8-9c4c9d47a510',
					'018f7cf5-0010-7db6-8df8-9c4c9d47a511',
				],
				type: [],
			}),
		).toBe(
			'source=organic&source=region&direction_id=018f7cf5-0010-7db6-8df8-9c4c9d47a510&direction_id=018f7cf5-0010-7db6-8df8-9c4c9d47a511',
		)
	})

	it('пропускает undefined и сериализует null строкой null', () => {
		expect(
			serializeSearchParams({
				empty: undefined,
				value: null,
			}),
		).toBe('value=null')
	})
})
