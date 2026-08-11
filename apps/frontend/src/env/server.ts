import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod/mini'

export const serverEnvironment = createEnv({
	skipValidation: process.env.CI === 'true',
	emptyStringAsUndefined: true,
	experimental__runtimeEnv: process.env,
	server: {
		BACK_INTERNAL_URL: z.url(),
		BACK_INTERNAL_BASIC_AUTH: z.optional(z.string()),
		MOCK_MODE: z._default(z.stringbool(), false),
		DADATA_URL: z.url(),
		DADATA_TOKEN: z.string(),
		PARTNER_API_TOKEN: z.string(),
		REGIONAL_REGISTRATION_KEY: z.optional(z.string()),
	},
})
