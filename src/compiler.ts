import path from "node:path";
import { compile, packModule } from "typeshade";
import { plotSource, type CompilePlotOptions } from "./plot-source.js";
import type { PlotProgram } from "./types.js";

export type { CompilePlotOptions } from "./plot-source.js";
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
/** Compile a named TypeShade callback once, on the build machine. */
export function compilePlot(
  source: string,
  options: CompilePlotOptions = {},
): PlotProgram {
  const {
    kind,
    parameters,
    parameterOrigin: origin,
    userFile,
    wrapperFile,
    wrapper,
    readDocument,
  } = plotSource(source, options);
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
    cacheFormat: "uint-v1",
    ...(kind !== "surface" ? { curveSearch: "adaptive-v1" as const } : {}),
    ...(origin
      ? { parameterOrigin: { axis: origin.axis, scale: origin.scale } }
      : {}),
    ...(kind === "parametric"
      ? { acceleration: "tiles-v1" as const }
      : kind === "surface"
        ? { acceleration: "surface-v1" as const }
        : {}),
    picking: "point-v1",
  };
}
export type { PlotProgram, PlotKind } from "./types.js";
