import { useEffect, useRef, useState } from "react";
import { subplots, linspace } from "../vendor/typeplot/data.js";
export default function DataPreview({
  kind = "signals",
  locale = "en",
}: {
  kind?: "signals" | "scatter" | "bars" | "histogram";
  locale?: "en" | "ko";
}) {
  const mount = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!mount.current) return;
    const {
      fig,
      axes: [ax],
    } = subplots(1, 1, {
      target: mount.current,
      width: 640,
      height: 310,
      toolbar: false,
      interactive: false,
    });
    try {
      if (kind === "signals") {
        const x = linspace(0, Math.PI * 2, 200);
        ax.plot(x, Math.sin, { label: "Sine", color: "#1677ff", lineWidth: 2 });
        ax.plot(x, Math.cos, {
          label: "Cosine",
          color: "#d46b08",
          lineStyle: "--",
        });
        ax.set({
          xLabel: "Angle (radians)",
          yLabel: "Amplitude",
          grid: true,
          legend: true,
        });
      } else if (kind === "bars") {
        ax.bar([1, 2, 3, 4], [12, 19, 8, 15], { color: "#389e0d", width: 0.6 });
        ax.set({ xLabel: "Group", yLabel: "Count" });
      } else if (kind === "scatter") {
        const x = linspace(0, 4, 35);
        ax.scatter(
          x,
          x.map((v, i) => Math.exp(v) * (1 + 0.15 * Math.sin(i * 13))),
          { color: "#722ed1" },
        );
        ax.set({ xLabel: "Time", yLabel: "Value", yScale: "log", grid: true });
      } else {
        const values = Array.from(
          { length: 600 },
          (_, i) =>
            Math.sin(i * 2.399) + Math.sin(i * 1.731) + Math.cos(i * 0.357),
        );
        ax.histogram(values, { bins: 20, density: true, color: "#d46b08" });
        ax.set({ xLabel: "Value", yLabel: "Density" });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
    return () => fig.destroy();
  }, [kind]);
  return (
    <div>
      <div ref={mount} className="plot-mount" />
      {error && (
        <p role="alert" className="plot-error">
          {error}
        </p>
      )}
      <noscript>
        {locale === "ko"
          ? "그래프를 표시하려면 JavaScript가 필요합니다. 코드와 설명은 계속 읽을 수 있습니다."
          : "JavaScript is required to draw the chart. The code and descriptions remain available."}
      </noscript>
    </div>
  );
}
