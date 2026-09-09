import { describe, expect, it } from "vitest";
import { parseSnapshot } from "../../src/domain/validate";
import { charts, sections } from "../../src/catalog/charts";
import sources from "../../contracts/sources.json";
import { madridDate } from "../../src/domain/format";
const fixture = () => ({
  schemaVersion: 1,
  mode: "live",
  generatedAt: "2026-09-09T12:00:00Z",
  calendarStatus: "ok",
  events: [],
  series: {
    DGS10: {
      id: "DGS10",
      name: "10 años",
      unit: "%",
      frequency: "daily",
      provider: "FRED",
      url: "https://fred.stlouisfed.org/series/DGS10",
      status: "ok",
      fetchedAt: "2026-09-09T12:00:00Z",
      observations: [{ date: "2026-09-01", value: 4 }],
    },
  },
});
describe("snapshot contract", () => {
  it("validates a well-formed snapshot", () =>
    expect(parseSnapshot(fixture()).mode).toBe("live"));
  it("rejects duplicate dates", () => {
    const data = fixture();
    data.series.DGS10.observations.push(data.series.DGS10.observations[0]);
    expect(() => parseSnapshot(data)).toThrow();
  });
  it("rejects non-finite values", () => {
    const data = fixture();
    data.series.DGS10.observations[0].value = Infinity;
    expect(() => parseSnapshot(data)).toThrow();
  });
  it("rejects demo observations in live data", () => {
    const data = fixture();
    data.series.DGS10.status = "demo";
    expect(() => parseSnapshot(data)).toThrow();
  });
  it("rejects future dates and arbitrary properties", () => {
    const data = fixture();
    data.series.DGS10.observations[0].date = "2030-01-01";
    expect(() => parseSnapshot(data)).toThrow();
    expect(() =>
      parseSnapshot({ ...fixture(), secret: "forbidden" }),
    ).toThrow();
  });
  it("rejects invalid dates", () => {
    const data = fixture();
    data.series.DGS10.observations[0].date = "2026-02-30";
    expect(() => parseSnapshot(data)).toThrow();
  });
});
describe("catalogue and dates", () => {
  it("contains 44 unique charts with the expected section counts", () => {
    expect(charts).toHaveLength(44);
    expect(new Set(charts.map((c) => c.id)).size).toBe(44);
    expect(
      sections.map((s) => charts.filter((c) => c.section === s.id).length),
    ).toEqual([4, 8, 7, 7, 5, 13]);
  });
  it("references declared or explicitly derived series", () => {
    const ids = new Set([
      ...sources.map((s) => s.id),
      "REAL_RETAIL",
      "VACANCY_RATIO",
      "REAL_EARNINGS",
      "REAL_EARNINGS10",
      "PE",
      "DY",
      "EY",
      "CAPE_YIELD",
      "ECY",
      "FED_MODEL",
      "RULE20",
      "BUFFETT",
      "TOBIN",
      "PROFIT_GDP",
      "RETURN10",
    ]);
    charts.forEach((c) =>
      c.traces.forEach((t) => expect(ids.has(t.id), t.id).toBe(true)),
    );
  });
  it("uses Madrid calendar dates across UTC midnight and DST", () => {
    expect(madridDate(new Date("2026-09-09T23:30:00Z"))).toBe("2026-09-10");
    expect(madridDate(new Date("2026-01-09T22:30:00Z"))).toBe("2026-01-09");
  });
});
