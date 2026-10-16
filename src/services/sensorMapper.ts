import { SENSOR_IDS, type SensorId, type SensorReading, type SensorSnapshot, type SensorStatus } from "@/types/sensor";

/**
 * Adapts the backend response to the internal model.
 * Adjust the field names in `pick(...)` calls if the real backend differs.
 */
const finite = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const pick = (o: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) if (k in o) return o[k];
  return undefined;
};

const STATUS_MAP: Record<string, SensorStatus> = {
  healthy: "healthy", ok: "healthy", normal: "healthy", good: "healthy",
  warning: "warning", warn: "warning", residual: "warning", drift: "warning",
  corrected: "corrected", calibrated: "corrected",
  critical: "critical", error: "critical", fault: "critical", failed: "critical",
  disconnected: "disconnected", offline: "disconnected",
};

function mapSensor(raw: unknown): SensorReading | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(pick(o, "id", "sensor_id", "name") ?? "").toUpperCase().replace(/^SENSOR[_\s-]*/, "") as SensorId;
  if (!SENSOR_IDS.includes(id)) return null;
  const rawStatus = typeof o.status === "string" ? o.status : null;
  const ca = pick(o, "correction_applied", "correctionApplied", "corrected");
  return {
    id,
    rawReading: finite(pick(o, "raw_reading", "rawReading", "reading", "value")),
    referenceDistance: finite(pick(o, "reference_distance", "referenceDistance", "expected")),
    residual: finite(pick(o, "residual")),
    correction: finite(pick(o, "correction", "correction_value")),
    correctedReading: finite(pick(o, "corrected_reading", "correctedReading")),
    correctionApplied: typeof ca === "boolean" ? ca : null,
    status: rawStatus ? STATUS_MAP[rawStatus.toLowerCase()] ?? "unknown" : "unknown",
    rawStatus,
  };
}

export class PayloadError extends Error {}

export function mapSnapshot(payload: unknown, source: "live" | "demo"): SensorSnapshot {
  if (!payload || typeof payload !== "object") throw new PayloadError("Response is not a JSON object");
  const o = payload as Record<string, unknown>;
  const list = pick(o, "sensors", "readings");
  if (!Array.isArray(list)) throw new PayloadError("Response has no 'sensors' array");
  const sensors: SensorSnapshot["sensors"] = {};
  for (const s of list) {
    const m = mapSensor(s);
    if (m) sensors[m.id] = m;
  }
  const ts = pick(o, "timestamp", "time", "updated_at");
  const d = ts ? new Date(String(ts)) : null;
  return {
    timestamp: d && !isNaN(d.getTime()) ? d : null,
    distanceToWall: finite(pick(o, "distance_to_wall", "distanceToWall", "distance")),
    sensors,
    source,
  };
}
