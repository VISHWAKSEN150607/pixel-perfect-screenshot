import { config } from "@/config/environment";
import { SENSOR_IDS, type SensorReading, type SensorSnapshot, type SensorStatus } from "@/types/sensor";

export const fmtM = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v.toFixed(config.precision)} m`;
export const fmtSigned = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(config.precision)} m`;

/** Residual warning: backend classification wins; otherwise configured tolerance. Zero never triggers. */
export function hasResidual(s: SensorReading): boolean {
  if (s.residual === null || s.residual === 0) return s.status === "warning" && s.residual !== 0 && s.residual !== null;
  if (s.correctionApplied === true || s.status === "corrected") return false; // residual resolved by backend correction
  if (s.status === "warning" || s.status === "critical") return true;
  if (s.status === "healthy") return false;
  return Math.abs(s.residual) > config.residualTolerance;
}

/** Corrected only when backend explicitly says so. */
export const isCorrected = (s: SensorReading) => s.correctionApplied === true || s.status === "corrected";

export const isValid = (s: SensorReading | undefined): s is SensorReading =>
  !!s && s.rawReading !== null && s.residual !== null && s.status !== "disconnected" && s.status !== "critical";

export interface Intelligence {
  residuals: SensorReading[];
  corrections: SensorReading[];
  missing: string[];
  allHealthy: boolean;
  zeroResidualNoCorrectionInfo: SensorReading[];
}

export function analyze(snap: SensorSnapshot | null, stale: boolean): Intelligence {
  const list = SENSOR_IDS.map((id) => snap?.sensors[id]);
  const present = list.filter((s): s is SensorReading => !!s);
  const missing = SENSOR_IDS.filter((id) => !snap?.sensors[id] || !isValid(snap.sensors[id]));
  const residuals = present.filter(hasResidual);
  const corrections = present.filter(isCorrected);
  const allHealthy =
    !!snap && !stale && missing.length === 0 && residuals.length === 0 &&
    present.every((s) => (s.status === "healthy" || s.status === "corrected" || (s.status === "unknown" && Math.abs(s.residual!) <= config.residualTolerance)));
  const zeroResidualNoCorrectionInfo = present.filter((s) => s.residual === 0 && s.correctionApplied === null && s.status === "unknown");
  return { residuals, corrections, missing, allHealthy, zeroResidualNoCorrectionInfo };
}

export function displayStatus(s: SensorReading | undefined, stale: boolean): SensorStatus {
  if (!s) return "disconnected";
  if (stale) return "unknown";
  if (s.status === "critical" || s.status === "disconnected") return s.status;
  if (isCorrected(s)) return "corrected";
  if (hasResidual(s)) return Math.abs(s.residual ?? 0) >= config.residualCritical ? "critical" : "warning";
  if (s.status === "unknown" && s.residual === null) return "unknown";
  return "healthy";
}

export const STATUS_LABEL: Record<SensorStatus, string> = {
  healthy: "Healthy", warning: "Residual", corrected: "Corrected", critical: "Critical", unknown: "Unknown", disconnected: "No data",
};
