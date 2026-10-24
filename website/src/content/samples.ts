export type Preset =
  | "signals"
  | "scatter"
  | "bars"
  | "histogram"
  | "power"
  | "sine"
  | "helix"
  | "surface"
  | "multiScene"
  | "sampledSurface"
  | "uncertainty"
  | "field";
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
export const helixCode = `// helix.shade.ts — local SDF coordinates, GPU-prepared global phase.
"use typeshade";
export function prepare(origin: f64): vec4 {
  return vec4(f32(cos(origin)), f32(sin(origin)), 0, 0);
}
export function sample(t: f32, origin: vec4): vec3 {
  const c = cos(t), s = sin(t);
  return vec3((c * origin.x - s * origin.y) * 2,
    s * origin.x + c * origin.y, t * 0.4);
}

// vite.config.ts — configure only this callback.
// typeplot({ configure: file => file.endsWith("helix.shade.ts")
//   ? { parameterOrigin: { axis: "z", scale: 0.4, prepare: "prepare" } } : {} })

// main.ts
import { createPlot } from "typeplot";
import helix from "./helix.shade.ts?plot=3d";
const plot = await createPlot(canvas, helix, {
  bounds: { x: [-6.28, 6.28], y: [-1.25, 1.25] },
  domain: [-Infinity, Infinity],
  quality: { samples: 128, refinements: 5 },
});`;
export const surfaceCode = `// surface.shade.ts — y-up: y = f(x, z)
"use typeshade";
export function sample(x: f32, z: f32, phase: f32, amplitude: f32): f32 {
  return amplitude * sin(x + phase) * cos(z - phase * 0.35);
}

// Configure Vite defaults: { phase: 0, amplitude: 1 }.
import { createPlot } from "typeplot";
import surface from "./surface.shade.ts?plot=surface";
const plot = await createPlot(canvas, surface, {
  bounds: { x: [-3, 3], y: [-2, 2] },
  surfaceDomain: { x: [-4, 4], z: [-4, 4] },
  surface: { colorMap: "viridis", valueRange: [-1.25, 1.25], heightRange: [-1, 1], colorBar: true },
});
const motion = plot.animate({
  parameters: { phase: 2 * Math.PI },
  camera: { rotation: [1.8, 0.6], distance: 3.6, fov: Math.PI / 3 },
}, { duration: 6 });
// motion.pause(); await motion.seek(2); motion.play();
plot.on("click", event => console.log(event.result?.point));
// Call plot.destroy() when the view unmounts.`;
export const multiSceneCode = `import { createPlot, parallel, rotationMatrix } from "typeplot";
import surface from "./surface.shade.ts?plot=surface";
import trajectory from "./surface-curve.shade.ts?plot=3d";

const plot = await createPlot(canvas, surface, {
  bounds: { x: [-3, 3], y: [-2, 2] },
  surfaceDomain: { x: [-4, 4], z: [-4, 4] },
  surface: { colorMap: "viridis", valueRange: [-1.25, 1.25], heightRange: [-1, 1] },
  objects: [{program: trajectory, id: "trajectory", domain: [-3, 3],
    parameters: { phase: 0, lift: 0.04 },
    style: { color: "#ff7f0e", curveWidth: 3 }}],
});
const curve = plot.scene.objects.find(object => object.id === "trajectory")!;
const group = plot.scene.group(plot.scene.content, curve);
const motion = plot.timeline();
motion.add(parallel(
  plot.transition({ parameters: { phase: 2 * Math.PI }, camera: { rotation: [1.6, 0.6] } }, { duration: 6 }),
  curve.transition({ parameters: { phase: 2 * Math.PI, lift: 0.25 } }, { duration: 6 }),
  group.transition({ transform: rotationMatrix(0.35, [0, 0, 1]) }, { duration: 6 }),
));
motion.play();
plot.on("click", event => console.log(event.result?.objectId, event.result?.point));
// await curve.remove(); plot.destroy();`;
export const sampledSurfaceCode = `import { createSurface } from "typeplot";
const rows = 32, columns = 40;
const values = Float32Array.from({ length: rows * columns }, (_, i) => {
  const x = -3 + 6 * (i % columns) / (columns - 1);
  const z = -3 + 6 * Math.floor(i / columns) / (rows - 1);
  return Math.sin(x) * Math.cos(z);
});
const plot = await createSurface(canvas, values, {
  shape: [rows, columns], extent: [-3, 3, -3, 3],
  bounds: { x: [-3, 3], y: [-2, 2] },
});
plot.animate({ parameters: { heightScale: 1.5 }, camera: { rotation: [1.8, 0.6] } }, { duration: 6 });
// plot.setValues(nextValues); await plot.saveImage("surface.png");
// Call plot.destroy() when the view unmounts.`;
export const uncertaintyCode = `import { subplots, linspace } from "typeplot";
const { fig, axes: [ax] } = subplots();
const x = linspace(0, 6, 25), y = x.map(Math.sin);
ax.fillBetween(x, y.map(v => v + 0.2), y.map(v => v - 0.2), { label: "Band" });
ax.errorbar(x, y, { yError: 0.2, capSize: 3, label: "Measurements" });
ax.annotate("Peak", [Math.PI / 2, 1], { xyText: [2.5, 1.3], arrow: true });
ax.set({ xLabel: "x", yLabel: "Value", grid: true, legend: true });
ax.on("hover", event => console.log(event.result?.index));
// Call fig.destroy() when the view unmounts.`;
export const fieldCode = `import { subplots } from "typeplot";
const { fig, axes: [ax] } = subplots();
const rows = 48, columns = 64;
const values = Float32Array.from({ length: rows * columns }, (_, i) =>
  Math.sin(-3 + 6 * (i % columns) / (columns - 1)) *
  Math.cos(-2 + 4 * Math.floor(i / columns) / (rows - 1)));
const field = ax.contourf(values, {
  shape: [rows, columns], extent: [-3, 3, -2, 2],
  origin: "lower", levels: 14, colorMap: "viridis",
});
ax.colorbar(field);
// ax.imshow(values, { shape: [rows, columns] });
// ax.contour(values, { shape: [rows, columns], levels: 12 });
// Call fig.destroy() when the view unmounts.`;
export function exampleCode(
  preset: Preset,
  frequency = 1,
  exponent = 2,
  backend = "auto",
  threeD = false,
  projection: "perspective" | "orthographic" = "perspective",
): string {
  if (preset === "multiScene") return multiSceneCode;
  if (preset === "surface") return surfaceCode;
  if (preset === "sampledSurface") return sampledSurfaceCode;
  if (preset === "uncertainty") return uncertaintyCode;
  if (preset === "field") return fieldCode;
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
  if (preset === "sine")
    return `// sine.shade.ts — evaluated as a field across the visible plane
"use typeshade";
export function sample(x: f32, frequency: f32): f32 {
  return sin(x * frequency);
}

// main.ts
import { createPlot } from "typeplot";
import sine from "./sine.shade.ts?plot";
const plot = await createPlot(canvas, sine, {
  bounds: { x: [-6.28, 6.28], y: [-1.5, 1.5] },
  backend: "${backend}",
  mode: "${threeD ? "3d" : "2d"}",
  projection: "${threeD ? projection : "orthographic"}",
  parameters: { frequency: ${frequency} },
});`;
  if (preset === "power")
    return gpuCode
      .replace("exponent: 2", `exponent: ${exponent}`)
      .replace(
        "parameters: {",
        `backend: "${backend}",\n  mode: "${threeD ? "3d" : "2d"}",\n  projection: "${threeD ? projection : "orthographic"}",\n  parameters: {`,
      );
  if (preset === "helix")
    return helixCode.replace(
      "bounds: {",
      `backend: "${backend}",\n  projection: "${projection}",\n  bounds: {`,
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
