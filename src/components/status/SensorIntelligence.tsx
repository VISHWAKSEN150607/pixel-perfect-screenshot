import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { config } from "@/config/environment";
import { fmtM, fmtSigned, type Intelligence } from "@/lib/sensorLogic";
import type { SensorSnapshot } from "@/types/sensor";

interface Props { intel: Intelligence; snapshot: SensorSnapshot | null; stale: boolean }

export function SensorIntelligence({ intel, snapshot, stale }: Props) {
  const { residuals, corrections, missing, allHealthy, zeroResidualNoCorrectionInfo } = intel;
  const critical = residuals.some((s) => Math.abs(s.residual ?? 0) >= config.residualCritical);
  return (
    <section className="panel p-4" aria-labelledby="intel-title">
      <h2 id="intel-title" className="panel-title mb-3">Sensor Intelligence</h2>
      <ul className="space-y-3">
        {/* 1 — Residual detected */}
        <li className={`rounded-md border border-border p-3 ${residuals.length ? (critical ? "tone-critical" : "tone-warning") : "tone-unknown"}`}>
          <div className="flex items-center gap-2 font-semibold tracking-wide text-sm">
            <AlertTriangle className="h-4 w-4" aria-hidden /> RESIDUAL DETECTED
            <span className="ml-auto num text-xs">{residuals.length ? `${residuals.length} active` : "none"}</span>
          </div>
          <div className="mt-2 space-y-2 text-foreground text-sm">
            {residuals.length === 0 ? (
              <p className="text-muted-foreground">{snapshot ? "No active residual warnings." : "Awaiting sensor data."}</p>
            ) : residuals.map((s) => (
              <div key={s.id}>
                <p>Sensor {s.id} has a residual of <span className="num font-semibold">{fmtSigned(s.residual)}</span>.</p>
                <p className="num text-xs text-muted-foreground">Measured: {fmtM(s.rawReading)} | Reference: {fmtM(s.referenceDistance)}</p>
              </div>
            ))}
            {residuals.length > 0 && <p className="text-xs text-muted-foreground">A residual is the gap between what a sensor measured and the expected distance. Tolerance ±{config.residualTolerance.toFixed(3)} m.</p>}
          </div>
        </li>
        {/* 2 — Sensor corrected */}
        <li className={`rounded-md border border-border p-3 ${corrections.length ? "tone-corrected" : "tone-unknown"}`}>
          <div className="flex items-center gap-2 font-semibold tracking-wide text-sm">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> SENSOR CORRECTED
            <span className="ml-auto num text-xs">{corrections.length ? `${corrections.length} event${corrections.length > 1 ? "s" : ""}` : "none"}</span>
          </div>
          <div className="mt-2 space-y-2 text-foreground text-sm">
            {corrections.length === 0 ? (
              <p className="text-muted-foreground">
                {zeroResidualNoCorrectionInfo.length
                  ? `Sensor ${zeroResidualNoCorrectionInfo.map((s) => s.id).join(", ")} shows zero residual, but no correction was reported.`
                  : "No new correction events."}
              </p>
            ) : corrections.map((s) => (
              <div key={s.id}>
                <p>Sensor {s.id} corrected by <span className="num font-semibold">{fmtSigned(s.correction)}</span>.</p>
                <p className="num text-xs text-muted-foreground">Original Reading: {fmtM(s.rawReading)} | Corrected Reading: {fmtM(s.correctedReading)}</p>
              </div>
            ))}
            {corrections.length > 0 && <p className="text-xs text-muted-foreground">Correction confirmed by the {snapshot?.source === "demo" ? "simulated" : ""} backend.</p>}
          </div>
        </li>
        {/* 3 — No error */}
        <li className={`rounded-md border border-border p-3 ${allHealthy ? "tone-healthy" : "tone-unknown"}`}>
          <div className="flex items-center gap-2 font-semibold tracking-wide text-sm">
            <ShieldCheck className="h-4 w-4" aria-hidden /> NO ERROR
            <span className="ml-auto num text-xs">{allHealthy ? "confirmed" : "not confirmed"}</span>
          </div>
          <div className="mt-2 text-sm text-foreground">
            {allHealthy ? (
              <>
                <p>All sensors are within the permitted residual tolerance.</p>
                <p className="num text-xs text-muted-foreground">
                  {(["A", "B", "C"] as const).map((id) => `Sensor ${id}: ${fmtM(snapshot?.sensors[id]?.correctedReading ?? snapshot?.sensors[id]?.rawReading)}`).join(" | ")}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {!snapshot ? "No data — health cannot be confirmed."
                  : stale ? "Readings are stale — health cannot be confirmed."
                  : missing.length ? `Cannot confirm: Sensor ${missing.join(", ")} missing or invalid.`
                  : residuals.length ? "Not all sensors are within tolerance."
                  : "Backend has not confirmed all sensors healthy."}
              </p>
            )}
          </div>
        </li>
      </ul>
    </section>
  );
}
