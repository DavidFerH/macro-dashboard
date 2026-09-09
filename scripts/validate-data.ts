import { readFileSync } from "node:fs";
import { parseSnapshot } from "../src/domain/validate";
import { createSeriesResolver, valid } from "../src/domain/series";
import { charts } from "../src/catalog/charts";
import { buildDiagnostics } from "../src/domain/diagnostics";
import { valuation } from "../src/domain/valuation";
const snapshot = parseSnapshot(
  JSON.parse(
    readFileSync(process.argv[2] ?? "public/data/snapshot.json", "utf8"),
  ),
);
if (process.env.REQUIRE_LIVE === "true" && snapshot.mode !== "live")
  throw new Error("Production refuses demo data.");
const resolve = createSeriesResolver(snapshot);
for (const spec of charts) {
  for (const trace of spec.traces) {
    if (
      resolve(trace.id).some(
        (p) => p.value !== null && !Number.isFinite(p.value),
      )
    )
      throw new Error("Non-finite derived value: " + trace.id);
  }
}
const buffett = valid(resolve("BUFFETT")).at(-1);
if (buffett && (buffett.value < 0 || buffett.value > 2000))
  throw new Error("Buffett units or range invalid.");
console.log(
  JSON.stringify({
    mode: snapshot.mode,
    charts: charts.length,
    coveredCharts: charts.filter((c) =>
      c.traces.some((t) => valid(resolve(t.id)).length),
    ).length,
    completeCharts: charts.filter((c) =>
      c.traces.every((t) => valid(resolve(t.id)).length),
    ).length,
    diagnoses: buildDiagnostics(resolve).map((d) => ({
      title: d.title,
      label: d.label,
    })),
    valuationCoverage: valuation(resolve, 1881).coverage,
  }),
);
