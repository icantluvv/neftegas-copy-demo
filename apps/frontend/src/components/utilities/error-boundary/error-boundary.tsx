import type { ErrorBoundaryProps } from '@sentry/nextjs'

import { ErrorBoundary as SentryBoundary } from '@sentry/nextjs'

interface ErrorFallbackProps {
	description?: string
	error: unknown
	resetError?: () => void
	title?: string
}

const DEFAULT_ERROR_TITLE = 'Техническая ошибка'

const DEFAULT_ERROR_TEXT = `Извините, возникла неожиданная техническая неполадка. 
Мы прилагаем все усилия для решения этой проблемы как можно скорее. 
Пожалуйста, попробуйте обновить страницу или вернуться позже.`

export function ErrorFallback({
	description,
	error: _error,
	resetError,
	title: _title,
}: ErrorFallbackProps) {
	return (
		<div data-testid="error-boundary">
			<h1>{DEFAULT_ERROR_TITLE}</h1>
			<p>{DEFAULT_ERROR_TEXT}</p>
			<br />
			{description}
			{resetError && <button onClick={resetError}>Попробовать еще</button>}
		</div>
	)
}

export function ErrorBoundary({ children, fallback, onError, onReset }: ErrorBoundaryProps) {
	return (
		<SentryBoundary fallback={fallback ?? ErrorFallback} onError={onError} onReset={onReset}>
			{children}
		</SentryBoundary>
	)
}
