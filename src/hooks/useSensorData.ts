import { useEffect, useRef, useState } from "react";
import { config } from "@/config/environment";
import { fetchSensorSnapshot, isBackendConfigured } from "@/services/sensorApi";
import { demoSnapshot, type DemoScenario } from "@/services/demoData";
import type { ConnectionState, SensorSnapshot } from "@/types/sensor";

export function useSensorData(visualDistance: number, scenario: DemoScenario, forceDemo: boolean) {
  const backend = isBackendConfigured();
  const demo = !backend || forceDemo;
  const [snapshot, setSnapshot] = useState<SensorSnapshot | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [state, setState] = useState<ConnectionState>(demo ? "demo" : "connecting");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Live polling
  useEffect(() => {
    if (demo) return;
    let alive = true;
    setState("connecting");
    setSnapshot(null);
    const tick = async () => {
      try {
        const s = await fetchSensorSnapshot();
        if (!alive) return;
        setSnapshot(s);
        setLastSuccess(new Date());
        setError(null);
        setState("live");
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? (e.name === "AbortError" ? "Request timed out" : e.message) : "Unknown error");
        setState((p) => (p === "live" || p === "stale" ? "stale" : "error"));
      }
    };
    tick();
    const id = setInterval(tick, config.pollIntervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [demo]);

  // Demo: regenerate when scenario/distance change (throttled by rounding)
  const rounded = Math.round(visualDistance * 100) / 100;
  useEffect(() => {
    if (!demo) return;
    setSnapshot(demoSnapshot(scenario, rounded));
    setLastSuccess(new Date());
    setState("demo");
    setError(null);
  }, [demo, scenario, rounded]);

  // Staleness clock
  const nowRef = useRef(now);
  useEffect(() => {
    const id = setInterval(() => { nowRef.current = Date.now(); setNow(nowRef.current); }, 1000);
    return () => clearInterval(id);
  }, []);

  const stale = !demo && !!lastSuccess && now - lastSuccess.getTime() > config.staleAfterMs;
  return { snapshot, lastSuccess, state: stale && state === "live" ? "stale" : state, error, stale, demo, backend } as const;
}
