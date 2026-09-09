import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../../contracts/snapshot.schema.json";
import type { Snapshot } from "./types";
const ajv = new Ajv({ allErrors: true, strictNumbers: true });
addFormats(ajv);
const validate = ajv.compile<Snapshot>(schema);
export function parseSnapshot(raw: unknown): Snapshot {
  if (!validate(raw))
    throw new Error("El archivo de datos no cumple el contrato del dashboard.");
  for (const [id, series] of Object.entries(raw.series)) {
    if (id !== series.id)
      throw new Error("Identificador de serie incoherente.");
    if (raw.mode === "live" && series.status === "demo")
      throw new Error("Datos de prueba en snapshot real.");
    if (series.status === "unavailable" && series.observations.length)
      throw new Error("Serie no disponible con observaciones.");
    let previous = "";
    for (const point of series.observations) {
      if (point.date <= previous || point.date > raw.generatedAt.slice(0, 10))
        throw new Error("Fechas duplicadas, futuras o desordenadas.");
      previous = point.date;
    }
  }
  return raw;
}
