import { describe, expect, it } from "vitest";

import { getDashboardKind } from "./get-dashboard-kind";

describe("getDashboardKind", () => {
  it("возвращает 'filial' для роли FILIAL", () => {
    expect(getDashboardKind("FILIAL")).toBe("filial");
  });

  it("возвращает 'cfo' для роли CFO", () => {
    expect(getDashboardKind("CFO")).toBe("cfo");
  });

  it("возвращает 'dtoe' для роли DTOE", () => {
    expect(getDashboardKind("DTOE")).toBe("dtoe");
  });

  it("возвращает undefined для роли без назначенного дашборда (ADMIN)", () => {
    expect(getDashboardKind("ADMIN")).toBeUndefined();
  });
});
