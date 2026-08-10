type UnauthorizedHandler = () => Promise<void>
type ProfileIncompleteHandler = () => void
type ServerUnauthorizedRetryHeadersHandler = (headers: Headers) => Promise<Headers | null>

let onUnauthorized: UnauthorizedHandler | null = null
let onProfileIncomplete: ProfileIncompleteHandler | null = null
let serverUnauthorizedRetryHeadersHandler: ServerUnauthorizedRetryHeadersHandler | null = null

export function setOnUnauthorized(handler: UnauthorizedHandler) {
	onUnauthorized = handler
}

export function getOnUnauthorized() {
	return onUnauthorized
}

export function setOnProfileIncomplete(handler: ProfileIncompleteHandler) {
	onProfileIncomplete = handler
}

export function getOnProfileIncomplete() {
	return onProfileIncomplete
}

export function setServerUnauthorizedRetryHeadersHandler(
	handler: ServerUnauthorizedRetryHeadersHandler,
) {
	serverUnauthorizedRetryHeadersHandler = handler
}

export async function getServerUnauthorizedRetryHeaders(headers: Headers) {
	if (serverUnauthorizedRetryHeadersHandler === null) {
		return null
	}

	return serverUnauthorizedRetryHeadersHandler(headers)
}
