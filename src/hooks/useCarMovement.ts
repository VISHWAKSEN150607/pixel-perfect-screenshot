import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/config/environment";

const SPEED = 1.2; // m/s
const clamp = (v: number) => Math.min(config.maxDistance, Math.max(config.minDistance, v));

/** Single source of truth for the visual car distance (front bumper → wall). */
export function useCarMovement() {
  const [distance, setDistanceState] = useState(config.defaultDistance);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const distRef = useRef(distance);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const setDistance = useCallback((d: number) => {
    distRef.current = clamp(d);
    setDistanceState(distRef.current);
  }, []);

  useEffect(() => {
    if (direction === 0) return;
    if (reduced.current) {
      // step instead of animate
      setDistance(distRef.current + direction * 0.25);
      setDirection(0);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const next = clamp(distRef.current + direction * SPEED * dt);
      setDistance(next);
      if (next <= config.minDistance || next >= config.maxDistance) { setDirection(0); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [direction, setDistance]);

  const toward = useCallback(() => setDirection(-1), []);
  const away = useCallback(() => setDirection(1), []);
  const stop = useCallback(() => setDirection(0), []);
  const reset = useCallback(() => { setDirection(0); setDistance(config.defaultDistance); }, [setDistance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable || el.getAttribute("role") === "slider")) return;
      if (e.key === "ArrowUp") { e.preventDefault(); toward(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); away(); }
      else if (e.key === " ") { e.preventDefault(); stop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toward, away, stop]);

  return { distance, direction, setDistance, toward, away, stop, reset };
}
