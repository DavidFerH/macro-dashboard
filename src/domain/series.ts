import type { Point, Snapshot, Transform } from "./types";
export const valid = (points: Point[]) =>
  points.filter(
    (p): p is Point & { value: number } =>
      p.value !== null && Number.isFinite(p.value),
  );
export const latest = (points: Point[]) => valid(points).at(-1);
export const average = (values: number[]) =>
  values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
export const monthKey = (day: string) => day.slice(0, 7);
export function shiftedMonth(day: string, months: number): string {
  const year = Number(day.slice(0, 4)),
    month = Number(day.slice(5, 7)) - 1;
  return new Date(Date.UTC(year, month + months, 1)).toISOString().slice(0, 7);
}
export function monthly(points: Point[]): Point[] {
  const groups = new Map<string, number[]>();
  for (const p of points) {
    const key = monthKey(p.date);
    if (!groups.has(key)) groups.set(key, []);
    if (p.value !== null) groups.get(key)!.push(p.value);
  }
  return [...groups].map(([key, values]) => ({
    date: key + "-01",
    value: average(values),
  }));
}
export function change(
  points: Point[],
  months: number,
  percent = true,
  annualize = false,
): Point[] {
  const lookup = new Map(points.map((p) => [monthKey(p.date), p.value]));
  return points.map((p) => {
    const previous = lookup.get(shiftedMonth(p.date, -months));
    let value: number | null = null;
    if (p.value !== null && previous != null && (!percent || previous !== 0)) {
      value = percent
        ? (annualize
            ? (p.value / previous) ** (12 / months) - 1
            : p.value / previous - 1) * 100
        : p.value - previous;
    }
    return {
      date: p.date,
      value: value !== null && Number.isFinite(value) ? value : null,
    };
  });
}
export function rolling(
  points: Point[],
  size: number,
  months = false,
): Point[] {
  return points.map((point, i) => {
    const window = points.slice(Math.max(0, i - size + 1), i + 1);
    const complete =
      window.length === size &&
      window.every(
        (p, j) =>
          p.value !== null &&
          (!months ||
            monthKey(p.date) === shiftedMonth(point.date, j - size + 1)),
      );
    return {
      date: point.date,
      value: complete ? average(window.map((p) => p.value!)) : null,
    };
  });
}
export function transform(points: Point[], kind: Transform = "level"): Point[] {
  switch (kind) {
    case "yoy":
      return change(points, 12);
    case "mom":
      return change(points, 1);
    case "annual3":
      return change(points, 3, true, true);
    case "change":
      return change(points, 1, false);
    case "ma3change":
      return rolling(change(points, 1, false), 3, true);
    case "ma3":
      return rolling(points, 3, true);
    case "ma4":
      return rolling(points, 4);
    default:
      return points;
  }
}
export function combine(
  a: Point[],
  b: Point[],
  fn: (x: number, y: number) => number,
): Point[] {
  const lookup = new Map(b.map((p) => [monthKey(p.date), p.value]));
  return a.map((p) => {
    const other = lookup.get(monthKey(p.date));
    const value = p.value !== null && other != null ? fn(p.value, other) : null;
    return {
      date: p.date,
      value: value !== null && Number.isFinite(value) ? value : null,
    };
  });
}
export function windowed(
  points: Point[],
  years: number,
  asOf: string,
): Point[] {
  if (!years) return points;
  const cutoff = new Date(asOf);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  return points.filter((p) => p.date >= cutoff.toISOString().slice(0, 10));
}
export function percentile(
  value: number,
  history: number[],
  inverse = false,
): number | null {
  if (!history.length || !Number.isFinite(value)) return null;
  const rank = (history.filter((n) => n < value).length / history.length) * 100;
  return inverse ? 100 - rank : rank;
}
export function regression(points: { x: number; y: number }[]) {
  if (points.length < 3) return null;
  const xMean = average(points.map((p) => p.x))!,
    yMean = average(points.map((p) => p.y))!;
  const ssx = points.reduce((sum, p) => sum + (p.x - xMean) ** 2, 0);
  if (!ssx) return null;
  const slope =
    points.reduce((sum, p) => sum + (p.x - xMean) * (p.y - yMean), 0) / ssx;
  const intercept = yMean - slope * xMean;
  const residual = points.reduce(
    (sum, p) => sum + (p.y - (intercept + slope * p.x)) ** 2,
    0,
  );
  const total = points.reduce((sum, p) => sum + (p.y - yMean) ** 2, 0);
  return {
    slope,
    intercept,
    r2: total ? 1 - residual / total : 0,
    deviation: Math.sqrt(residual / (points.length - 2)),
    count: points.length,
  };
}
export function createSeriesResolver(snapshot: Snapshot) {
  const cache = new Map<string, Point[]>();
  const resolve = (id: string): Point[] => {
    if (cache.has(id)) return cache.get(id)!;
    if (snapshot.series[id]?.observations.length)
      return snapshot.series[id].observations;
    const raw = (key: string) => resolve(key);
    const ratio = (a: string, b: string, scale = 1) =>
      combine(raw(a), raw(b), (x, y) => (x / y) * scale);
    let points: Point[] = [];
    switch (id) {
      case "REAL_RETAIL":
        points = ratio("RSAFS", "CPIAUCSL");
        break;
      case "VACANCY_RATIO":
        points = ratio("JTSJOL", "UNEMPLOY");
        break;
      case "REAL_EARNINGS":
        points = ratio("SH_E", "SH_CPI");
        break;
      case "REAL_EARNINGS10":
        points = rolling(raw("REAL_EARNINGS"), 120, true);
        break;
      case "SH_CAPE":
        points = combine(
          ratio("SH_P", "SH_CPI"),
          raw("REAL_EARNINGS10"),
          (p, e) => p / e,
        );
        break;
      case "PE":
        points = ratio("SH_P", "SH_E");
        break;
      case "DY":
        points = ratio("SH_D", "SH_P", 100);
        break;
      case "EY":
        points = ratio("SH_E", "SH_P", 100);
        break;
      case "CAPE_YIELD":
        points = raw("SH_CAPE").map((p) => ({
          ...p,
          value: p.value && p.value > 0 ? 100 / p.value : null,
        }));
        break;
      case "ECY": {
        const inflation10 = change(raw("SH_CPI"), 120, true, true);
        const realBond = combine(
          raw("SH_GS10"),
          inflation10,
          (bond, inflation) => bond - inflation,
        );
        points = combine(raw("CAPE_YIELD"), realBond, (a, b) => a - b);
        break;
      }
      case "FED_MODEL":
        points = combine(raw("EY"), raw("SH_GS10"), (a, b) => a - b);
        break;
      case "RULE20":
        points = combine(
          raw("PE"),
          change(raw("CPIAUCNS"), 12),
          (a, b) => a + b,
        );
        break;
      // Z.1 equity is millions of USD; GDP is billions of USD.
      case "BUFFETT":
        points = ratio("NCBEILQ027S", "GDP", 0.1);
        break;
      case "TOBIN":
        points = ratio("NCBEILQ027S", "TNWMVBSNNCB");
        break;
      case "PROFIT_GDP":
        points = ratio("CPATAX", "GDP", 100);
        break;
      case "RETURN10": {
        const prices = raw("SH_P"),
          dividends = new Map(
            raw("SH_D").map((p) => [monthKey(p.date), p.value]),
          );
        let wealth: number | null = 1;
        const total = prices.map((p, i) => {
          const previous = prices[i - 1];
          const dividend = dividends.get(monthKey(p.date));
          if (
            i &&
            (wealth === null ||
              p.value == null ||
              previous.value == null ||
              previous.value <= 0 ||
              dividend == null ||
              shiftedMonth(previous.date, 1) !== monthKey(p.date))
          )
            wealth = null;
          else if (i)
            wealth = (wealth! * (p.value! + dividend! / 12)) / previous.value!;
          return { date: p.date, value: wealth };
        });
        const real = combine(total, raw("SH_CPI"), (a, b) => a / b);
        const lookup = new Map(real.map((p) => [monthKey(p.date), p.value]));
        points = real.map((p) => {
          const future = lookup.get(shiftedMonth(p.date, 120));
          return {
            date: p.date,
            value:
              p.value && future != null
                ? ((future / p.value) ** 0.1 - 1) * 100
                : null,
          };
        });
        break;
      }
    }
    cache.set(id, points);
    return points;
  };
  return resolve;
}
