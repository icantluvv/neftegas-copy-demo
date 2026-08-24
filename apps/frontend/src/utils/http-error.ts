/**
 * Утилиты для проверки HTTP-статуса ошибки, брошенной сгенерированным
 * Kubb-клиентом: статус лежит в `error.cause.status`.
 */

export function getHttpErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const cause = error.cause as { status?: number } | undefined;

  return cause?.status;
}

export function isHttpError(error: unknown, status: number): boolean {
  return getHttpErrorStatus(error) === status;
}

export function isUnauthorizedError(error: unknown): boolean {
  return isHttpError(error, 401);
}

export function isForbiddenError(error: unknown): boolean {
  return isHttpError(error, 403);
}

export function isNotFoundError(error: unknown): boolean {
  return isHttpError(error, 404);
}
