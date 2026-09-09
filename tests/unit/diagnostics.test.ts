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
  it("does not color two recession alarms green because the mean is positive", () => {
    const cards = buildDiagnostics((id) => {
      if (id === "SAHMREALTIME") return [{ date: "2025-01-01", value: 0.1 }];
      if (id === "CFNAIMA3") return [{ date: "2025-01-01", value: -0.8 }];
      if (id === "T10Y3M") return [{ date: "2025-01-01", value: -0.1 }];
      if (id === "PAYEMS")
        return Array.from({ length: 4 }, (_, i) => ({
          date: new Date(Date.UTC(2024, i, 1)).toISOString().slice(0, 10),
          value: 1000 + 200 * i,
        }));
      if (id === "ICSA")
        return Array.from({ length: 52 }, (_, i) => ({
          date: new Date(Date.UTC(2024, 0, 1 + i * 7))
            .toISOString()
            .slice(0, 10),
          value: 200000,
        }));
      return [];
    });
    expect(cards[4].label).toBe("Elevado");
    expect(cards[4].tone).toBe("negative");
  });
});
