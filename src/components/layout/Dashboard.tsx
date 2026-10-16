import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Eye, Pause, RotateCcw, Radio, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreeDScene, type CameraView, type SceneHandle } from "@/components/simulation/ThreeDScene";
import { SensorIntelligence } from "@/components/status/SensorIntelligence";
import { SensorTable, ResidualChart } from "@/components/sensors/SensorPanels";
import { useCarMovement } from "@/hooks/useCarMovement";
import { useSensorData } from "@/hooks/useSensorData";
import { analyze, displayStatus, STATUS_LABEL } from "@/lib/sensorLogic";
import { config } from "@/config/environment";
import { sendTargetDistance, supportsDistanceCommand } from "@/services/sensorApi";
import type { DemoScenario } from "@/services/demoData";
import { SENSOR_IDS, type ConnectionState, type SensorId, type SensorStatus } from "@/types/sensor";

const CONN: Record<ConnectionState, { label: string; tone: string }> = {
  connecting: { label: "Connecting", tone: "tone-unknown" },
  live: { label: "Live", tone: "tone-healthy" },
  stale: { label: "Stale data", tone: "tone-warning" },
  error: { label: "Backend unavailable", tone: "tone-critical" },
  demo: { label: "Demo mode · simulated", tone: "tone-warning" },
};

export function Dashboard() {
  const car = useCarMovement();
  const [scenario, setScenario] = useState<DemoScenario>("residual");
  const [forceDemo, setForceDemo] = useState(false);
  const data = useSensorData(car.distance, scenario, forceDemo);
  const scene = useRef<SceneHandle>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout>>();

  const intel = useMemo(() => analyze(data.snapshot, data.stale), [data.snapshot, data.stale]);
  const statuses = useMemo(
    () => Object.fromEntries(SENSOR_IDS.map((id) => [id, displayStatus(data.snapshot?.sensors[id], data.stale)])) as Record<SensorId, SensorStatus>,
    [data.snapshot, data.stale],
  );
  const commit = (d: number) => {
    if (!supportsDistanceCommand() || data.demo) return;
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => sendTargetDistance(d).catch(() => {}), 400);
  };
  const conn = CONN[data.state];
  const view = (v: CameraView) => scene.current?.setView(v);
  const backendD = data.demo ? null : data.snapshot?.distanceToWall ?? null;

  return (
    <div className="min-h-screen text-foreground">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-base font-semibold tracking-tight">Self-Calibrating Virtual Sensor System</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-4 text-xs">
          <span className={`inline-flex items-center gap-1.5 ${conn.tone}`} role="status"><span className="dot" />{conn.label}</span>
          <span className="num text-muted-foreground">Last update: {data.lastSuccess ? data.lastSuccess.toLocaleTimeString() : "—"}</span>
          {data.backend && (
            <Button size="sm" variant="outline" onClick={() => setForceDemo((v) => !v)}>
              <FlaskConical className="h-3.5 w-3.5" /> {forceDemo ? "Use live data" : "Demo mode"}
            </Button>
          )}
        </div>
      </header>

      {data.demo && (
        <div className="border-b border-border bg-warning/10 px-4 py-2 text-xs md:px-6">
          <span className="tone-warning font-semibold">DEMO MODE — all sensor values are simulated.</span>{" "}
          <span className="text-muted-foreground">{data.backend ? "Live backend paused." : "Set VITE_API_BASE_URL to connect a real backend."}</span>
          <span className="ml-3 inline-flex gap-1">
            {(["residual", "corrected", "noerror"] as const).map((s, i) => (
              <Button key={s} size="sm" variant={scenario === s ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setScenario(s)}>
                {i + 1}. {s === "residual" ? "Residual detected" : s === "corrected" ? "Sensor corrected" : "No error"}
              </Button>
            ))}
          </span>
        </div>
      )}
      {data.error && !data.demo && <div className="border-b border-border px-4 py-2 text-xs tone-critical md:px-6">{data.error}</div>}

      <main className="grid gap-4 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4 min-w-0">
          <section className="panel relative overflow-hidden">
            <div className="h-[52vh] min-h-[340px] xl:h-[62vh]">
              <ThreeDScene ref={scene} distance={car.distance} backendDistance={backendD} statuses={statuses} />
            </div>
            <div className="pointer-events-none absolute left-4 top-4">
              <div className="panel-title">Distance to wall</div>
              <div className="num text-3xl font-semibold">{car.distance.toFixed(2)} m</div>
              <div className="text-xs text-muted-foreground">{supportsDistanceCommand() && !data.demo ? "Visual position · sent to backend" : "Local visual simulation"}</div>
              {backendD !== null && <div className="num text-xs tone-warning">Backend reported: {backendD.toFixed(3)} m</div>}
            </div>
            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1">
              {([["front", "Front"], ["side", "Side"], ["top", "Top"]] as const).map(([v, l]) => (
                <Button key={v} size="sm" variant="secondary" className="h-8" onClick={() => view(v)}><Eye className="h-3.5 w-3.5" />{l} View</Button>
              ))}
              <Button size="sm" variant="secondary" className="h-8" onClick={() => view("reset")}><Camera className="h-3.5 w-3.5" />Reset Camera</Button>
            </div>
          </section>

          <section className="panel grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label htmlFor="dist" className="flex justify-between text-sm">
                <span>Distance to Wall</span><span className="num">{car.distance.toFixed(2)} m</span>
              </label>
              <input id="dist" type="range" className="range mt-2" min={config.minDistance} max={config.maxDistance} step={0.01}
                value={car.distance} onChange={(e) => { car.stop(); car.setDistance(Number(e.target.value)); }}
                onPointerUp={(e) => commit(Number((e.target as HTMLInputElement).value))} onKeyUp={(e) => commit(Number((e.target as HTMLInputElement).value))} />
              <div className="mt-1 flex justify-between num text-xs text-muted-foreground"><span>{config.minDistance.toFixed(1)} m (safety min)</span><span>{config.maxDistance.toFixed(1)} m</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={car.direction === -1 ? "default" : "outline"} onClick={car.toward}><ArrowUp className="h-4 w-4" />Move Toward Wall</Button>
              <Button variant={car.direction === 1 ? "default" : "outline"} onClick={car.away}><ArrowDown className="h-4 w-4" />Move Away from Wall</Button>
              <Button variant="outline" onClick={() => { car.stop(); commit(car.distance); }}><Pause className="h-4 w-4" />Stop</Button>
              <Button variant="ghost" onClick={() => { car.reset(); commit(config.defaultDistance); }}><RotateCcw className="h-4 w-4" />Reset Position</Button>
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2">Keyboard: ↑ toward wall · ↓ away · Space stop</p>
          </section>

          <SensorTable snapshot={data.snapshot} stale={data.stale} />
        </div>

        <aside className="space-y-4">
          <SensorIntelligence intel={intel} snapshot={data.snapshot} stale={data.stale} />
          <section className="panel p-4">
            <h2 className="panel-title mb-3">Live Monitor</h2>
            <ul className="grid grid-cols-3 gap-2 text-sm">
              {SENSOR_IDS.map((id) => (
                <li key={id} className="rounded-md border border-border p-2">
                  <div className="text-xs text-muted-foreground">Sensor {id}</div>
                  <div className={`mt-1 inline-flex items-center gap-1.5 tone-${statuses[id]}`}><span className="dot" />{STATUS_LABEL[statuses[id]]}</div>
                </li>
              ))}
            </ul>
          </section>
          <ResidualChart snapshot={data.snapshot} />
        </aside>
      </main>
    </div>
  );
}
