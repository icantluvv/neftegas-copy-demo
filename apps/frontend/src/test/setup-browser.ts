import { afterEach } from 'vitest'

import { resetNextNavigationMock } from './mocks/next-navigation'
import { resetSonnerMock } from './mocks/sonner'

import '@/app/globals.css'

afterEach(() => {
	resetNextNavigationMock()
	resetSonnerMock()
})
