import { readFileSync } from "node:fs";
import path from "node:path";
import { compile, packModule } from "typeshade";
import shaderSource from "../shaders/plot.shade.ts?source";
import fontSource from "../shaders/font.shade.ts?source";
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
  "plotPan",
  "plotBlend",
  "probe",
  "view3d",
  "appearance",
  "decorations",
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
  if (kind !== "scalar" && kind !== "parametric")
    throw new TypeError("kind must be scalar or parametric.");
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
      : `function trajectory(t: f32): vec3 { return callback(${args}); }`;
  const jumps = options.discontinuous === true;
  const fragment =
    kind === "scalar"
      ? `if (u.plotBlend >= 1.) { return plot3D(trajectory, uv, u, bounds, ${jumps}); }\n  const flat = plot2D(sample, uv, u, ${jumps});\n  if (u.plotBlend <= 0.) { return flat; }\n  return mix(flat, plot3D(trajectory, uv, u, bounds, ${jumps}), clamp(u.plotBlend, 0., 1.));`
      : `return plot3D(trajectory, uv, u, bounds, ${jumps});`;
  const wrapper = `"use typeshade";
import { ${entry} as callback } from ${JSON.stringify("./" + path.basename(userFile))};
import { PlotUniforms, plot2D, plot3D } from "./__typeplot-shared.shade.ts";
class Uniforms extends PlotUniforms { ${names.map((n) => `${n}: f32;`).join(" ")} }
declare const u: uniform<Uniforms>;
${callback}
class VertexOutput { @builtin("position") position: vec4; @location(0) uv: vec2; }
@vertex export function fullscreen(@builtin("vertex_index") i: u32): VertexOutput {
  const x = i == 1 ? 3. : -1.; const y = i == 2 ? 3. : -1.;
  return { position: vec4(x, y, 0., 1.), uv: vec2(x * 0.5 + 0.5, y * 0.5 + 0.5) };
}
@fragment export function draw(@location(0) uv: vec2): vec4 {
  const bounds = vec2(u.plotCenter.x - u.plotSpan.x * 0.5, u.plotCenter.x + u.plotSpan.x * 0.5);
  ${fragment}
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
    shaderSource.replace('"./font.shade.ts"', '"./__typeplot-font.shade.ts"'),
  );
  documents.set(
    path.join(path.dirname(userFile), "__typeplot-font.shade.ts"),
    fontSource,
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
  if (!result.wgsl || !result.glsl)
    throw new Error("The plot must emit both WGSL and GLSL.");
  const packed = packModule(result.module);
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
  return { version: 1, kind, manifest, parameters, camera: "projective" };
}
export type { PlotProgram, PlotKind } from "./types.js";
