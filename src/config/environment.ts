/**
 * Central configuration. To connect a real backend set VITE_API_BASE_URL
 * (and optionally the other VITE_* values) in your environment.
 */
const env = import.meta.env;

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  apiBaseUrl: (env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "",
  /** Path of the sensor snapshot endpoint, relative to the base URL. */
  sensorPath: (env["VITE_SENSOR_PATH"] as string | undefined) ?? "/sensors",
  /** Optional command endpoint for target distance. Leave empty if the backend has none. */
  distanceCommandPath: (env["VITE_DISTANCE_COMMAND_PATH"] as string | undefined) ?? "",
  pollIntervalMs: num(env["VITE_POLL_INTERVAL_MS"], 1000),
  requestTimeoutMs: num(env["VITE_REQUEST_TIMEOUT_MS"], 3000),
  /** Readings older than this are flagged stale and never shown as live. */
  staleAfterMs: num(env["VITE_STALE_AFTER_MS"], 5000),
  /** |residual| above this counts as a residual warning (used only when backend gives no classification). */
  residualTolerance: num(env["VITE_RESIDUAL_TOLERANCE"], 0.02),
  /** |residual| above this is shown as red rather than amber. */
  residualCritical: num(env["VITE_RESIDUAL_CRITICAL"], 0.1),
  minDistance: 0.5,
  maxDistance: 10,
  defaultDistance: 2.5,
  precision: 3,
};
