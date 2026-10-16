import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/layout/Dashboard";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Virtual Sensor System — 3D Calibration Twin" },
      { name: "description", content: "Interactive 3D digital twin of a self-calibrating distance sensor system: residuals, corrections and health in real time." },
      { property: "og:title", content: "Virtual Sensor System — 3D Calibration Twin" },
      { property: "og:description", content: "Interactive 3D digital twin of a self-calibrating distance sensor system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
