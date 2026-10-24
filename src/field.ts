import type { Axes, NumericData } from "./data.js";
import type { ColorMap } from "./types.js";
import { COLOR_MAPS } from "./surface.js";

export interface FieldOptions {
  /** Row-major values; shape is [rows, columns]. */
  readonly shape: readonly [number, number];
  /** [xMin, xMax, yMin, yMax], independent of camera limits. */
  readonly extent?: readonly [number, number, number, number];
  readonly colorMap?: ColorMap;
  readonly valueRange?: readonly [number, number];
  readonly interpolation?: "nearest" | "linear";
  readonly origin?: "lower" | "upper";
  readonly alpha?: number;
  readonly colorBar?: boolean;
  readonly levels?: number | NumericData;
  readonly lineWidth?: number;
  readonly visible?: boolean;
}
export interface FieldStyle {
  readonly shape: readonly [number, number];
  readonly extent: readonly [number, number, number, number];
  readonly valueRange: readonly [number, number];
  readonly colorMap: ColorMap;
  readonly interpolation: "nearest" | "linear";
  readonly origin: "lower" | "upper";
  readonly alpha: number;
  readonly colorBar: boolean;
  readonly levels: readonly number[];
  readonly lineWidth: number;
  readonly visible: boolean;
}
export type FieldKind = "image" | "contour" | "contourf";
const MAX_F32 = 3.402823466e38;
function resolve(
  input: FieldOptions,
  values: NumericData,
  mode: FieldKind,
): { options: FieldStyle; values: number[] } {
  const shape = input.shape;
  if (
    !Array.isArray(shape) ||
    shape.length !== 2 ||
    shape.some((n) => !Number.isSafeInteger(n) || n < 1) ||
    shape[0] * shape[1] > 4_194_304
  )
    throw new RangeError(
      "Field shape needs positive rows/columns with at most 4194304 values.",
    );
  if (!values || values.length !== shape[0] * shape[1])
    throw new RangeError("Field data length must equal rows times columns.");
  let lo = Infinity,
    hi = -Infinity;
  const copy = Array.from(values, (v) => {
    if (typeof v !== "number" || (Number.isFinite(v) && Math.abs(v) > MAX_F32))
      throw new RangeError(
        "Field data must contain f32 numbers; NaN/Infinity are missing values.",
      );
    if (Number.isFinite(v)) {
      lo = Math.min(lo, Math.fround(v));
      hi = Math.max(hi, Math.fround(v));
    }
    return v;
  });
  if (lo === Infinity) {
    lo = 0;
    hi = 1;
  }
  if (lo === hi) {
    const delta = Math.max(Math.abs(lo) * 0.05, 0.5);
    lo = Math.max(-MAX_F32, lo - delta);
    hi = Math.min(MAX_F32, hi + delta);
  }
  const extent = input.extent ?? [-0.5, shape[1] - 0.5, -0.5, shape[0] - 0.5];
  if (
    !Array.isArray(extent) ||
    extent.length !== 4 ||
    !extent.every((v) => Number.isFinite(v) && Math.abs(v) <= 3.402823466e32) ||
    !(extent[1] > extent[0] && extent[3] > extent[2])
  )
    throw new RangeError("Field extent needs finite, increasing x/y ranges.");
  const range = input.valueRange ?? [lo, hi];
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every((v) => Number.isFinite(v) && Math.abs(v) <= MAX_F32) ||
    !(Math.fround(range[1]) > Math.fround(range[0])) ||
    range[1] - range[0] > MAX_F32
  )
    throw new RangeError(
      "valueRange needs two distinguishable, increasing f32 values.",
    );
  const palette = input.colorMap ?? "viridis";
  if (!COLOR_MAPS.includes(palette)) throw new TypeError("Unknown colorMap.");
  const interpolation =
      input.interpolation ?? (mode === "image" ? "nearest" : "linear"),
    origin = input.origin ?? "upper";
  if (
    !["nearest", "linear"].includes(interpolation) ||
    !["lower", "upper"].includes(origin)
  )
    throw new TypeError("Unknown field interpolation or origin.");
  if (mode === "contour" && interpolation !== "linear")
    throw new TypeError("Contour lines require linear interpolation.");
  const alpha = input.alpha ?? 1,
    lineWidth = input.lineWidth ?? 1;
  if (
    !Number.isFinite(alpha) ||
    alpha < 0 ||
    alpha > 1 ||
    !Number.isFinite(lineWidth) ||
    lineWidth <= 0 ||
    lineWidth > 32
  )
    throw new RangeError(
      "Field alpha must be 0–1 and lineWidth must be 0–32 CSS pixels.",
    );
  if (
    (input.colorBar !== undefined && typeof input.colorBar !== "boolean") ||
    (input.visible !== undefined && typeof input.visible !== "boolean")
  )
    throw new TypeError("colorBar and visible must be booleans.");
  let levels: number[] = [];
  if (mode !== "image") {
    const requested = input.levels ?? 10;
    if (typeof requested === "number") {
      if (!Number.isSafeInteger(requested) || requested < 2 || requested > 64)
        throw new RangeError("levels must be 2–64 or an increasing array.");
      levels = Array.from(
        { length: requested },
        (_, i) =>
          range[0] * (1 - i / (requested - 1)) +
          (range[1] * i) / (requested - 1),
      );
    } else levels = Array.from(requested);
    if (
      levels.length < 2 ||
      levels.length > 64 ||
      levels.some(
        (v, i) =>
          !Number.isFinite(v) ||
          Math.abs(v) > MAX_F32 ||
          (i > 0 && Math.fround(v) <= Math.fround(levels[i - 1])),
      )
    )
      throw new RangeError(
        "Contour levels must contain 2–64 distinguishable, increasing finite f32 values.",
      );
  }
  return {
    values: copy,
    options: {
      shape: [shape[0], shape[1]],
      extent: [extent[0], extent[1], extent[2], extent[3]],
      valueRange: [range[0], range[1]],
      colorMap: palette,
      interpolation,
      origin,
      alpha,
      colorBar: input.colorBar ?? false,
      levels,
      lineWidth,
      visible: input.visible ?? true,
    },
  };
}
function snapshot(input: FieldOptions): FieldOptions {
  return {
    ...input,
    shape: [...input.shape],
    ...(input.extent
      ? { extent: [...input.extent] as [number, number, number, number] }
      : {}),
    ...(input.valueRange
      ? { valueRange: [...input.valueRange] as [number, number] }
      : {}),
    ...(input.levels !== undefined && typeof input.levels !== "number"
      ? { levels: Array.from(input.levels) }
      : {}),
  };
}

/** Resident scalar observations, rendered as an image or GPU contour field. */
export class Field {
  /** @internal */
  values: number[];
  /** @internal */
  options: FieldStyle;
  private removed = false;
  private input: FieldOptions;
  /** @internal Use ax.imshow(), contour() or contourf(). */
  constructor(
    readonly axes: Axes,
    values: NumericData,
    options: FieldOptions,
    readonly mode: FieldKind,
  ) {
    const result = resolve(options, values, mode);
    this.values = result.values;
    this.options = result.options;
    this.input = snapshot(options);
  }
  private alive(): void {
    this.axes.assertAlive();
    if (this.removed) throw new Error("This field has been removed.");
  }
  setData(values: NumericData): this {
    this.alive();
    const result = resolve(this.input, values, this.mode);
    this.values = result.values;
    this.options = result.options;
    this.axes.presentationChanged();
    return this;
  }
  set(options: Omit<Partial<FieldOptions>, "shape">): this {
    this.alive();
    if (Object.hasOwn(options, "shape"))
      throw new TypeError("Recreate a field to change its shape.");
    const next = snapshot({ ...this.input, ...options });
    const result = resolve(next, this.values, this.mode);
    const previous = this.input,
      previousStyle = this.options;
    this.input = next;
    this.options = result.options;
    try {
      if (options.extent) this.axes.refresh();
      else this.axes.presentationChanged();
    } catch (error) {
      this.input = previous;
      this.options = previousStyle;
      throw error;
    }
    return this;
  }
  remove(): void {
    this.alive();
    this.removed = true;
    this.axes.removeField(this);
  }
  /** @internal */
  detach(): void {
    this.removed = true;
  }
}
