'use client'

import type { ToasterProps } from 'sonner'

import { Toaster as Sonner } from 'sonner'

export function Toaster({ ...props }: ToasterProps) {
	return (
		<Sonner
			className="tw:group"
			icons={{}}
			style={{}}
			toastOptions={{
				classNames: {
					toast: 'cn-toast',
				},
			}}
			{...props}
		/>
	)
}
