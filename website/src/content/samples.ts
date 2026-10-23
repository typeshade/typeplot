export type Preset =
  "signals" | "scatter" | "bars" | "histogram" | "power" | "helix";
export const signalCode = `import { subplots, linspace } from "typeplot";

const { fig, axes: [ax] } = subplots();
const x = linspace(0, 2 * Math.PI, 200);
ax.plot(x, Math.sin, { label: "Sine" });
ax.plot(x, Math.cos, { label: "Cosine", lineStyle: "--" });
ax.set({ xLabel: "Angle (radians)", yLabel: "Amplitude" });
ax.grid();
ax.legend();

// Call fig.destroy() when the view unmounts.`;
export const gpuCode = `// curve.shade.ts — compiled by the TypePlot Vite plugin
"use typeshade";
export function sample(x: f32, exponent: f32): f32 {
  if (x < 0) return 1e20;
  return pow(x, exponent);
}

// main.ts — browser runtime
import { createPlot } from "typeplot";
import curve from "./curve.shade.ts?plot";
const plot = await createPlot(canvas, curve, {
  bounds: { x: [0, 1], y: [0, 1] },
  parameters: { exponent: 2 },
});
// Call plot.destroy() when the view unmounts.`;
export const helixCode = `// helix.shade.ts
"use typeshade";
export function sample(t: f32): vec3 {
  return vec3(cos(t) * 2, sin(t), t * 0.4);
}

// main.ts
import { createPlot } from "typeplot";
import helix from "./helix.shade.ts?plot=3d";
const plot = await createPlot(canvas, helix, {
  bounds: { x: [-6.28, 6.28], y: [-1.25, 1.25] },
});`;
export function exampleCode(
  preset: Preset,
  frequency = 1,
  exponent = 2,
  backend = "auto",
  threeD = false,
): string {
  if (preset === "signals")
    return signalCode
      .replace(
        "ax.plot(x, Math.sin,",
        `ax.plot(x, x => Math.sin(x * ${frequency}),`,
      )
      .replace(
        "ax.plot(x, Math.cos,",
        `ax.plot(x, x => Math.cos(x * ${frequency}),`,
      );
  if (preset === "power")
    return gpuCode
      .replace("exponent: 2", `exponent: ${exponent}`)
      .replace(
        "parameters: {",
        `backend: "${backend}",\n  mode: "${threeD ? "3d" : "2d"}",\n  parameters: {`,
      );
  if (preset === "helix")
    return helixCode.replace(
      "bounds: {",
      `backend: "${backend}",\n  bounds: {`,
    );
  const head = `import { subplots${preset === "scatter" ? ", linspace" : ""} } from "typeplot";\n\nconst { fig, axes: [ax] } = subplots();\n`;
  if (preset === "scatter")
    return (
      head +
      `const x = linspace(0, 4, 35);\nconst y = x.map((v, i) => Math.exp(v) * (1 + 0.15 * Math.sin(i * 13)));\nax.scatter(x, y, { color: "#9467bd" });\nax.set({ xLabel: "Time", yLabel: "Value", yScale: "log" });\nax.grid();`
    );
  if (preset === "bars")
    return (
      head +
      `ax.bar([1, 2, 3, 4], [12, 19, 8, 15], {\n  width: 0.6, color: "#2ca02c", label: "Observations",\n});\nax.set({ xLabel: "Group", yLabel: "Count" });\nax.legend();`
    );
  return (
    head +
    `const values = Array.from({ length: 600 }, (_, i) =>\n  Math.sin(i * 2.399) + Math.sin(i * 1.731) + Math.cos(i * 0.357));\nax.histogram(values, { bins: 20, density: true, color: "#ff7f0e" });\nax.set({ xLabel: "Value", yLabel: "Density" });`
  );
}
