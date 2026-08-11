import { chainProxy } from '#/proxy/chain'
import { injectHeaders } from '#/proxy/inject-headers'

export const proxy = chainProxy([injectHeaders])

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
