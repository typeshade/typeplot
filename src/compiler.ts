import { readFileSync } from "node:fs";
import path from "node:path";
import { compile, packModule } from "typeshade";
import shaderSource from "../shaders/plot.shade.ts?source";
import fontSource from "../shaders/font.shade.ts?source";
import paletteSource from "../shaders/palette.shade.ts?source";
import type { PlotKind, PlotProgram } from "./types.js";

export interface CompilePlotOptions {
  readonly entry?: string;
  readonly kind?: PlotKind;
  readonly fileName?: string;
  /** Additional imported shader files, relative to fileName. */
  readonly files?: Readonly<Record<string, string>>;
  readonly readDocument?: (fileName: string) => string | undefined;
  /** Extra f32 arguments to the callback, in declaration order. */
  readonly parameters?: Readonly<Record<string, number>>;
  readonly discontinuous?: boolean;
}
export interface PlotDiagnostic {
  readonly fileName?: string;
  readonly line: number;
  readonly character: number;
  readonly message: string;
  readonly code?: string;
}
export class PlotCompileError extends Error {
  constructor(readonly diagnostics: readonly PlotDiagnostic[]) {
    super(
      diagnostics
        .map(
          (d) =>
            `${d.fileName ?? "shader"}:${d.line}:${d.character}: ${d.message}`,
        )
        .join("\n"),
    );
    this.name = "PlotCompileError";
  }
}
const identifier = /^[A-Za-z_$][\w$]*$/;
const reserved = new Set([
  "resolution",
  "plotCenter",
  "plotSpan",
  "plotRotation",
  "rotationBasis",
  "plotPan",
  "plotBlend",
  "probe",
  "view3d",
  "appearance",
  "decorations",
  "labelStyle",
  "decorationOpacity",
  "parameterBounds",
  "parameterMode",
  "curveQuality",
  "curvePattern",
  "curveTiles",
  "model",
  "inverseModel",
  "axesModel",
  "inverseAxesModel",
  "sceneOpacity",
  "cameraLens",
  "plotCenterZ",
  "surfaceBounds",
  "surfaceDomainMode",
  "surfaceRange",
  "surfaceDepth",
  "surfaceRender",
  "surfaceFlags",
]);

/** Compile a named TypeShade callback once, on the build machine. */
export function compilePlot(
  source: string,
  options: CompilePlotOptions = {},
): PlotProgram {
  const entry = options.entry ?? "sample";
  const kind = options.kind ?? "scalar";
  if (!identifier.test(entry))
    throw new TypeError("entry must be a TypeScript identifier.");
  if (!["scalar", "parametric", "surface"].includes(kind))
    throw new TypeError("kind must be scalar, parametric or surface.");
  const parameters = Object.fromEntries(
    Object.entries(options.parameters ?? {}),
  );
  for (const [name, value] of Object.entries(parameters)) {
    if (!/^[A-Za-z_]\w*$/.test(name) || reserved.has(name))
      throw new TypeError(`Invalid plot parameter: ${name}`);
    if (!Number.isFinite(value) || Math.abs(value) > 3.402823466e38)
      throw new RangeError(`${name} must be a finite f32 value.`);
  }
  const userFile = path.resolve(options.fileName ?? "curve.shade.ts");
  const sharedFile = path.join(
    path.dirname(userFile),
    "__typeplot-shared.shade.ts",
  );
  const wrapperFile = path.join(
    path.dirname(userFile),
    "__typeplot-entry.shade.ts",
  );
  if ([sharedFile, wrapperFile].includes(userFile))
    throw new TypeError("fileName uses a reserved TypePlot file name.");
  const names = Object.keys(parameters);
  const args = ["t", ...names.map((n) => `u.${n}`)].join(", ");
  const callback =
    kind === "scalar"
      ? `function sample(t: f32): f32 { return callback(${args}); }\nfunction trajectory(t: f32): vec3 { return vec3(t, sample(t), 0.); }`
      : kind === "surface"
        ? `function heightField(x: f32, z: f32): f32 { return callback(${["x", "z", ...names.map((n) => `u.${n}`)].join(", ")}); }`
        : `function trajectory(t: f32): vec3 { return callback(${args}); }`;
  const jumps = options.discontinuous === true;
  const fragment =
    kind === "scalar"
      ? `if (u.plotBlend >= 1.) { return plotScalar3D(sample, trajectory, uv, u, ${jumps}); }\n  const flat = plot2D(sample, uv, u, ${jumps});\n  if (u.plotBlend <= 0.) { return flat; }\n  return mix(flat, plotScalar3D(sample, trajectory, uv, u, ${jumps}), clamp(u.plotBlend, 0., 1.));`
      : kind === "surface"
        ? `return plotSurface(heightField, uv, u, true);`
        : `return plot3DAccelerated(trajectory, uv, u);`;
  const cacheEntries =
    kind === "parametric"
      ? `
@fragment export function drawReference(@location(0) uv: vec2): vec4 {
  return plot3D(trajectory, uv, u, ${jumps});
}
@fragment export function buildCurveIntervals(@builtin("position") position: vec4): vec4 {
  return prepareCurveIntervals(trajectory, position, u, ${jumps});
}
@fragment export function buildSpatialLabels(@builtin("position") position: vec4): vec4 {
  return prepareSpatialLabels(position, axesUniforms(u));
}
@fragment export function buildCurveCandidates(@builtin("position") position: vec4): vec4u {
  return prepareCurveCandidates(position, u);
}
`
      : kind === "surface"
        ? `
@fragment export function drawReference(@location(0) uv: vec2): vec4 {
  return plotSurface(heightField, uv, u, false);
}
@fragment export function buildSpatialLabels(@builtin("position") position: vec4): vec4 {
  return prepareSpatialLabels(position, axesUniforms(u));
}
`
        : "";
  const sceneEntries = `
@fragment export function drawLayer(@location(0) uv: vec2): SceneLayer {
  ${kind === "surface" ? "return sceneSurface(heightField, uv, u);" : "return sceneCurve(trajectory, uv, u);"}
}
@fragment export function drawLayerReference(@location(0) uv: vec2): SceneLayer {
  ${kind === "surface" ? "return sceneSurface(heightField, uv, u);" : `return sceneCurveReference(trajectory, uv, u, ${jumps});`}
}
@fragment export function drawBackdrop(@location(0) uv: vec2): vec4 { return ${kind === "scalar" ? "sceneBackdropReference" : "sceneBackdrop"}(uv, u); }
@fragment export function drawBackdropReference(@location(0) uv: vec2): vec4 { return sceneBackdropReference(uv, u); }
@fragment export function drawLabels(@location(0) uv: vec2): vec4 { return ${kind === "scalar" ? "sceneLabelsReference" : "sceneLabels"}(uv, u, ${kind === "surface"}); }
@fragment export function drawLabelsReference(@location(0) uv: vec2): vec4 { return sceneLabelsReference(uv, u, ${kind === "surface"}); }
@fragment export function queryLayer(@builtin("position") position: vec4): vec4u {
  ${kind === "surface" ? "return pickSurface(heightField, position, u);" : "return querySceneCurve(trajectory, position, u);"}
}
@fragment export function queryLayerReference(@builtin("position") position: vec4): vec4u {
  ${kind === "surface" ? "return pickSurface(heightField, position, u);" : `return querySceneCurveReference(trajectory, position, u, ${jumps});`}
}
${
  kind === "scalar"
    ? `
@fragment export function buildCurveIntervals(@builtin("position") position: vec4): vec4 { return prepareCurveIntervals(trajectory, position, u, ${jumps}); }
@fragment export function buildCurveCandidates(@builtin("position") position: vec4): vec4u { return prepareCurveCandidates(position, u); }
`
    : ""
}
`;
  const wrapper = `"use typeshade";
import { ${entry} as callback } from ${JSON.stringify("./" + path.basename(userFile))};
import { PlotUniforms, SceneLayer, sceneCurve, sceneCurveReference, sceneSurface, sceneBackdrop, sceneBackdropReference, sceneLabels, sceneLabelsReference, querySceneCurve, querySceneCurveReference, axesUniforms, plot2D, plot3D, plotScalar3D, plot3DAccelerated, prepareCurveIntervals, prepareCurveCandidates, prepareSpatialLabels, plotSurface, pickSurface, pickTrajectory } from "./__typeplot-shared.shade.ts";
class Uniforms extends PlotUniforms { ${names.map((n) => `${n}: f32;`).join(" ")} }
declare const u: uniform<Uniforms>;
${callback}
class VertexOutput { @builtin("position") position: vec4; @location(0) uv: vec2; }
@vertex export function fullscreen(@builtin("vertex_index") i: u32): VertexOutput {
  const x = i == 1 ? 3. : -1.; const y = i == 2 ? 3. : -1.;
  return { position: vec4(x, y, 0., 1.), uv: vec2(x * 0.5 + 0.5, y * 0.5 + 0.5) };
}
@fragment export function draw(@location(0) uv: vec2): vec4 {
  ${fragment}
}
${cacheEntries}
${sceneEntries}
@fragment export function pick(@builtin("position") position: vec4): vec4u {
  ${kind === "surface" ? "return pickSurface(heightField, position, u);" : `return pickTrajectory(trajectory, position, u, ${kind === "scalar"}, ${jumps});`}
}
`;
  const documents = new Map(
    Object.entries(options.files ?? {}).map(([name, text]) => [
      path.resolve(path.dirname(userFile), name),
      text,
    ]),
  );
  documents.set(userFile, source);
  documents.set(
    sharedFile,
    shaderSource
      .replace('"./font.shade.ts"', '"./__typeplot-font.shade.ts"')
      .replace('"./palette.shade.ts"', '"./__typeplot-palette.shade.ts"'),
  );
  documents.set(
    path.join(path.dirname(userFile), "__typeplot-font.shade.ts"),
    fontSource,
  );
  documents.set(
    path.join(path.dirname(userFile), "__typeplot-palette.shade.ts"),
    paletteSource,
  );
  const readDocument = (name: string): string | undefined => {
    const known = documents.get(name) ?? options.readDocument?.(name);
    if (known !== undefined) return known;
    try {
      return readFileSync(name, "utf8");
    } catch {
      return undefined;
    }
  };
  const result = compile(wrapper, { fileName: wrapperFile, readDocument });
  const errors = result.diagnostics.filter((d) => d.category === "error");
  if (errors.length) throw new PlotCompileError(errors);
  if (!result.wgsl) throw new Error("The plot must emit WGSL.");
  const packed = packModule(result.module);
  // Multiple named fragment passes have per-entry GLSL packs, not one result.glsl.
  if (!packed.gl) throw new Error("The plot must emit GLSL render entries.");
  for (const entry of [
    ...Object.values(packed.gl.draws ?? {}),
    ...Object.values(packed.gl.vertices ?? {}),
  ])
    if ("none" in entry) throw new Error(entry.none);
  const manifest = {
    ...packed,
    entries: packed.entries.map((entry) => ({
      ...entry,
      ...(entry.line
        ? {
            line: {
              ...entry.line,
              file: path
                .relative(path.dirname(userFile), entry.line.file)
                .split(path.sep)
                .join("/"),
            },
          }
        : {}),
    })),
  };
  return {
    version: 1,
    kind,
    manifest,
    parameters,
    camera: "projective",
    scene: "transform-v1",
    composition: "layers-v1",
    ...(kind === "parametric"
      ? { acceleration: "tiles-v1" as const }
      : kind === "surface"
        ? { acceleration: "surface-v1" as const }
        : {}),
    picking: "point-v1",
  };
}
export type { PlotProgram, PlotKind } from "./types.js";
