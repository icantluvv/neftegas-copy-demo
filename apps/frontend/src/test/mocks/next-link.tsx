import type { AnchorHTMLAttributes, MouseEvent } from 'react'

import { forwardRef } from 'react'

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
	{ href, onClick, ...props },
	ref,
) {
	function handleClick(event: MouseEvent<HTMLAnchorElement>) {
		event.preventDefault()
		onClick?.(event)
	}

	return <a ref={ref} href={href} onClick={handleClick} {...props} />
})

export default Link
