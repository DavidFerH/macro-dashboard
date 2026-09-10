import { describe, expect, it } from "vitest";
import {
  sourceStatus,
  observationPeriod,
} from "../../src/domain/source-status";
import type { Series } from "../../src/domain/types";
const source: Series = {
  id: "test",
  name: "Test",
  unit: "%",
  frequency: "monthly",
  provider: "FRED",
  url: "https://fred.stlouisfed.org/",
  status: "unavailable",
  fetchedAt: null,
  observations: [],
};
describe("source availability", () => {
  it("distinguishes permissions, integration and failed requests", () => {
    expect(sourceStatus({ ...source, reasonCode: "permission_required" })).toBe(
      "Requiere autorización",
    );
    expect(sourceStatus({ ...source, reasonCode: "license_review" })).toBe(
      "Permiso por confirmar",
    );
    expect(sourceStatus({ ...source, reasonCode: "integration_pending" })).toBe(
      "Integración pendiente",
    );
    expect(sourceStatus({ ...source, reasonCode: "download_failed" })).toBe(
      "Error de descarga",
    );
    expect(sourceStatus(source)).toBe("Sin datos");
  });
  it("preserves demo and stale semantics", () => {
    expect(
      sourceStatus({
        ...source,
        status: "demo",
        reasonCode: "permission_required",
      }),
    ).toBe("Sintética");
    expect(sourceStatus({ ...source, status: "stale" })).toBe(
      "Conservada · falló actualización",
    );
  });
  it("shows the observed period independently of the download date", () => {
    expect(observationPeriod(source, "2026-07-01")).toContain("jul");
    expect(
      observationPeriod({ ...source, frequency: "quarterly" }, "2026-01-01"),
    ).toBe("T1 2026");
    expect(
      observationPeriod({ ...source, frequency: "quarterly" }, "2026-10-01"),
    ).toBe("T4 2026");
    expect(observationPeriod(source)).toBe("Sin observación");
  });
});
