import type { ComponentType, ErrorInfo, ReactNode } from 'react'

import { Component } from 'react'

import { Button } from '#/components/ui/button'

interface ErrorBoundaryProps {
	children: ReactNode
	fallback?: ComponentType<ErrorFallbackProps>
	onError?: (error: unknown, errorInfo: ErrorInfo) => void
	onReset?: () => void
}

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
			{resetError && (
				<Button onClick={resetError} variant="outline">
					Попробовать еще
				</Button>
			)}
		</div>
	)
}

interface ErrorBoundaryState {
	error: unknown
	hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: undefined, hasError: false }

	static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
		return { error, hasError: true }
	}

	componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
		this.props.onError?.(error, errorInfo)
	}

	resetError = (): void => {
		this.props.onReset?.()
		this.setState({ error: undefined, hasError: false })
	}

	render(): ReactNode {
		if (this.state.hasError) {
			const Fallback = this.props.fallback ?? ErrorFallback

			return <Fallback error={this.state.error} resetError={this.resetError} />
		}

		return this.props.children
	}
}
