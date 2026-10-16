import { mapSnapshot } from "./sensorMapper";
import type { SensorSnapshot } from "@/types/sensor";

export type DemoScenario = "residual" | "corrected" | "noerror";

/** SIMULATED payloads, shaped like the illustrative backend schema. Scaled to the current visual distance. */
export function demoSnapshot(scenario: DemoScenario, d: number): SensorSnapshot {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  const sensors =
    scenario === "residual"
      ? [
          { id: "A", raw_reading: r(d + 0.12), reference_distance: r(d), residual: 0.12, correction: null, corrected_reading: null, correction_applied: false, status: "warning" },
          { id: "B", raw_reading: r(d), reference_distance: r(d), residual: 0, correction: 0, corrected_reading: null, correction_applied: false, status: "healthy" },
          { id: "C", raw_reading: r(d - 0.035), reference_distance: r(d), residual: -0.035, correction: null, corrected_reading: null, correction_applied: false, status: "warning" },
        ]
      : scenario === "corrected"
        ? [
            { id: "A", raw_reading: r(d + 0.12), reference_distance: r(d), residual: 0.12, correction: -0.12, corrected_reading: r(d), correction_applied: true, status: "corrected" },
            { id: "B", raw_reading: r(d), reference_distance: r(d), residual: 0, correction: 0, corrected_reading: r(d), correction_applied: false, status: "healthy" },
            { id: "C", raw_reading: r(d - 0.004), reference_distance: r(d), residual: -0.004, correction: 0, corrected_reading: r(d - 0.004), correction_applied: false, status: "healthy" },
          ]
        : [
            { id: "A", raw_reading: r(d + 0.003), reference_distance: r(d), residual: 0.003, correction: 0, corrected_reading: r(d + 0.003), correction_applied: false, status: "healthy" },
            { id: "B", raw_reading: r(d), reference_distance: r(d), residual: 0, correction: 0, corrected_reading: r(d), correction_applied: false, status: "healthy" },
            { id: "C", raw_reading: r(d - 0.002), reference_distance: r(d), residual: -0.002, correction: 0, corrected_reading: r(d - 0.002), correction_applied: false, status: "healthy" },
          ];
  return mapSnapshot({ timestamp: new Date().toISOString(), distance_to_wall: r(d), sensors }, "demo");
}
