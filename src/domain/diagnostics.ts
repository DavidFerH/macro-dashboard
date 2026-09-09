import {
  average,
  change,
  latest,
  rolling,
  shiftedMonth,
  valid,
} from "./series";
import type { Diagnosis, Point, Signal, Tone } from "./types";
const band = (value: number, good: number, middle: number, reverse = false) =>
  reverse
    ? value < good
      ? 1
      : value <= middle
        ? 0
        : -1
    : value > good
      ? 1
      : value >= middle
        ? 0
        : -1;
export function classifyGrowth(score: number) {
  return score >= 0.6
    ? "Fuerte"
    : score >= 0.2
      ? "Sólido"
      : score > -0.2
        ? "En tendencia"
        : score > -0.6
          ? "Débil"
          : "Contracción";
}
export function classifyInflation(value: number) {
  return value < 1.5
    ? "Por debajo"
    : value < 2.5
      ? "En objetivo"
      : value < 3.5
        ? "Por encima"
        : value < 5
          ? "Alta"
          : "Muy alta";
}
export function classifyRecession(
  alarms: number,
  warnings: number,
  sahm: number | null,
) {
  return sahm !== null && sahm >= 0.5
    ? "Muy elevado"
    : alarms >= 3
      ? "Muy elevado"
      : alarms === 2
        ? "Elevado"
        : alarms === 1
          ? "Moderado"
          : warnings
            ? "Bajo · vigilar"
            : "Bajo";
}
export function buildDiagnostics(
  resolve: (id: string) => Point[],
): Diagnosis[] {
  const end = (id: string) => latest(resolve(id))?.value ?? null;
  const last = (points: Point[]) => latest(points)?.value ?? null;
  const yoy = (id: string) => last(change(resolve(id), 12));
  const recent = (id: string, n: number) => {
    const values = valid(resolve(id)).slice(-n);
    return values.length === n ? average(values.map((p) => p.value)) : null;
  };
  const signal = (
    label: string,
    value: number | null,
    unit: string,
    rule: (n: number) => number,
  ): Signal => ({
    label,
    value,
    unit,
    score: value === null ? null : rule(value),
  });
  const unrate = end("UNRATE"),
    unemploymentHistory = valid(resolve("UNRATE")).slice(-13, -1);
  const unemploymentRise =
    unrate !== null && unemploymentHistory.length === 12
      ? unrate - Math.min(...unemploymentHistory.map((p) => p.value))
      : null;
  const payroll = last(rolling(change(resolve("PAYEMS"), 1, false), 3, true));
  const claims4 = last(rolling(resolve("ICSA"), 4)),
    claims52 = last(rolling(resolve("ICSA"), 52));
  const claimsRatio = claims4 !== null && claims52 ? claims4 / claims52 : null;
  const ny = end("GACDISA066MSFRBNY"),
    philly = end("GACDFSA066MSFRBPHI");
  const growth = [
    signal("PIB · media 2T", recent("A191RL1Q225SBEA", 2), "%", (n) =>
      band(n, 2.5, 1),
    ),
    signal("Empleo · media 3m", payroll, "mil", (n) => band(n, 150, 50)),
    signal("Paro sobre mínimo 12m", unemploymentRise, "pp", (n) =>
      n <= 0.1 ? 1 : n <= 0.3 ? 0 : -1,
    ),
    signal("Solicitudes 4s / 52s", claimsRatio, "×", (n) =>
      band(n, 0.95, 1.1, true),
    ),
    signal("Producción industrial", yoy("INDPRO"), "%", (n) => band(n, 1, -1)),
    signal("Ventas reales", yoy("REAL_RETAIL"), "%", (n) => band(n, 1, -1)),
    signal(
      "NY / Filadelfia",
      ny !== null && philly !== null ? (ny + philly) / 2 : null,
      "",
      (n) => band(n, 10, -5),
    ),
    signal("CFNAI · media 3m", end("CFNAIMA3"), "", (n) => band(n, 0.2, -0.35)),
  ];
  const core = yoy("PCEPILFE");
  const coreHistory = change(resolve("PCEPILFE"), 12);
  const coreCurrent = latest(coreHistory);
  const inflationDelta = (months: number) => {
    if (!coreCurrent) return null;
    const previous = coreHistory.find(
      (p) => p.date.slice(0, 7) === shiftedMonth(coreCurrent.date, -months),
    );
    return previous?.value != null ? coreCurrent.value - previous.value : null;
  };
  const pricesManufacturing = end("ISM_PRICES"),
    pricesServices = end("ISM_NMPRICES");
  const inflation = [
    signal("PCE subyacente", core, "%", (n) =>
      n <= 2.5 ? 1 : n <= 3.5 ? 0 : -1,
    ),
    signal("IPC", yoy("CPIAUCNS"), "%", (n) =>
      n <= 2.5 ? 1 : n <= 3.5 ? 0 : -1,
    ),
    signal("PCE · cambio 6m", inflationDelta(6), "pp", (n) =>
      n < -0.25 ? 1 : n <= 0.25 ? 0 : -1,
    ),
    signal("PCE · cambio 12m", inflationDelta(12), "pp", (n) =>
      n < -0.25 ? 1 : n <= 0.25 ? 0 : -1,
    ),
    signal(
      "ISM · precios",
      pricesManufacturing !== null && pricesServices !== null
        ? (pricesManufacturing + pricesServices) / 2
        : null,
      "",
      (n) => (n < 50 ? 1 : n <= 60 ? 0 : -1),
    ),
    signal("Expectativas 5 años", end("T5YIE"), "%", (n) =>
      n <= 2.5 ? 1 : n <= 3 ? 0 : -1,
    ),
    signal("Salarios", yoy("CES0500000003"), "%", (n) =>
      n <= 3.5 ? 1 : n <= 4.5 ? 0 : -1,
    ),
  ];
  const sahm = end("SAHMREALTIME");
  const employment = [
    growth[1],
    growth[2],
    growth[3],
    signal("Vacantes / desempleados", end("VACANCY_RATIO"), "×", (n) =>
      band(n, 1.2, 1),
    ),
    signal("Sahm", sahm, "pp", (n) => (n < 0.3 ? 1 : n < 0.5 ? 0 : -1)),
  ];
  const financial = [
    signal("High yield", end("BAMLH0A0HYM2"), "%", (n) =>
      n < 4 ? 1 : n <= 5 ? 0 : -1,
    ),
    signal("NFCI", end("NFCI"), "", (n) =>
      n < -0.25 ? 1 : n <= 0.25 ? 0 : -1,
    ),
    signal("VIX", end("VIXCLS"), "", (n) => (n < 20 ? 1 : n <= 30 ? 0 : -1)),
    signal("Tipo real 10 años", end("DFII10"), "%", (n) =>
      n < 1 ? 1 : n <= 2 ? 0 : -1,
    ),
  ];
  const recession = [
    signal("Sahm", sahm, "pp", (n) => (n >= 0.5 ? -1 : n >= 0.3 ? 0 : 1)),
    signal("CFNAI · media 3m", end("CFNAIMA3"), "", (n) =>
      n < -0.7 ? -1 : n < -0.35 ? 0 : 1,
    ),
    signal("Curva 10a − 3m", end("T10Y3M"), "pp", (n) =>
      n < 0 ? -1 : n < 0.5 ? 0 : 1,
    ),
    signal("Empleo · media 3m", payroll, "mil", (n) =>
      n < 0 ? -1 : n < 50 ? 0 : 1,
    ),
    signal("Solicitudes 4s / 52s", claimsRatio, "×", (n) =>
      n > 1.2 ? -1 : n > 1.1 ? 0 : 1,
    ),
  ];
  const make = (
    title: string,
    signals: Signal[],
    classify: (score: number) => string,
    note: string,
    required = signals.length,
  ): Diagnosis => {
    const scores = signals.flatMap((s) => (s.score === null ? [] : [s.score]));
    const score = scores.length >= required ? average(scores) : null;
    const tone: Tone =
      score === null
        ? "neutral"
        : score >= 0.2
          ? "positive"
          : score <= -0.2
            ? "negative"
            : "neutral";
    return {
      title,
      signals,
      score,
      tone,
      label: score === null ? "Datos insuficientes" : classify(score),
      note,
    };
  };
  const growthCard = make(
    "Crecimiento",
    growth,
    classifyGrowth,
    "Media equiponderada de señales disponibles; mínimo 6 de 8.",
    6,
  );
  const inflationCard = make(
    "Inflación",
    inflation,
    () => classifyInflation(core!),
    "Clasificación por PCE subyacente interanual; objetivo de referencia 2%.",
    1,
  );
  inflationCard.label =
    core === null ? "Datos insuficientes" : classifyInflation(core);
  inflationCard.tone =
    core === null
      ? "neutral"
      : core < 2.5
        ? "positive"
        : core < 3.5
          ? "neutral"
          : "negative";
  const employmentCard = make(
    "Empleo",
    employment,
    (n) =>
      n >= 0.4
        ? "Saludable"
        : n >= 0
          ? "Enfriándose"
          : n > -0.5
            ? "Deteriorándose"
            : "Débil",
    "Sahm ≥ 0,50 tiene prioridad sobre la media.",
    4,
  );
  if (sahm !== null && sahm >= 0.5) {
    employmentCard.label = "Deterioro · Sahm";
    employmentCard.tone = "negative";
  }
  const financialCard = make(
    "Condiciones financieras",
    financial,
    (n) =>
      n >= 0.5
        ? "Holgadas"
        : n >= 0
          ? "Normales"
          : n > -0.5
            ? "Tensas"
            : "Muy tensas",
    "Requiere las cuatro señales; no se infiere VIX ni crédito.",
  );
  const recessionCard = make(
    "Riesgo de recesión",
    recession,
    () =>
      classifyRecession(
        recession.filter((s) => s.score === -1).length,
        recession.filter((s) => s.score === 0).length,
        sahm,
      ),
    "Clasificación de alarmas; no es una probabilidad de recesión.",
  );
  if (sahm !== null && sahm >= 0.5) {
    recessionCard.label = "Muy elevado";
    recessionCard.tone = "negative";
  }
  // Alarm count, not the mean signal score, determines recession severity.
  if (recessionCard.label !== "Datos insuficientes") {
    const alarms = recession.filter((s) => s.score === -1).length;
    const warnings = recession.filter((s) => s.score === 0).length;
    recessionCard.tone =
      (sahm !== null && sahm >= 0.5) || alarms >= 2
        ? "negative"
        : alarms || warnings
          ? "neutral"
          : "positive";
  }
  return [
    growthCard,
    inflationCard,
    employmentCard,
    financialCard,
    recessionCard,
  ];
}
