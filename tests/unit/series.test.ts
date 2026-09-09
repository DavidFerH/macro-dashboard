import { describe, expect, it } from "vitest";
import {
  change,
  combine,
  createSeriesResolver,
  monthly,
  percentile,
  regression,
  rolling,
  shiftedMonth,
  transform,
  windowed,
} from "../../src/domain/series";
import type { Point, Snapshot } from "../../src/domain/types";
const points: Point[] = Array.from({ length: 25 }, (_, i) => ({
  date: new Date(Date.UTC(2023, i, 1)).toISOString().slice(0, 10),
  value: 100 + i,
}));
describe("calendar-aware transformations", () => {
  it("computes year-on-year on the same calendar month", () => {
    expect(change(points, 12)[12].value).toBeCloseTo(12);
    expect(change(points, 12)[0].value).toBeNull();
  });
  it("does not replace missing months with another observation", () => {
    const gap = points.filter((p) => p.date !== "2023-01-01");
    expect(
      change(gap, 12).find((p) => p.date === "2024-01-01")?.value,
    ).toBeNull();
  });
  it("does not divide by zero or treat null as zero", () => {
    expect(
      change(
        [
          { date: "2024-01-01", value: 0 },
          { date: "2024-02-01", value: 10 },
        ],
        1,
      )[1].value,
    ).toBeNull();
    expect(
      change(
        [
          { date: "2024-01-01", value: null },
          { date: "2024-02-01", value: 10 },
        ],
        1,
      )[1].value,
    ).toBeNull();
  });
  it("annualizes the three-month compounded rate", () => {
    expect(change(points, 3, true, true)[3].value).toBeCloseTo(
      (1.03 ** 4 - 1) * 100,
    );
  });
  it("requires a complete contiguous window for monthly averages", () => {
    expect(rolling(points, 3, true)[2].value).toBe(101);
    expect(
      rolling([points[0], points[2], points[3]], 3, true)[2].value,
    ).toBeNull();
  });
  it("keeps unavailable weekly windows unavailable", () => {
    expect(
      rolling(
        [
          { date: "2024-01-01", value: 2 },
          { date: "2024-01-08", value: null },
        ],
        2,
      )[1].value,
    ).toBeNull();
  });
  it("handles year boundaries and leap years", () => {
    expect(shiftedMonth("2024-02-29", -12)).toBe("2023-02");
    expect(shiftedMonth("2024-01-31", -1)).toBe("2023-12");
  });
  it("combines only matching months", () => {
    expect(
      combine([points[0], points[1]], [points[1]], (x, y) => x / y),
    ).toEqual([
      { date: "2023-01-01", value: null },
      { date: "2023-02-01", value: 1 },
    ]);
  });
  it("preserves full history for Todo and filters relative to snapshot", () => {
    expect(windowed(points, 0, "2025-01-01")).toEqual(points);
    expect(windowed(points, 1, "2025-01-01")[0].date).toBe("2024-01-01");
  });
  it("implements monthly change and three-month payroll averages", () => {
    expect(transform(points, "change")[1].value).toBe(1);
    expect(transform(points, "ma3change")[3].value).toBe(1);
  });
  it("aggregates daily values without inventing missing observations", () => {
    expect(
      monthly([
        { date: "2024-01-01", value: 2 },
        { date: "2024-01-02", value: 4 },
        { date: "2024-02-01", value: null },
      ]),
    ).toEqual([
      { date: "2024-01-01", value: 3 },
      { date: "2024-02-01", value: null },
    ]);
  });
});
describe("valuation mathematics", () => {
  it("uses a strict-less-than percentile and supports inverse indicators", () => {
    expect(percentile(2, [1, 2, 2, 3])).toBe(25);
    expect(percentile(2, [1, 2, 2, 3], true)).toBe(75);
    expect(percentile(2, [])).toBeNull();
  });
  it("fits a known linear relationship", () => {
    const result = regression([1, 2, 3, 4].map((x) => ({ x, y: 2 * x + 3 })))!;
    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(3);
    expect(result.r2).toBe(1);
  });
  it("rejects a degenerate regression", () => {
    expect(
      regression([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
      ]),
    ).toBeNull();
  });
  it("converts millions to billions for Buffett and preserves Q units", () => {
    const snapshot = {
      series: Object.fromEntries(
        [
          ["NCBEILQ027S", 60_000_000],
          ["GDP", 30_000],
          ["TNWMVBSNNCB", 40_000_000],
        ].map(([id, value]) => [
          id,
          { observations: [{ date: "2025-01-01", value }] },
        ]),
      ),
    } as unknown as Snapshot;
    const resolve = createSeriesResolver(snapshot);
    expect(resolve("BUFFETT")[0].value).toBe(200);
    expect(resolve("TOBIN")[0].value).toBe(1.5);
    expect(resolve("UNKNOWN")).toEqual([]);
  });
});
