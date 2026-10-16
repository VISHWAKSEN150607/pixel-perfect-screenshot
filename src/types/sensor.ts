export type SensorId = "A" | "B" | "C";
export const SENSOR_IDS: SensorId[] = ["A", "B", "C"];

export type SensorStatus = "healthy" | "warning" | "corrected" | "critical" | "unknown" | "disconnected";

/** Internal, validated sensor model. `null` means "not supplied / invalid" — never coerced to 0. */
export interface SensorReading {
  id: SensorId;
  rawReading: number | null;
  referenceDistance: number | null;
  residual: number | null;
  correction: number | null;
  correctedReading: number | null;
  correctionApplied: boolean | null;
  status: SensorStatus;
  /** Status string exactly as received, for transparency. */
  rawStatus: string | null;
}

export interface SensorSnapshot {
  timestamp: Date | null;
  distanceToWall: number | null;
  sensors: Partial<Record<SensorId, SensorReading>>;
  source: "live" | "demo";
}

export type ConnectionState = "connecting" | "live" | "stale" | "error" | "demo";
