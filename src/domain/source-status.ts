import type { Series } from "./types";
import { dateLabel } from "./format";

export function sourceStatus(series: Series): string {
  if (series.status === "ok") return "Descargada";
  if (series.status === "stale") return "Conservada · falló actualización";
  if (series.status === "demo") return "Sintética";
  const labels = {
    permission_required: "Requiere autorización",
    license_review: "Permiso por confirmar",
    integration_pending: "Integración pendiente",
    download_failed: "Error de descarga",
    not_downloaded: "Sin descargar",
  };
  return series.reasonCode ? labels[series.reasonCode] : "Sin datos";
}

export function observationPeriod(series: Series, date?: string): string {
  if (!date) return "Sin observación";
  if (series.frequency === "quarterly")
    return `T${Math.ceil(Number(date.slice(5, 7)) / 3)} ${date.slice(0, 4)}`;
  if (series.frequency === "monthly")
    return new Intl.DateTimeFormat("es-ES", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date + "T00:00:00Z"));
  return dateLabel(date);
}
