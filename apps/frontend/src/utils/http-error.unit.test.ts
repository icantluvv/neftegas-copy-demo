import { describe, expect, it } from "vitest";

import {
  getHttpErrorStatus,
  isForbiddenError,
  isHttpError,
  isNotFoundError,
  isUnauthorizedError,
} from "./http-error";

function httpError(status: number): Error {
  return new Error("Request failed", { cause: { status } });
}

describe("getHttpErrorStatus", () => {
  it("возвращает статус из cause", () => {
    expect(getHttpErrorStatus(httpError(403))).toBe(403);
  });

  it("возвращает undefined для ошибки без cause", () => {
    expect(getHttpErrorStatus(new Error("boom"))).toBeUndefined();
  });

  it("возвращает undefined для значения, не являющегося Error", () => {
    expect(getHttpErrorStatus({ cause: { status: 403 } })).toBeUndefined();
  });
});

describe("isHttpError", () => {
  it("возвращает true при совпадении статуса", () => {
    expect(isHttpError(httpError(409), 409)).toBe(true);
  });

  it("возвращает false при несовпадении статуса", () => {
    expect(isHttpError(httpError(409), 403)).toBe(false);
  });
});

describe("проверки конкретных статусов", () => {
  it("isUnauthorizedError реагирует только на 401", () => {
    expect(isUnauthorizedError(httpError(401))).toBe(true);
    expect(isUnauthorizedError(httpError(403))).toBe(false);
  });

  it("isForbiddenError реагирует только на 403", () => {
    expect(isForbiddenError(httpError(403))).toBe(true);
    expect(isForbiddenError(httpError(401))).toBe(false);
  });

  it("isNotFoundError реагирует только на 404", () => {
    expect(isNotFoundError(httpError(404))).toBe(true);
    expect(isNotFoundError(httpError(403))).toBe(false);
  });
});
