import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod/mini'

export const clientEnvironment = createEnv({
	client: {
		NEXT_PUBLIC_APP_NAME: z.string(),
		NEXT_PUBLIC_FRONT_URL: z.url(),
		NEXT_PUBLIC_BFF_PATH: z.string(),
		NEXT_PUBLIC_BACK_URL: z.url(),
		NEXT_PUBLIC_MOCK_MODE: z._default(z.stringbool(), false),
		NEXT_PUBLIC_SENTRY_DSN: z.optional(z.url()),
		NEXT_PUBLIC_S3_URL: z.url(),
		NEXT_PUBLIC_YANDEX_METRIKA_ID: z.optional(z.coerce.number().check(z.positive())),
		NEXT_PUBLIC_VK_PIXEL_ID: z.optional(z.string()),
		NEXT_PUBLIC_TG_PIXEL_ID: z.optional(z.string()),
		NEXT_PUBLIC_UNLEASH_FRONTEND_API_URL: z.optional(z.url()),
		NEXT_PUBLIC_UNLEASH_FRONTEND_API_TOKEN: z.optional(z.string()),
		NEXT_PUBLIC_UNLEASH_APP_NAME: z._default(z.string(), 'gas-dashboard-frontend'),
	},
	emptyStringAsUndefined: true,
	runtimeEnv: {
		NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
		NEXT_PUBLIC_FRONT_URL: process.env.NEXT_PUBLIC_FRONT_URL,
		NEXT_PUBLIC_BFF_PATH: process.env.NEXT_PUBLIC_BFF_PATH,
		NEXT_PUBLIC_BACK_URL: process.env.NEXT_PUBLIC_BACK_URL,
		NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
		NEXT_PUBLIC_S3_URL: process.env.NEXT_PUBLIC_S3_URL,
		NEXT_PUBLIC_YANDEX_METRIKA_ID: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID,
		NEXT_PUBLIC_VK_PIXEL_ID: process.env.NEXT_PUBLIC_VK_PIXEL_ID,
		NEXT_PUBLIC_TG_PIXEL_ID: process.env.NEXT_PUBLIC_TG_PIXEL_ID,
		NEXT_PUBLIC_UNLEASH_FRONTEND_API_URL: process.env.NEXT_PUBLIC_UNLEASH_FRONTEND_API_URL,
		NEXT_PUBLIC_UNLEASH_FRONTEND_API_TOKEN: process.env.NEXT_PUBLIC_UNLEASH_FRONTEND_API_TOKEN,
		NEXT_PUBLIC_UNLEASH_APP_NAME: process.env.NEXT_PUBLIC_UNLEASH_APP_NAME,
	},
})
