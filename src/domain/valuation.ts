import { average, latest, percentile, regression, valid } from "./series";
import type { Point } from "./types";
export const valuationMetrics = [
  { id: "SH_CAPE", name: "CAPE", unit: "×" },
  { id: "PE", name: "PER", unit: "×" },
  { id: "DY", name: "Rentabilidad dividendo", unit: "%", inverse: true },
  { id: "ECY", name: "Excess CAPE yield", unit: "%", inverse: true },
  { id: "FED_MODEL", name: "Fed model", unit: "pp", inverse: true },
  { id: "RULE20", name: "Regla del 20", unit: "" },
  { id: "BUFFETT", name: "Buffett", unit: "%" },
  { id: "TOBIN", name: "Q · aproximación", unit: "×" },
  { id: "BOGZ1FL153064486Q", name: "Acciones de hogares", unit: "%" },
  { id: "PROFIT_GDP", name: "Beneficios / PIB", unit: "%" },
  {
    id: "THREEFYTP10",
    name: "Prima por plazo",
    unit: "%",
    inverse: true,
    excluded: true,
  },
  {
    id: "BAMLC0A0CM",
    name: "Spread IG",
    unit: "%",
    inverse: true,
    excluded: true,
  },
];
export function valuation(resolve: (id: string) => Point[], base: number) {
  const tiles = valuationMetrics.map((metric) => {
    const points = valid(resolve(metric.id)).filter(
      (p) => p.date >= base + "-01-01",
    );
    const current = points.at(-1);
    return {
      ...metric,
      current,
      count: points.length,
      rank:
        current && points.length >= 24
          ? percentile(
              current.value,
              points.map((p) => p.value),
              metric.inverse,
            )
          : null,
    };
  });
  const ranks = tiles
    .filter((t) => !t.excluded && t.rank !== null)
    .map((t) => t.rank!);
  const score = ranks.length === 10 ? average(ranks) : null;
  return {
    tiles,
    score,
    coverage: ranks.length,
    label:
      score === null
        ? "Cobertura incompleta"
        : score < 25
          ? "Barata"
          : score < 45
            ? "Razonable"
            : score < 65
              ? "Exigente"
              : score < 85
                ? "Cara"
                : "Muy cara",
  };
}
export function capeRegression(resolve: (id: string) => Point[]) {
  const returns = new Map(
    resolve("RETURN10").map((p) => [p.date.slice(0, 7), p.value]),
  );
  const points = valid(resolve("SH_CAPE")).flatMap((p) => {
    const future = returns.get(p.date.slice(0, 7));
    return p.value > 0 && future != null
      ? [{ date: p.date, x: p.value, y: future }]
      : [];
  });
  const model =
    points.length > 200
      ? regression(points.map((p) => ({ x: Math.log(p.x), y: p.y })))
      : null;
  const current = latest(resolve("SH_CAPE"));
  return {
    points,
    model,
    estimate:
      model && current && current.value > 0
        ? model.intercept + model.slope * Math.log(current.value)
        : null,
  };
}
