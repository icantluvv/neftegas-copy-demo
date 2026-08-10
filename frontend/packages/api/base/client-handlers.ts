/**
 * Ретрай на 401 разнесён на два хука, которые регистрирует приложение (apps/web),
 * а не этот пакет — так клиент остаётся независимым от конкретного способа
 * обновления токенов. На клиенте — колбэк редиректа на /login, на сервере (SSR) —
 * функция, которая берёт входящие cookie, дёргает POST /auth/refresh в NestJS и
 * возвращает обновлённые заголовки (или null, если обновить не удалось).
 */

type UnauthorizedHandler = () => Promise<void>
type ServerUnauthorizedRetryHeadersHandler = (headers: Headers) => Promise<Headers | null>

let onUnauthorized: UnauthorizedHandler | null = null
let serverUnauthorizedRetryHeadersHandler: ServerUnauthorizedRetryHeadersHandler | null = null

export function setOnUnauthorized(handler: UnauthorizedHandler) {
	onUnauthorized = handler
}

export function getOnUnauthorized() {
	return onUnauthorized
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
