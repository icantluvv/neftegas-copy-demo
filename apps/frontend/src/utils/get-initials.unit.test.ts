import { describe, expect, it } from "vitest";

import { getInitials } from "./get-initials";

describe("getInitials", () => {
  it("возвращает пустую строку для пустого ФИО", () => {
    expect(getInitials("")).toBe("");
  });

  it("возвращает первую букву для одного слова", () => {
    expect(getInitials("Иванов")).toBe("И");
  });

  it("возвращает первые буквы двух слов для полного ФИО", () => {
    expect(getInitials("Иванов Иван Иванович")).toBe("ИИ");
  });

  it("игнорирует лишние пробелы между словами", () => {
    expect(getInitials("  Иванов   Иван  ")).toBe("ИИ");
  });
});
