import { config } from "@/config/environment";
import { displayStatus, fmtM, fmtSigned, STATUS_LABEL } from "@/lib/sensorLogic";
import { SENSOR_IDS, type SensorSnapshot } from "@/types/sensor";

const SWATCH = { A: "bg-sensor-a", B: "bg-sensor-b", C: "bg-sensor-c" } as const;

export function SensorTable({ snapshot, stale }: { snapshot: SensorSnapshot | null; stale: boolean }) {
  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-3">Sensor Readings {snapshot?.source === "demo" && <span className="tone-warning">· simulated</span>}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              {["Sensor", "Raw Reading", "Residual", "Correction", "Corrected Reading", "Status"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {SENSOR_IDS.map((id) => {
              const s = snapshot?.sensors[id];
              const st = displayStatus(s, stale);
              return (
                <tr key={id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3"><span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-sm ${SWATCH[id]}`} />Sensor {id}</span></td>
                  <td className="py-2 pr-3 num">{fmtM(s?.rawReading)}</td>
                  <td className="py-2 pr-3 num">{fmtSigned(s?.residual)}</td>
                  <td className="py-2 pr-3 num">{fmtSigned(s?.correction)}</td>
                  <td className="py-2 pr-3 num">{fmtM(s?.correctedReading)}</td>
                  <td className={`py-2 tone-${st}`}><span className="inline-flex items-center gap-1.5"><span className="dot" />{STATUS_LABEL[st]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ResidualChart({ snapshot }: { snapshot: SensorSnapshot | null }) {
  const vals = SENSOR_IDS.map((id) => ({ id, r: snapshot?.sensors[id]?.residual ?? null }));
  const valid = vals.filter((v) => v.r !== null);
  if (!valid.length) return (
    <section className="panel p-4"><h2 className="panel-title mb-2">Residuals</h2><p className="text-sm text-muted-foreground">No valid residual data.</p></section>
  );
  // Honest scale: never smaller than 2× critical threshold, so tiny residuals look tiny.
  const scale = Math.max(config.residualCritical * 2, ...valid.map((v) => Math.abs(v.r!)));
  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-3">Residuals <span className="normal-case tracking-normal">(scale ±{scale.toFixed(3)} m)</span></h2>
      <div className="space-y-2">
        {vals.map(({ id, r }) => {
          const pct = r === null ? 0 : (Math.abs(r) / scale) * 50;
          return (
            <div key={id} className="grid grid-cols-[1.5rem_1fr_5.5rem] items-center gap-2 text-xs">
              <span className="num text-muted-foreground">{id}</span>
              <div className="relative h-3 rounded-sm bg-muted">
                <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/50" />
                {r !== null && <div className={`absolute inset-y-0 ${SWATCH[id]}`} style={{ left: r >= 0 ? "50%" : `${50 - pct}%`, width: `${pct}%` }} />}
              </div>
              <span className="num text-right">{fmtSigned(r)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
