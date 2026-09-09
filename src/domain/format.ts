export function number(value: number | null | undefined, decimals = 2) {
  return value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value);
}
export function dateLabel(value: string | undefined) {
  return value
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value.length === 10 ? value + "T00:00:00Z" : value))
    : "Sin observación";
}
export function madridDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
