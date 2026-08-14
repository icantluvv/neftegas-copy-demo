import { describe, expect, it } from "vitest";

import { getCfoStatusLabel, getCorrectionStatusLabel, getRemarkStatusLabel } from "./status-labels";

describe("getCorrectionStatusLabel", () => {
  it("возвращает текст и тон для каждого статуса корректировки", () => {
    expect(getCorrectionStatusLabel("DRAFT")).toEqual({ text: "Черновик", tone: "neutral" });
    expect(getCorrectionStatusLabel("APPROVED_BY_DTOE")).toEqual({ text: "Согласовано ДТОиР", tone: "success" });
    expect(getCorrectionStatusLabel("RETURNED_BY_DTOE")).toEqual({ text: "Возвращено ДТОиР", tone: "danger" });
  });
});

describe("getCfoStatusLabel", () => {
  it("возвращает текст и тон для каждого статуса ЦФО", () => {
    expect(getCfoStatusLabel("PENDING")).toEqual({ text: "Ожидает", tone: "neutral" });
    expect(getCfoStatusLabel("APPROVED")).toEqual({ text: "Согласовано", tone: "success" });
    expect(getCfoStatusLabel("RETURNED")).toEqual({ text: "Возвращено", tone: "danger" });
  });
});

describe("getRemarkStatusLabel", () => {
  it("возвращает текст и тон для каждого статуса замечания", () => {
    expect(getRemarkStatusLabel("OPEN")).toEqual({ text: "Открыто", tone: "danger" });
    expect(getRemarkStatusLabel("FIXED_BY_FILIAL")).toEqual({ text: "Исправлено филиалом", tone: "warning" });
    expect(getRemarkStatusLabel("CLOSED")).toEqual({ text: "Закрыто", tone: "neutral" });
  });
});
