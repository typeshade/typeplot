import { subplots, linspace, type Figure } from "typeplot/data";

let fig: Figure | undefined;
const status = document.querySelector<HTMLParagraphElement>("#data-status")!;
const update = document.querySelector<HTMLButtonElement>("#update-data")!;
try {
  const result = subplots(2, 2, {
    target: "#data-plots",
    width: 1000,
    height: 720,
  });
  fig = result.fig;
  const [lines, points, bars, distribution] = result.axes;
  const x = linspace(0, Math.PI * 2, 160);
  const sine = lines.plot(x, Math.sin, { label: "sin(x)" });
  lines.plot(x, Math.cos, { label: "cos(x)", lineStyle: "--" });
  lines.set({
    title: "Multiple curves",
    xLabel: "Angle (radians)",
    yLabel: "Amplitude",
    grid: true,
    legend: true,
  });
  const samples = linspace(0, 4, 35);
  points.scatter(
    samples,
    samples.map((value, i) => Math.exp(value) * (1 + 0.15 * Math.sin(i * 13))),
    { color: "#9467bd", label: "Measurements" },
  );
  points.set({
    title: "Scatter with a log axis",
    xLabel: "Time",
    yLabel: "Value",
    yScale: "log",
    grid: true,
  });
  bars.bar([1, 2, 3, 4], [12, 19, 8, 15], {
    label: "Observations",
    color: "#2ca02c",
    width: 0.6,
  });
  bars.set({
    title: "Bar chart",
    xLabel: "Group",
    yLabel: "Count",
    legend: true,
  });
  const values = Array.from(
    { length: 600 },
    (_, i) => Math.sin(i * 2.399) + Math.sin(i * 1.731) + Math.cos(i * 0.357),
  );
  distribution.histogram(values, {
    bins: 20,
    density: true,
    color: "#ff7f0e",
    alpha: 0.8,
  });
  distribution.set({ title: "Histogram", xLabel: "Value", yLabel: "Density" });
  let phase = 0;
  update.disabled = false;
  update.onclick = () => {
    phase += Math.PI / 4;
    sine.setData(
      x,
      x.map((value) => Math.sin(value + phase)),
    );
  };
  status.textContent =
    "Canvas 2D · arrays and JavaScript callbacks · no shader compilation or GPU required";
} catch (error) {
  fig?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}
function cleanup() {
  fig?.destroy();
  update.onclick = null;
  update.disabled = true;
}
const pagehide = (event: PageTransitionEvent) => {
  if (!event.persisted) cleanup();
};
window.addEventListener("pagehide", pagehide);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", pagehide);
    cleanup();
  });
