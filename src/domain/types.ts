export interface Point {
  date: string;
  value: number | null;
}
export interface Series {
  id: string;
  name: string;
  unit: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  provider: string;
  url: string;
  status: "ok" | "stale" | "unavailable" | "demo";
  reason?: string;
  reasonCode?:
    | "permission_required"
    | "license_review"
    | "integration_pending"
    | "download_failed"
    | "not_downloaded";
  attribution?: string;
  notes?: string;
  fetchedAt: string | null;
  releasedAt?: string | null;
  observations: Point[];
}
export interface EconomicEvent {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  url: string;
  importance: 1 | 2 | 3;
}
export interface Snapshot {
  schemaVersion: 1;
  mode: "live" | "demo";
  generatedAt: string;
  series: Record<string, Series>;
  events: EconomicEvent[];
  calendarStatus: "ok" | "stale" | "partial" | "unavailable" | "demo";
}
export type Transform =
  "level" | "yoy" | "mom" | "change" | "ma3change" | "ma3" | "ma4" | "annual3";
export interface TraceSpec {
  id: string;
  label?: string;
  transform?: Transform;
  axis?: "right";
  color?: string;
}
export interface ChartSpec {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  unit: string;
  rightUnit?: string;
  kind?: "line" | "bar" | "curve" | "scatter" | "sectors";
  traces: TraceSpec[];
  years?: number;
  baseline?: number;
  learn: { what: string; read: string; caution: string };
}
export interface Trace {
  id: string;
  label: string;
  color: string;
  unit: string;
  axis?: "right";
  points: Point[];
}
export type Tone = "positive" | "neutral" | "negative";
export interface Signal {
  label: string;
  value: number | null;
  score: number | null;
  unit: string;
}
export interface Diagnosis {
  title: string;
  label: string;
  tone: Tone;
  score: number | null;
  signals: Signal[];
  note: string;
}
