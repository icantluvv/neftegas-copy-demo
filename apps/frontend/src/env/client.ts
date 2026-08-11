import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod/mini'

export const clientEnvironment = createEnv({
	client: {
		NEXT_PUBLIC_APP_NAME: z.string(),
		NEXT_PUBLIC_FRONT_URL: z.url(),
		NEXT_PUBLIC_BFF_PATH: z.string(),
		// Абсолютный URL в dev или относительный путь ("/api") в docker-режиме,
		// где browser идёт на свой origin через rewrite в next.config.ts.
		NEXT_PUBLIC_BACK_URL: z.string().check(z.minLength(1)),
		NEXT_PUBLIC_MOCK_MODE: z._default(z.stringbool(), false),
	},
	emptyStringAsUndefined: true,
	runtimeEnv: {
		NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
		NEXT_PUBLIC_FRONT_URL: process.env.NEXT_PUBLIC_FRONT_URL,
		NEXT_PUBLIC_BFF_PATH: process.env.NEXT_PUBLIC_BFF_PATH,
		NEXT_PUBLIC_BACK_URL: process.env.NEXT_PUBLIC_BACK_URL,
		NEXT_PUBLIC_MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE,
	},
})
