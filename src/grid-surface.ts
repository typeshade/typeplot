import { createPlot } from "./index.js";
import type { NumericData } from "./data.js";
import type { Plot, PlotOptions, PlotProgram } from "./types.js";
export interface GridSurfaceOptions extends Omit<
  PlotOptions,
  "data" | "parameters"
> {
  readonly shape: readonly [number, number];
  /** Vertex-grid bounds [xMin,xMax,zMin,zMax]. Row zero starts at zMin. */
  readonly extent?: readonly [number, number, number, number];
  readonly heightScale?: number;
  readonly heightOffset?: number;
}
export interface GridSurface extends Plot {
  readonly shape: readonly [number, number];
  /** Replace observations without rebuilding camera or pipelines. */
  setValues(values: NumericData, autoscaleColor?: boolean): void;
}
function data(
  values: NumericData,
  count: number,
): { array: Float32Array; range: [number, number] } {
  if (!values || values.length !== count)
    throw new RangeError("Surface data length must equal rows times columns.");
  const array = new Float32Array(count);
  let lo = Infinity,
    hi = -Infinity;
  for (let i = 0; i < count; i++) {
    const value = values[i];
    if (
      typeof value !== "number" ||
      (Number.isFinite(value) && Math.abs(value) > 3.402823466e38)
    )
      throw new RangeError(
        "Surface observations must be f32 numbers; NaN/Infinity are missing values.",
      );
    array[i] = value;
    if (Number.isFinite(array[i])) {
      lo = Math.min(lo, array[i]);
      hi = Math.max(hi, array[i]);
    }
  }
  if (lo === Infinity) {
    lo = 0;
    hi = 1;
  }
  if (lo === hi) {
    const delta = Math.max(0.5, Math.abs(lo) * 0.05);
    lo = Math.max(-3.402823466e38, lo - delta);
    hi = Math.min(3.402823466e38, hi + delta);
  }
  return { array, range: [lo, hi] };
}
/** A sampled height field uses the same implicit ray query and camera as GPU functions. */
export async function createSurface(
  canvas: HTMLCanvasElement,
  values: NumericData,
  options: GridSurfaceOptions,
): Promise<GridSurface> {
  const shape = options?.shape;
  if (
    !Array.isArray(shape) ||
    shape.length !== 2 ||
    shape.some((v) => !Number.isSafeInteger(v) || v < 2) ||
    shape[0] * shape[1] > 4_194_304
  )
    throw new RangeError(
      "Grid surfaces need at least two rows/columns and at most 4194304 values.",
    );
  const [rows, columns] = shape,
    extent = options.extent ?? [0, columns - 1, 0, rows - 1];
  if (
    !Array.isArray(extent) ||
    extent.length !== 4 ||
    !extent.every(Number.isFinite) ||
    !(extent[1] > extent[0] && extent[3] > extent[2])
  )
    throw new RangeError("Surface extent needs finite, increasing x/z bounds.");
  const converted = data(values, rows * columns);
  const {
    shape: _,
    extent: __,
    heightScale = 1,
    heightOffset = 0,
    ...settings
  } = options;
  const { default: program } = await import("../.build/grid-surface.json");
  const plot = await createPlot(canvas, program as PlotProgram, {
    ...settings,
    bounds: settings.bounds ?? {
      x: [extent[0], extent[1]],
      y: [converted.range[0], converted.range[1]],
    },
    camera: { z: (extent[2] + extent[3]) * 0.5, ...settings.camera },
    surfaceDomain: settings.surfaceDomain ?? {
      x: [extent[0], extent[1]],
      z: [extent[2], extent[3]],
    },
    surface: { valueRange: converted.range, ...settings.surface },
    parameters: {
      gridXMin: extent[0],
      gridXMax: extent[1],
      gridZMin: extent[2],
      gridZMax: extent[3],
      gridRows: rows,
      gridColumns: columns,
      gridCount: rows * columns,
      heightScale,
      heightOffset,
    },
    data: { heights: converted.array },
  });
  const setParameters = plot.setParameters,
    transition = plot.transition,
    setData = plot.setData;
  const checkParameters = (values: Readonly<Record<string, number>>) => {
    for (const key of Object.keys(values))
      if (key !== "heightScale" && key !== "heightOffset")
        throw new TypeError(
          "Grid layout is fixed; only heightScale and heightOffset are animatable parameters.",
        );
  };
  return Object.assign(plot, {
    shape: [rows, columns] as const,
    setParameters(values: Readonly<Record<string, number>>) {
      checkParameters(values);
      setParameters(values);
    },
    transition(
      to: Parameters<Plot["transition"]>[0],
      settings?: Parameters<Plot["transition"]>[1],
    ) {
      checkParameters(to.parameters ?? {});
      return transition(to, settings);
    },
    setData(name: string, values: Float32Array) {
      if (name !== "heights" || values.length !== rows * columns)
        throw new RangeError(
          "Grid observations must preserve the declared shape.",
        );
      setData(name, values);
    },
    setValues(values: NumericData, autoscaleColor = false) {
      const next = data(values, rows * columns);
      setData("heights", next.array);
      if (autoscaleColor) plot.setSurface({ valueRange: next.range });
    },
  });
}
