import { OpacityFade } from "./fade.js";
import { createPlotInteraction } from "./interaction.js";
import { GpuRenderer, type RenderAxes, type Scene } from "./gpu-renderer.js";
import { encodePng } from "./png.js";
import { PointerPicker } from "./picking.js";
import type { PickEvent, ColorMap } from "./types.js";
import { Field, type FieldOptions } from "./field.js";
import {
  Annotation,
  type AnnotationOptions,
  type AnnotateOptions,
} from "./annotation.js";
export { Annotation } from "./annotation.js";
export type { AnnotationOptions, AnnotateOptions } from "./annotation.js";
export { Field } from "./field.js";
export type { FieldOptions, FieldStyle, FieldKind } from "./field.js";
export type { PickEvent, ColorMap } from "./types.js";

/** Arrays and typed arrays are accepted; values are copied on insertion. */
export type NumericData = ArrayLike<number>;
export type AxisScale = "linear" | "log";
export type AxisLimits = readonly [number, number];
export interface SeriesOptions {
  readonly label?: string;
  readonly color?: string;
  readonly lineWidth?: number;
  readonly lineStyle?: "-" | "--" | ":" | "none";
  /** Dash coordinate. Auto uses increasing x, otherwise sample index. */
  readonly parameter?: "auto" | "x" | "index";
  /** Fixed period in parameter units. If omitted, automatic density starts at
   * 1/60 of the domain and adjusts by powers of two in both zoom directions. */
  readonly dashPeriod?: number;
  readonly dashOffset?: number;
  readonly marker?: "o" | "s" | "none";
  /** Marker radius in CSS pixels. */
  readonly markerSize?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
  /** Baseline in data coordinates, for stems and bars. Default zero. */
  readonly baseline?: number;
  /** Error bar cap half-width, in CSS pixels. Default four. */
  readonly capSize?: number;
  readonly where?: "pre" | "post" | "mid";
}
export type ErrorValues =
  | number
  | NumericData
  | {
      readonly lower: number | NumericData;
      readonly upper: number | NumericData;
    };
export interface ErrorBarOptions extends SeriesOptions {
  readonly xError?: ErrorValues;
  readonly yError?: ErrorValues;
}
export type SeriesKind =
  "line" | "scatter" | "bar" | "barh" | "step" | "stem" | "fill" | "error";
export interface SeriesData {
  readonly x: number[];
  readonly y: number[];
  readonly lower?: number[];
  readonly xLow?: number[];
  readonly xHigh?: number[];
  readonly yLow?: number[];
  readonly yHigh?: number[];
}
export interface DataPick {
  readonly axes: Axes;
  readonly series: Series | Field;
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly value?: number;
}
export interface BarOptions extends SeriesOptions {
  /** Width in data coordinates. */
  readonly width?: number;
}
export interface HistogramOptions extends SeriesOptions {
  readonly bins?: number | NumericData;
  /** Normalize so that the total area of the bars is one. */
  readonly density?: boolean;
}
export interface AxesOptions {
  readonly title?: string;
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly xLimits?: AxisLimits;
  readonly yLimits?: AxisLimits;
  readonly xScale?: AxisScale;
  readonly yScale?: AxisScale;
  readonly grid?: boolean;
  /** Tick label size, 6–24 CSS pixels. Default 11. */
  readonly labelSize?: number;
  /** Relative tick density, 0.25–4. Default 1. */
  readonly tickDensity?: number;
  /** SDF tick label halo, 0–2 CSS pixels. Default 0.8. */
  readonly labelHalo?: number;
  /** Rounded label plates. Default false; halo remains enabled. */
  readonly labelBackground?: boolean;
  /** true draws a GPU legend; "html" uses an accessible HTML legend on screen. */
  readonly legend?: boolean | "html";
}
export interface FigureOptions {
  readonly backend?: "auto" | "webgpu" | "webgl2";
  readonly onError?: (error: Error) => void;
  /** Element or selector to append to. Defaults to document.body. */
  readonly target?: HTMLElement | string;
  /** Figure size in CSS pixels, independent of display density. */
  readonly width?: number;
  readonly height?: number;
  readonly pixelRatio?: number;
  readonly title?: string;
  readonly background?: string;
  readonly interactive?: boolean;
  /** Released-drag inertia. Default true; disabled by reduced-motion preferences. */
  readonly inertia?: boolean;
  /** Double-click restores the home camera. Default true. */
  readonly doubleClickReset?: boolean;
  readonly toolbar?: boolean;
}
export interface QuickPlotOptions
  extends FigureOptions, SeriesOptions, AxesOptions {}
export interface SaveFigureOptions {
  /** Output pixels per CSS pixel. Defaults to the figure display density. */
  readonly pixelRatio?: number;
}

type Pair = [number, number];
type Kind = SeriesKind;
type Style = Required<SeriesOptions> & { width: number };
const COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];
const PAD = { left: 76, right: 24, top: 42, bottom: 62 };

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be positive and finite.`);
  return value;
}
function limits(value: AxisLimits, scale: AxisScale, name: string): Pair {
  if (
    value.length !== 2 ||
    !value.every(Number.isFinite) ||
    !(value[1] > value[0]) ||
    !Number.isFinite((value[1] - value[0]) * 1e6)
  )
    throw new RangeError(
      `${name} needs two finite, increasing endpoints within the supported range.`,
    );
  if (scale === "log" && value[0] <= 0)
    throw new RangeError(`${name} must be positive on a log axis.`);
  return [value[0], value[1]];
}
function scaleValue(value: number, scale: AxisScale): number {
  return scale === "log" ? (value > 0 ? Math.log10(value) : NaN) : value;
}
function unscale(value: number, scale: AxisScale): number {
  return scale === "log" ? 10 ** value : value;
}
function numeric(data: NumericData, name: string): number[] {
  if (!data || !Number.isSafeInteger(data.length) || data.length < 0)
    throw new TypeError(`${name} must be an array or typed array of numbers.`);
  return Array.from(data, (value) => {
    if (typeof value !== "number")
      throw new TypeError(
        `${name} must contain numbers. Use NaN for missing values.`,
      );
    if (Number.isFinite(value) && Math.abs(value) > 3.402823466e38)
      throw new RangeError(
        `${name} exceeds the finite f32 range used by TypeShade.`,
      );
    return value;
  });
}
function coordinates(
  x: NumericData,
  y?: NumericData | ((x: number) => number),
): { x: number[]; y: number[] } {
  const first = numeric(x, "data");
  if (y === undefined) return { x: first.map((_, i) => i), y: first };
  const second = typeof y === "function" ? first.map(y) : numeric(y, "y");
  if (first.length !== second.length)
    throw new RangeError("x and y must have the same length.");
  if (second.some((value) => typeof value !== "number"))
    throw new TypeError("The plot callback must return numbers.");
  return { x: first, y: second };
}
function isData(value: unknown): value is NumericData {
  return value !== null && typeof value === "object" && "length" in value;
}
function style(
  options: SeriesOptions & { width?: number },
  index: number,
  kind: Kind,
): Style {
  const result: Style = {
    label: options.label ?? "",
    color: options.color ?? COLORS[index % COLORS.length],
    lineWidth: options.lineWidth ?? 1.8,
    lineStyle: options.lineStyle ?? "-",
    parameter: options.parameter ?? "auto",
    dashPeriod: options.dashPeriod ?? 0,
    dashOffset: options.dashOffset ?? 0,
    marker: options.marker ?? (kind === "scatter" ? "o" : "none"),
    markerSize: options.markerSize ?? 3.5,
    alpha: options.alpha ?? 1,
    visible: options.visible ?? true,
    baseline: options.baseline ?? 0,
    capSize: options.capSize ?? 4,
    where: options.where ?? "pre",
    width: options.width ?? 0.8,
  };
  if (!["auto", "x", "index"].includes(result.parameter))
    throw new TypeError("Unknown curve parameter.");
  if (options.dashPeriod !== undefined)
    positive(options.dashPeriod, "dashPeriod");
  if (!Number.isFinite(result.dashOffset))
    throw new RangeError("dashOffset must be finite.");
  positive(result.lineWidth, "lineWidth");
  positive(result.markerSize, "markerSize");
  positive(result.width, "width");
  if (!Number.isFinite(result.alpha) || result.alpha < 0 || result.alpha > 1)
    throw new RangeError("alpha must be between zero and one.");
  if (!["-", "--", ":", "none"].includes(result.lineStyle))
    throw new TypeError("Unknown lineStyle.");
  if (!["o", "s", "none"].includes(result.marker))
    throw new TypeError("Unknown marker.");
  if (typeof result.visible !== "boolean")
    throw new TypeError("visible must be a boolean.");
  if (
    !Number.isFinite(result.baseline) ||
    Math.abs(result.baseline) > 3.402823466e38
  )
    throw new RangeError("baseline must be a finite f32.");
  if (
    !Number.isFinite(result.capSize) ||
    result.capSize < 0 ||
    result.capSize > 64
  )
    throw new RangeError("capSize must be between zero and 64 CSS pixels.");
  if (!["pre", "post", "mid"].includes(result.where))
    throw new TypeError("where must be pre, post or mid.");
  if (typeof result.color !== "string" || !result.color.trim())
    throw new TypeError("color must be a CSS color.");
  return result;
}
/** An independently updateable artist. NaN/Infinity split lines and are omitted from bounds. */
export class Series {
  /** @internal */
  data: SeriesData;
  /** @internal */
  readonly style: Style;
  /** @internal Histogram edges, when applicable. */
  edges?: readonly number[];
  private removed = false;
  /** @internal */
  constructor(
    readonly axes: Axes,
    readonly kind: Kind,
    data: SeriesData,
    options: SeriesOptions & { width?: number },
    index: number,
  ) {
    this.data = data;
    this.style = style(options, index, kind);
  }
  setData(y: NumericData): this;
  setData(x: NumericData, y: NumericData): this;
  setData(x: NumericData, y?: NumericData): this {
    this.axes.assertAlive();
    if (this.removed) throw new Error("This series has been removed.");
    if (this.edges)
      throw new Error("Remove and recreate a histogram to change its bins.");
    if (this.kind === "fill" || this.kind === "error")
      throw new Error(
        "Use setBandData or recreate error bars to update their full bounds.",
      );
    const next = coordinates(x, y);
    const previous = this.data;
    this.data = next;
    try {
      this.axes.refresh();
    } catch (error) {
      this.data = previous;
      throw error;
    }
    return this;
  }
  setBandData(
    x: NumericData,
    first: NumericData,
    second: NumericData | number = 0,
  ): this {
    this.axes.assertAlive();
    if (this.removed || this.kind !== "fill")
      throw new Error("setBandData requires a live fillBetween series.");
    const next = coordinates(x, first);
    const lower =
      typeof second === "number"
        ? next.x.map(() => second)
        : numeric(second, "second");
    if (lower.length !== next.x.length)
      throw new RangeError("Band arrays must have the same length.");
    const previous = this.data;
    this.data = { ...next, lower };
    try {
      this.axes.refresh();
    } catch (error) {
      this.data = previous;
      throw error;
    }
    return this;
  }
  setStyle(value: SeriesOptions): this {
    this.axes.assertAlive();
    if (this.removed) throw new Error("This series has been removed.");
    const next = style({ ...this.style, ...value }, 0, this.kind);
    const previous = { ...this.style };
    Object.assign(this.style, next);
    try {
      if (value.baseline !== undefined) this.axes.refresh();
      else this.axes.presentationChanged();
    } catch (error) {
      Object.assign(this.style, previous);
      throw error;
    }
    return this;
  }
  setVisible(value: boolean): this {
    return this.setStyle({ visible: value });
  }
  setAlpha(value: number): this {
    return this.setStyle({ alpha: value });
  }
  remove(): void {
    this.axes.assertAlive();
    if (this.removed) return;
    this.removed = true;
    this.axes.removeSeries(this);
  }
  /** @internal */
  detach(): void {
    this.removed = true;
  }
}

/** One subplot, with independent limits, labels, color cycle and interaction. */
export class Axes {
  readonly canvas: HTMLCanvasElement;
  private readonly controller: ReturnType<typeof createPlotInteraction>;
  private readonly artists: Series[] = [];
  private readonly fields: Field[] = [];
  private readonly annotations: Annotation[] = [];
  private settings: AxesOptions = {};
  private readonly gridFade = new OpacityFade(0);
  private fadeFrame = 0;
  private htmlLegend?: HTMLUListElement;
  private legendSignature = "";
  private colorIndex = 0;
  private disposed = false;
  private readonly picker: PointerPicker<DataPick>;
  /** @internal */
  constructor(
    readonly figure: Figure,
    readonly index: number,
  ) {
    const doc = figure.element.ownerDocument;
    this.canvas = doc.createElement("canvas");
    this.canvas.style.cssText =
      "display:block;width:100%;height:100%;min-width:0;min-height:0;background:transparent";
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", `Subplot ${index + 1}`);
    this.canvas.title =
      "Drag to pan; scroll to zoom; double-click or Home to reset; Escape stops inertia; arrow keys move; +/− zoom.";
    this.canvas.textContent =
      "Chart. Provide a data table or description alongside this figure for access to the underlying values.";
    this.controller = createPlotInteraction(
      this.canvas,
      { x: [0, 1], y: [0, 1] },
      () => this.redraw(),
      figure.options.interactive !== false,
      () => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          left: rect.left + PAD.left,
          top: rect.top + PAD.top,
          width: Math.max(1, rect.width - PAD.left - PAD.right),
          height: Math.max(1, rect.height - PAD.top - PAD.bottom),
        };
      },
      {
        inertia: figure.options.inertia,
        doubleClickReset: figure.options.doubleClickReset,
      },
    );
    this.canvas.addEventListener("focus", this.redraw);
    this.canvas.addEventListener("blur", this.redraw);
    this.picker = new PointerPicker(
      this.canvas,
      (position) => this.pick(position),
      (error) => figure.reportError(error),
    );
  }
  /** @internal */
  assertAlive(): void {
    if (this.disposed) throw new Error("This axes has been destroyed.");
  }
  plot(y: NumericData, options?: SeriesOptions): Series;
  plot(
    x: NumericData,
    y: NumericData | ((x: number) => number),
    options?: SeriesOptions,
  ): Series;
  plot(
    x: NumericData,
    yOrOptions?: NumericData | ((x: number) => number) | SeriesOptions,
    options: SeriesOptions = {},
  ): Series {
    const paired = typeof yOrOptions === "function" || isData(yOrOptions);
    return this.add(
      "line",
      coordinates(x, paired ? yOrOptions : undefined),
      paired ? options : (yOrOptions ?? {}),
    );
  }
  scatter(x: NumericData, y: NumericData, options: SeriesOptions = {}): Series {
    return this.add("scatter", coordinates(x, y), options);
  }
  bar(x: NumericData, height: NumericData, options: BarOptions = {}): Series {
    return this.add("bar", coordinates(x, height), options);
  }
  barh(y: NumericData, widths: NumericData, options: BarOptions = {}): Series {
    return this.add("barh", coordinates(widths, y), options);
  }
  step(x: NumericData, y: NumericData, options: SeriesOptions = {}): Series {
    return this.add("step", coordinates(x, y), options);
  }
  stem(x: NumericData, y: NumericData, options: SeriesOptions = {}): Series {
    return this.add("stem", coordinates(x, y), { marker: "o", ...options });
  }
  fillBetween(
    x: NumericData,
    first: NumericData,
    second: NumericData | number = 0,
    options: SeriesOptions = {},
  ): Series {
    const data = coordinates(x, first);
    const lower =
      typeof second === "number"
        ? data.x.map(() => second)
        : numeric(second, "second");
    if (lower.length !== data.x.length)
      throw new RangeError("Band arrays must have the same length.");
    return this.add("fill", { ...data, lower }, { alpha: 0.3, ...options });
  }
  errorbar(
    x: NumericData,
    y: NumericData,
    options: ErrorBarOptions = {},
  ): Series {
    const data = coordinates(x, y);
    const errors = (
      input: ErrorValues | undefined,
      name: string,
    ): [number[], number[]] => {
      const read = (value: number | NumericData | undefined) => {
        const result =
          typeof value === "number" || value === undefined
            ? data.x.map(() => value ?? 0)
            : numeric(value, name);
        if (
          result.length !== data.x.length ||
          result.some((v) => !Number.isFinite(v) || v < 0)
        )
          throw new RangeError(
            `${name} must contain nonnegative finite errors matching the data.`,
          );
        return result;
      };
      return input && typeof input === "object" && "lower" in input
        ? [read(input.lower), read(input.upper)]
        : [
            read(input as number | NumericData | undefined),
            read(input as number | NumericData | undefined),
          ];
    };
    const [xl, xh] = errors(options.xError, "xError"),
      [yl, yh] = errors(options.yError, "yError");
    return this.add(
      "error",
      {
        ...data,
        ...(options.xError !== undefined
          ? {
              xLow: data.x.map((v, i) => v - xl[i]),
              xHigh: data.x.map((v, i) => v + xh[i]),
            }
          : {}),
        ...(options.yError !== undefined
          ? {
              yLow: data.y.map((v, i) => v - yl[i]),
              yHigh: data.y.map((v, i) => v + yh[i]),
            }
          : {}),
      },
      { marker: "o", ...options },
    );
  }
  imshow(values: NumericData, options: FieldOptions): Field {
    return this.addField(values, options, "image");
  }
  text(
    x: number,
    y: number,
    value: string,
    options: AnnotationOptions = {},
  ): Annotation {
    this.assertAlive();
    const annotation = new Annotation(this, value, [x, y], options);
    this.annotations.push(annotation);
    this.redraw();
    return annotation;
  }
  annotate(
    value: string,
    xy: readonly [number, number],
    options: AnnotateOptions = {},
  ): Annotation {
    this.assertAlive();
    const { xyText = xy, ...style } = options;
    const annotation = new Annotation(this, value, xyText, style, xy);
    this.annotations.push(annotation);
    this.redraw();
    return annotation;
  }
  /** @internal */
  removeAnnotation(annotation: Annotation): void {
    const index = this.annotations.indexOf(annotation);
    if (index >= 0) this.annotations.splice(index, 1);
    this.redraw();
  }
  contour(values: NumericData, options: FieldOptions): Field {
    return this.addField(values, options, "contour");
  }
  contourf(values: NumericData, options: FieldOptions): Field {
    return this.addField(values, options, "contourf");
  }
  private addField(
    values: NumericData,
    options: FieldOptions,
    mode: "image" | "contour" | "contourf",
  ): Field {
    this.assertAlive();
    const field = new Field(this, values, options, mode);
    this.fields.push(field);
    try {
      this.refresh();
    } catch (error) {
      this.fields.pop();
      throw error;
    }
    return field;
  }
  colorbar(field: Field, visible = true): this {
    this.assertAlive();
    if (!this.fields.includes(field))
      throw new Error("The colorbar field must belong to this axes.");
    for (const candidate of this.fields)
      candidate.set({ colorBar: candidate === field && visible });
    return this;
  }
  /** @internal */
  removeField(field: Field): void {
    const index = this.fields.indexOf(field);
    if (index >= 0) this.fields.splice(index, 1);
    this.refresh();
  }
  async pick(
    position: readonly [number, number],
    radius = 8,
  ): Promise<DataPick | null> {
    this.assertAlive();
    const result = await this.figure.pickAxes(this.index, position, radius);
    this.assertAlive();
    const artist = result?.artist;
    if (!result || !artist) return null;
    if (artist instanceof Field) {
      if (
        !this.fields.includes(artist) ||
        artist.values !== result.data ||
        result.index >= artist.values.length
      )
        return null;
      const [rows, cols] = artist.options.shape,
        [x0, x1, y0, y1] = artist.options.extent;
      const row = Math.floor(result.index / cols),
        column = result.index % cols;
      return {
        axes: this,
        series: artist,
        index: result.index,
        x: x0 + ((column + 0.5) / cols) * (x1 - x0),
        y:
          y0 +
          ((artist.options.origin === "upper" ? rows - row - 0.5 : row + 0.5) /
            rows) *
            (y1 - y0),
        value: artist.values[result.index],
      };
    }
    if (
      !this.artists.includes(artist) ||
      artist.data !== result.data ||
      result.index >= artist.data.x.length
    )
      return null;
    return {
      axes: this,
      series: artist,
      index: result.index,
      x: artist.data.x[result.index],
      y: artist.data.y[result.index],
    };
  }
  on(
    type: "hover" | "click",
    listener: (event: PickEvent<DataPick>) => void,
  ): this {
    this.assertAlive();
    this.picker.on(type, listener);
    return this;
  }
  off(
    type: "hover" | "click",
    listener: (event: PickEvent<DataPick>) => void,
  ): this {
    this.picker.off(type, listener);
    return this;
  }
  histogram(
    values: NumericData,
    options: HistogramOptions = {},
  ): { counts: readonly number[]; bins: readonly number[]; series: Series } {
    this.assertAlive();
    const samples = numeric(values, "values").filter(Number.isFinite);
    const requested = options.bins ?? 10;
    let edges: number[];
    if (typeof requested === "number") {
      if (
        !Number.isSafeInteger(requested) ||
        requested < 1 ||
        requested > 10000
      )
        throw new RangeError(
          "bins must be an integer from 1 to 10000, or increasing bin edges.",
        );
      let lo = Infinity,
        hi = -Infinity;
      for (const sample of samples) {
        lo = Math.min(lo, sample);
        hi = Math.max(hi, sample);
      }
      if (!samples.length) {
        lo = 0;
        hi = 1;
      }
      if (lo === hi) {
        const delta = Math.max(0.5, Math.abs(lo) * 0.05);
        lo -= delta;
        hi += delta;
      }
      limits([lo, hi], "linear", "histogram range");
      edges = Array.from(
        { length: requested + 1 },
        (_, i) => lo + (hi - lo) * (i / requested),
      );
      edges[requested] = hi;
    } else edges = numeric(requested, "bins");
    if (
      edges.length < 2 ||
      edges.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= edges[i - 1]))
    )
      throw new RangeError(
        "Histogram edges must be finite and strictly increasing.",
      );
    const counts = new Array<number>(edges.length - 1).fill(0);
    let included = 0;
    for (const value of samples) {
      if (value < edges[0] || value > edges[edges.length - 1]) continue;
      let lo = 0,
        hi = edges.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >>> 1;
        if (value < edges[mid]) hi = mid;
        else lo = mid;
      }
      counts[Math.min(lo, counts.length - 1)]++;
      included++;
    }
    if (options.density && included)
      for (let i = 0; i < counts.length; i++)
        counts[i] /= included * (edges[i + 1] - edges[i]);
    const series = this.add(
      "bar",
      {
        x: counts.map((_, i) => edges[i] / 2 + edges[i + 1] / 2),
        y: [...counts],
      },
      options,
      edges,
    );
    return { counts, bins: [...edges], series };
  }
  private add(
    kind: Kind,
    data: SeriesData,
    options: SeriesOptions & { width?: number },
    edges?: readonly number[],
  ): Series {
    this.assertAlive();
    const series = new Series(this, kind, data, options, this.colorIndex);
    series.edges = edges;
    this.artists.push(series);
    try {
      this.refresh();
    } catch (error) {
      this.artists.pop();
      throw error;
    }
    this.colorIndex++;
    return series;
  }
  /** Set multiple properties in one call. Fixed limits persist as data is added. */
  set(options: AxesOptions): this {
    this.assertAlive();
    const next = { ...this.settings, ...options };
    for (const axis of ["x", "y"] as const) {
      const scale = next[`${axis}Scale`] ?? "linear";
      if (scale !== "linear" && scale !== "log")
        throw new TypeError("Axis scale must be linear or log.");
      const range = next[`${axis}Limits`];
      if (range) next[`${axis}Limits`] = limits(range, scale, `${axis}Limits`);
    }
    for (const [key, low, high] of [
      ["labelSize", 6, 24],
      ["tickDensity", 0.25, 4],
      ["labelHalo", 0, 2],
    ] as const) {
      const value = next[key];
      if (
        value !== undefined &&
        (!Number.isFinite(value) || value < low || value > high)
      )
        throw new RangeError(`${key} must be between ${low} and ${high}.`);
    }
    if (
      next.labelBackground !== undefined &&
      typeof next.labelBackground !== "boolean"
    )
      throw new TypeError("labelBackground must be a boolean.");
    if (
      next.legend !== undefined &&
      next.legend !== true &&
      next.legend !== false &&
      next.legend !== "html"
    )
      throw new TypeError("legend must be a boolean or html.");
    const previous = this.settings;
    this.settings = next;
    try {
      if (options.legend !== undefined) this.updateHtmlLegend();
      if (options.grid !== undefined) {
        const win = this.canvas.ownerDocument.defaultView!;
        this.gridFade.set(
          options.grid ? 1 : 0,
          win.performance.now(),
          win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
        );
      }
      if (
        ["xLimits", "yLimits", "xScale", "yScale"].some((key) =>
          Object.hasOwn(options, key),
        )
      )
        this.refresh();
      else {
        this.updateLabel();
        this.redraw();
      }
    } catch (error) {
      this.settings = previous;
      throw error;
    }
    return this;
  }
  setTitle(value: string): this {
    return this.set({ title: value });
  }
  setXLabel(value: string): this {
    return this.set({ xLabel: value });
  }
  setYLabel(value: string): this {
    return this.set({ yLabel: value });
  }
  setXLimits(min: number, max: number): this {
    return this.set({ xLimits: [min, max] });
  }
  setYLimits(min: number, max: number): this {
    return this.set({ yLimits: [min, max] });
  }
  setXScale(value: AxisScale): this {
    return this.set({ xScale: value });
  }
  setYScale(value: AxisScale): this {
    return this.set({ yScale: value });
  }
  grid(visible = true): this {
    return this.set({ grid: visible });
  }
  legend(visible: boolean | "html" = true): this {
    this.assertAlive();
    if (this.settings.legend === visible) return this;
    return this.set({ legend: visible });
  }
  /** Restore automatic limits for both axes. */
  autoscale(): this {
    this.assertAlive();
    this.settings = {
      ...this.settings,
      xLimits: undefined,
      yLimits: undefined,
    };
    this.refresh();
    return this;
  }
  clear(): this {
    this.assertAlive();
    this.artists.forEach((series) => series.detach());
    this.fields.forEach((field) => field.detach());
    this.fields.length = 0;
    this.annotations.forEach((annotation) => annotation.detach());
    this.annotations.length = 0;
    this.htmlLegend?.remove();
    this.htmlLegend = undefined;
    this.artists.length = 0;
    this.colorIndex = 0;
    this.settings = {};
    this.refresh();
    return this;
  }
  reset(): this {
    this.assertAlive();
    this.controller.reset();
    return this;
  }
  bounds(): { x: Pair; y: Pair } {
    this.assertAlive();
    const bounds = this.controller.bounds();
    return {
      x: bounds.x.map((v) =>
        unscale(v, this.settings.xScale ?? "linear"),
      ) as Pair,
      y: bounds.y.map((v) =>
        unscale(v, this.settings.yScale ?? "linear"),
      ) as Pair,
    };
  }
  /** @internal */
  removeSeries(series: Series): void {
    const index = this.artists.indexOf(series);
    if (index >= 0) this.artists.splice(index, 1);
    this.refresh();
  }
  /** @internal */
  refresh(): void {
    const ranges: Record<"x" | "y", Pair> = {
      x: [Infinity, -Infinity],
      y: [Infinity, -Infinity],
    };
    const scales = {
      x: this.settings.xScale ?? "linear",
      y: this.settings.yScale ?? "linear",
    };
    const include = (axis: "x" | "y", value: number) => {
      const v = scaleValue(value, scales[axis]);
      if (Number.isFinite(v)) {
        ranges[axis][0] = Math.min(ranges[axis][0], v);
        ranges[axis][1] = Math.max(ranges[axis][1], v);
      }
    };
    for (const field of this.fields) {
      const [x0, x1, y0, y1] = field.options.extent;
      include("x", x0);
      include("x", x1);
      include("y", y0);
      include("y", y1);
    }
    for (const series of this.artists) {
      for (let i = 0; i < series.data.x.length; i++) {
        const x = series.data.x[i],
          y = series.data.y[i];
        if (series.kind === "fill") {
          const other = series.data.lower![i];
          if (
            Number.isFinite(scaleValue(x, scales.x)) &&
            Number.isFinite(y) &&
            Number.isFinite(other)
          ) {
            include("x", x);
            include("y", y);
            include("y", other);
          }
          continue;
        }
        if (
          !Number.isFinite(scaleValue(x, scales.x)) ||
          !Number.isFinite(scaleValue(y, scales.y))
        )
          continue;
        include("x", x);
        include("y", y);
        if (series.data.lower) include("y", series.data.lower[i]);
        if (series.data.xLow) {
          include("x", series.data.xLow[i]);
          include("x", series.data.xHigh![i]);
        }
        if (series.data.yLow) {
          include("y", series.data.yLow[i]);
          include("y", series.data.yHigh![i]);
        }
        if (series.kind === "bar") {
          include("x", series.edges?.[i] ?? x - series.style.width / 2);
          include("x", series.edges?.[i + 1] ?? x + series.style.width / 2);
          if (scales.y === "linear" || series.style.baseline > 0)
            include("y", series.style.baseline);
        }
        if (series.kind === "barh") {
          include("y", y - series.style.width / 2);
          include("y", y + series.style.width / 2);
          include("x", series.style.baseline);
        }
        if (series.kind === "stem") include("y", series.style.baseline);
      }
    }
    for (const axis of ["x", "y"] as const) {
      const fixed = this.settings[`${axis}Limits`];
      if (fixed) {
        ranges[axis] = fixed.map((v) => scaleValue(v, scales[axis])) as Pair;
        continue;
      }
      let [lo, hi] = ranges[axis];
      if (!Number.isFinite(lo)) {
        ranges[axis] = [0, 1];
        continue;
      }
      const pad =
        lo === hi
          ? Math.max(Math.abs(lo) * 0.05, scales[axis] === "log" ? 0.5 : 0.05)
          : (hi - lo) * 0.05;
      lo -= pad;
      hi += pad;
      ranges[axis] = [lo, hi];
    }
    for (const axis of [ranges.x, ranges.y])
      if ((axis[1] - axis[0]) * 1e6 > 3.402823466e38)
        throw new RangeError("Plot range exceeds the f32 interaction range.");
    this.controller.setBounds(ranges);
    this.updateLabel();
  }
  private updateLabel(): void {
    const labels = [
      this.settings.title,
      this.settings.xLabel && `x: ${this.settings.xLabel}`,
      this.settings.yLabel && `y: ${this.settings.yLabel}`,
      ...this.artists.map((s) => s.style.label),
      ...this.fields.map(
        (field) =>
          `${field.mode}, ${field.options.shape[0]} rows by ${field.options.shape[1]} columns`,
      ),
    ].filter(Boolean);
    this.canvas.setAttribute(
      "aria-label",
      labels.join(". ") ||
        `Subplot ${this.index + 1}, ${this.artists.length} series`,
    );
  }
  readonly redraw = (): void => {
    this.picker?.invalidate();
    if (!this.disposed) this.figure.redraw();
  };
  /** @internal */
  presentationChanged(): void {
    this.updateLabel();
    this.updateHtmlLegend();
    this.redraw();
  }
  private updateHtmlLegend(): void {
    if (this.settings.legend !== "html") {
      this.htmlLegend?.remove();
      this.htmlLegend = undefined;
      this.legendSignature = "";
      return;
    }
    const entries = this.artists.filter(
      (series) => series.style.label && !series.style.label.startsWith("_"),
    );
    const signature = JSON.stringify(
      entries.map((series) => [
        series.style.label,
        series.style.color,
        series.style.lineStyle,
        series.style.alpha,
      ]),
    );
    if (!this.htmlLegend) {
      const list = this.canvas.ownerDocument.createElement("ul");
      this.htmlLegend = list;
      list.className = "typeplot-html-legend";
      list.setAttribute("aria-label", "Legend");
      list.style.cssText =
        "position:absolute;z-index:2;list-style:none;margin:0;padding:6px 9px;border:1px solid #dce2e9;border-radius:6px;background:#ffffffef;color:#334155;font:12px system-ui,sans-serif;transform:translateX(-100%);max-width:45%;pointer-events:auto";
      this.canvas.parentElement?.appendChild(list);
    }
    if (signature !== this.legendSignature) {
      this.htmlLegend.replaceChildren();
      for (const series of entries) {
        const item = this.canvas.ownerDocument.createElement("li");
        item.style.cssText =
          "display:flex;align-items:center;gap:8px;padding:3px 0";
        const sample = this.canvas.ownerDocument.createElement("span");
        sample.setAttribute("aria-hidden", "true");
        sample.style.cssText = `display:inline-block;flex:0 0 18px;border-top:2px ${series.style.lineStyle === "--" ? "dashed" : series.style.lineStyle === ":" ? "dotted" : "solid"}`;
        sample.style.borderColor = series.style.color;
        sample.style.opacity = String(series.style.alpha);
        const label = this.canvas.ownerDocument.createElement("span");
        label.textContent = series.style.label;
        item.append(sample, label);
        this.htmlLegend.appendChild(item);
      }
      this.legendSignature = signature;
    }
    this.htmlLegend.hidden = !entries.length;
    this.htmlLegend.style.left = `${this.canvas.offsetLeft + this.canvas.clientWidth - PAD.right - 8}px`;
    this.htmlLegend.style.top = `${this.canvas.offsetTop + PAD.top + 8}px`;
  }
  /** @internal GPU input only; axes/grid/ticks/glyphs are generated by the shaders. */
  snapshot(settled = false): RenderAxes {
    if (!settled) this.updateHtmlLegend();
    const now = this.canvas.ownerDocument.defaultView!.performance.now();
    if (!settled && this.gridFade.active(now) && !this.fadeFrame) {
      this.fadeFrame =
        this.canvas.ownerDocument.defaultView!.requestAnimationFrame(() => {
          this.fadeFrame = 0;
          this.redraw();
        });
    }
    return {
      gridOpacity: settled
        ? this.settings.grid
          ? 1
          : 0
        : this.gridFade.value(now),
      bounds: this.controller.bounds(),
      settings:
        this.settings.legend === "html"
          ? { ...this.settings, legend: settled }
          : this.settings,
      series: this.artists,
      fields: this.fields,
      annotations: this.annotations,
      focused: this.canvas.matches(":focus-visible"),
    };
  }
  /** @internal */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.fadeFrame)
      this.canvas.ownerDocument.defaultView!.cancelAnimationFrame(
        this.fadeFrame,
      );
    this.controller.destroy();
    this.picker.destroy();
    this.canvas.removeEventListener("focus", this.redraw);
    this.canvas.removeEventListener("blur", this.redraw);
    this.artists.length = 0;
    this.fields.forEach((field) => field.detach());
    this.fields.length = 0;
    this.annotations.forEach((annotation) => annotation.detach());
    this.annotations.length = 0;
    this.canvas.remove();
  }
}

/** Owns the DOM, subplots, resize observer and export lifecycle. */
export class Figure {
  readonly element: HTMLDivElement;
  readonly axes: readonly Axes[];
  readonly options: FigureOptions;
  readonly pixelRatio: number;
  private readonly observer?: ResizeObserver;
  private readonly win: Window;
  private disposed = false;
  private readonly rows: number;
  private readonly cols: number;
  private readonly surface: HTMLCanvasElement;
  private readonly stage: HTMLDivElement;
  private renderer?: GpuRenderer;
  private frame = 0;
  private dirty = false;
  private drawing: Promise<void> | null = null;
  /** Resolves after backend initialization and the first complete TypeShade frame. */
  readonly ready: Promise<void>;
  get backend(): "webgpu" | "webgl2" | undefined {
    return this.renderer?.backend;
  }
  private report = (error: unknown): void => {
    if (this.disposed) return;
    const value = error instanceof Error ? error : new Error(String(error));
    this.element.setAttribute("data-error", value.message);
    if (this.options.onError) {
      try {
        this.options.onError(value);
      } catch (callbackError) {
        console.error("[typeplot] onError failed", callbackError);
      }
    } else
      this.element.dispatchEvent(
        new CustomEvent("typeploterror", { detail: value, bubbles: true }),
      );
  };
  /** @internal */
  reportError(error: unknown): void {
    this.report(error);
  }
  /** @internal */
  async pickAxes(
    index: number,
    position: readonly [number, number],
    radius: number,
  ): Promise<{
    artist: Series | Field;
    data: SeriesData | number[];
    index: number;
  } | null> {
    if (this.disposed) throw new Error("This figure has been destroyed.");
    await this.ready;
    if (this.disposed) throw new Error("This figure has been destroyed.");
    const rect = this.stage.getBoundingClientRect();
    const scene = this.snapshot(rect.width, rect.height);
    const artists = [
      ...scene.axes[index].fields,
      ...scene.axes[index].series,
    ] as (Series | Field)[];
    const data = artists.map((artist) =>
      artist instanceof Field ? artist.values : artist.data,
    );
    const result = await this.renderer!.pick(scene, index, position, radius);
    return result && artists[result.series]
      ? {
          artist: artists[result.series],
          data: data[result.series],
          index: result.index,
        }
      : null;
  }
  /** @internal Use figure() or subplots(). */
  constructor(rows: number, cols: number, options: FigureOptions = {}) {
    if (
      !Number.isSafeInteger(rows) ||
      !Number.isSafeInteger(cols) ||
      rows < 1 ||
      cols < 1 ||
      rows * cols > 100
    )
      throw new RangeError(
        "Subplots need positive integer rows/columns, with at most 100 axes.",
      );
    if (typeof document === "undefined")
      throw new Error(
        "TypePlot figures need a browser document. Create them after mounting the view.",
      );
    const target =
      typeof options.target === "string"
        ? document.querySelector<HTMLElement>(options.target)
        : (options.target ?? document.body);
    if (!target || typeof target.appendChild !== "function")
      throw new TypeError("Figure target must resolve to a container element.");
    const doc = target.ownerDocument;
    const win = doc.defaultView;
    if (!win) throw new Error("Figure target needs a browser window.");
    const width = positive(options.width ?? 640 * cols, "width"),
      height = positive(options.height ?? 400 * rows, "height");
    const ratio = positive(
      options.pixelRatio ??
        Math.min(
          win.devicePixelRatio || 1,
          4,
          16384 / Math.max(width, height + (options.title ? 42 : 0)),
          Math.sqrt(16_777_216 / (width * (height + (options.title ? 42 : 0)))),
        ),
      "pixelRatio",
    );
    if (
      ratio > 4 ||
      Math.ceil(width * ratio) * Math.ceil(height * ratio) > 16_777_216 ||
      Math.max(width, height) * ratio > 16384
    )
      throw new RangeError(
        "Figure exceeds the 16 megapixel or 16384 pixel dimension limit, or pixelRatio exceeds four.",
      );
    this.options = { ...options, width, height };
    this.pixelRatio = ratio;
    this.win = win;
    this.rows = rows;
    this.cols = cols;
    this.element = doc.createElement("div");
    this.element.style.cssText = `overflow:auto;width:min(100%, ${width}px);font:13px system-ui,sans-serif;color:#0f172a;background:${options.background ?? "#ffffff"}`;
    this.element.setAttribute("role", "group");
    this.element.setAttribute("aria-label", options.title || "TypePlot figure");
    const titleHeight = options.title ? 42 : 0;
    this.stage = doc.createElement("div");
    this.stage.style.cssText = `position:relative;width:100%;min-width:${Math.min(width, 280 * cols)}px;aspect-ratio:${width}/${height + titleHeight}`;
    this.surface = doc.createElement("canvas");
    this.surface.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    this.surface.setAttribute("aria-hidden", "true");
    this.stage.appendChild(this.surface);
    const grid = doc.createElement("div");
    grid.style.cssText = `position:absolute;inset:${(titleHeight / (height + titleHeight)) * 100}% 0 0;display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));grid-template-rows:repeat(${rows},minmax(0,1fr))`;
    this.stage.appendChild(grid);
    this.element.appendChild(this.stage);
    const axes: Axes[] = [];
    this.axes = axes;
    this.ready = Promise.resolve().then(async () => {
      const renderer = await GpuRenderer.create(this.surface, options.backend);
      if (this.disposed) {
        renderer.destroy();
        throw new Error("This figure has been destroyed.");
      }
      this.renderer = renderer;
      await this.paint();
    });
    void this.ready.catch(this.report);
    try {
      for (let i = 0; i < rows * cols; i++) {
        const ax = new Axes(this, i);
        axes.push(ax);
        grid.appendChild(ax.canvas);
      }
      if (options.toolbar !== false) {
        const toolbar = doc.createElement("div");
        toolbar.setAttribute("role", "group");
        toolbar.setAttribute("aria-label", "Figure controls");
        toolbar.style.cssText =
          "display:flex;gap:8px;align-items:center;padding:8px 12px;flex-wrap:wrap";
        const status = doc.createElement("span");
        status.setAttribute("role", "status");
        const reset = doc.createElement("button");
        reset.type = "button";
        reset.textContent = "Reset view";
        reset.onclick = () => this.axes.forEach((ax) => ax.reset());
        const save = doc.createElement("button");
        save.type = "button";
        save.textContent = "Save PNG";
        save.onclick = () => {
          void this.saveImage().catch((error) => {
            status.textContent =
              error instanceof Error ? error.message : String(error);
          });
        };
        toolbar.append(reset, save, status);
        this.element.appendChild(toolbar);
      }
      target.appendChild(this.element);
      if (typeof win.ResizeObserver === "function") {
        this.observer = new win.ResizeObserver(this.redraw);
        this.observer.observe(grid);
      }
      win.addEventListener("resize", this.redraw);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  readonly redraw = (): void => {
    if (this.disposed) return;
    this.dirty = true;
    if (!this.frame)
      this.frame = this.win.requestAnimationFrame(() => {
        this.frame = 0;
        if (this.renderer) void this.paint().catch(this.report);
      });
  };
  private snapshot(width: number, height: number, settled = false): Scene {
    return {
      width,
      height,
      rows: this.rows,
      cols: this.cols,
      titleHeight: this.options.title
        ? (height * 42) / (this.options.height! + 42)
        : 0,
      title: this.options.title,
      background: this.options.background,
      axes: this.axes.map((ax) => ax.snapshot(settled)),
    };
  }
  private paint(): Promise<void> {
    if (this.disposed || !this.renderer) return Promise.resolve();
    this.dirty = true;
    if (!this.drawing)
      this.drawing = (async () => {
        while (this.dirty && !this.disposed) {
          this.dirty = false;
          const rect = this.stage.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0)
            await this.renderer!.render(
              this.snapshot(rect.width, rect.height),
              this.pixelRatio,
            );
        }
      })().finally(() => {
        this.drawing = null;
      });
    return this.drawing;
  }
  /** Redraw all subplots through TypeShade and encode read-back GPU pixels as PNG. */
  async toBlob(options: SaveFigureOptions = {}): Promise<Blob> {
    if (this.disposed) throw new Error("This figure has been destroyed.");
    await this.ready;
    const ratio = positive(options.pixelRatio ?? this.pixelRatio, "pixelRatio");
    const width = this.options.width!,
      height = this.options.height! + (this.options.title ? 42 : 0);
    if (
      Math.ceil(width * ratio) * Math.ceil(height * ratio) > 16_777_216 ||
      Math.max(width, height) * ratio > 16384
    )
      throw new RangeError(
        "PNG export exceeds the 16 megapixel or 16384 pixel dimension limit.",
      );
    if (this.disposed) throw new Error("This figure has been destroyed.");
    const pixels = await this.renderer!.pixels(
      this.snapshot(width, height, true),
      ratio,
    );
    return encodePng(pixels.bytes, pixels.width, pixels.height);
  }
  async saveImage(
    filename = "typeplot.png",
    options: SaveFigureOptions = {},
  ): Promise<void> {
    if (!filename.toLowerCase().endsWith(".png"))
      throw new TypeError("saveImage currently supports .png files.");
    const blob = await this.toBlob(options);
    if (this.disposed) throw new Error("This figure has been destroyed.");
    const url = URL.createObjectURL(blob),
      link = this.element.ownerDocument.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    this.element.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      this.win.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.observer?.disconnect();
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.renderer?.destroy();
    this.win.removeEventListener("resize", this.redraw);
    this.axes.forEach((ax) => ax.destroy());
    this.element.remove();
  }
}

/** Create a single-axes figure without global current-figure state. */
export function figure(options: FigureOptions = {}): Figure {
  return new Figure(1, 1, options);
}
/** Axes are always a flat row-major array, including the 1 × 1 case. */
export function subplots(
  rows = 1,
  cols = 1,
  options: FigureOptions = {},
): { fig: Figure; axes: readonly Axes[] } {
  const fig = new Figure(rows, cols, options);
  return { fig, axes: fig.axes };
}
/** Evenly spaced values including both endpoints by default. */
export function linspace(
  start: number,
  stop: number,
  count = 50,
): Float64Array {
  if (!Number.isFinite(start) || !Number.isFinite(stop))
    throw new RangeError("linspace endpoints must be finite.");
  if (!Number.isSafeInteger(count) || count < 0 || count > 10_000_000)
    throw new RangeError(
      "linspace count must be an integer from zero to ten million.",
    );
  return Float64Array.from({ length: count }, (_, i) =>
    count === 1
      ? start
      : i === count - 1
        ? stop
        : start * (1 - i / (count - 1)) + stop * (i / (count - 1)),
  );
}
export function plot(y: NumericData, options?: QuickPlotOptions): Figure;
export function plot(
  x: NumericData,
  y: NumericData | ((x: number) => number),
  options?: QuickPlotOptions,
): Figure;
export function plot(
  x: NumericData,
  yOrOptions?: NumericData | ((x: number) => number) | QuickPlotOptions,
  options: QuickPlotOptions = {},
): Figure {
  const paired = typeof yOrOptions === "function" || isData(yOrOptions);
  const opts = paired ? options : (yOrOptions ?? {});
  const fig = figure({ ...opts, title: undefined });
  try {
    const ax = fig.axes[0];
    ax.set(opts);
    if (paired) ax.plot(x, yOrOptions, opts);
    else ax.plot(x, opts);
    return fig;
  } catch (error) {
    fig.destroy();
    throw error;
  }
}
