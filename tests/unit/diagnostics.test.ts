import { describe, expect, it } from "vitest";
import {
  buildDiagnostics,
  classifyGrowth,
  classifyInflation,
  classifyRecession,
} from "../../src/domain/diagnostics";
import { valuation } from "../../src/domain/valuation";
describe("diagnostic boundaries", () => {
  it.each([
    [0.6, "Fuerte"],
    [0.2, "Sólido"],
    [0, "En tendencia"],
    [-0.2, "Débil"],
    [-0.6, "Contracción"],
  ])("growth %s = %s", (score, label) => {
    expect(classifyGrowth(Number(score))).toBe(label);
  });
  it.each([
    [1.49, "Por debajo"],
    [1.5, "En objetivo"],
    [2.5, "Por encima"],
    [3.5, "Alta"],
    [5, "Muy alta"],
  ])("inflation %s = %s", (value, label) => {
    expect(classifyInflation(Number(value))).toBe(label);
  });
  it("gives Sahm priority over a benign alarm count", () => {
    expect(classifyRecession(0, 0, 0.5)).toBe("Muy elevado");
    expect(classifyRecession(0, 0, 0.49)).toBe("Bajo");
  });
  it.each([
    [3, 0, "Muy elevado"],
    [2, 0, "Elevado"],
    [1, 0, "Moderado"],
    [0, 1, "Bajo · vigilar"],
    [0, 0, "Bajo"],
  ])("counts alarms %s and warnings %s", (alarms, warnings, label) => {
    expect(classifyRecession(Number(alarms), Number(warnings), null)).toBe(
      label,
    );
  });
  it("does not produce reassuring labels with missing data", () => {
    for (const card of buildDiagnostics(() => []))
      expect(card.label).toBe("Datos insuficientes");
    expect(valuation(() => [], 1881).score).toBeNull();
  });
  it("keeps Sahm overrides even if other sources are missing", () => {
    const cards = buildDiagnostics((id) =>
      id === "SAHMREALTIME" ? [{ date: "2025-01-01", value: 0.5 }] : [],
    );
    expect(cards[2].label).toBe("Deterioro · Sahm");
    expect(cards[4].label).toBe("Muy elevado");
  });
});
