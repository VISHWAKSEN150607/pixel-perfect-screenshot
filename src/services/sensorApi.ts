import { config } from "@/config/environment";
import { mapSnapshot } from "./sensorMapper";
import type { SensorSnapshot } from "@/types/sensor";

/**
 * Single place for backend endpoints.
 * GET  {VITE_API_BASE_URL}{VITE_SENSOR_PATH}              -> sensor snapshot JSON
 * POST {VITE_API_BASE_URL}{VITE_DISTANCE_COMMAND_PATH}    -> { distance_to_wall } (optional)
 */
export const isBackendConfigured = () => config.apiBaseUrl.length > 0;
export const supportsDistanceCommand = () => isBackendConfigured() && config.distanceCommandPath.length > 0;

async function withTimeout(input: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), config.requestTimeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchSensorSnapshot(): Promise<SensorSnapshot> {
  const res = await withTimeout(config.apiBaseUrl + config.sensorPath, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Backend responded ${res.status}`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error("Backend returned invalid JSON");
  }
  return mapSnapshot(json, "live");
}

export async function sendTargetDistance(distance: number): Promise<void> {
  if (!supportsDistanceCommand()) return;
  const res = await withTimeout(config.apiBaseUrl + config.distanceCommandPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distance_to_wall: distance }),
  });
  if (!res.ok) throw new Error(`Command rejected (${res.status})`);
}
