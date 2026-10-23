import { createPlotInteraction } from "./interaction.js";
import { GpuRenderer, type RenderAxes, type Scene } from "./gpu-renderer.js";
import { encodePng } from "./png.js";

/** Arrays and typed arrays are accepted; values are copied on insertion. */
export type NumericData = ArrayLike<number>;
export type AxisScale = "linear" | "log";
export type AxisLimits = readonly [number, number];
export interface SeriesOptions {
  readonly label?: string;
  readonly color?: string;
  readonly lineWidth?: number;
  readonly lineStyle?: "-" | "--" | ":" | "none";
  readonly marker?: "o" | "s" | "none";
  /** Marker radius in CSS pixels. */
  readonly markerSize?: number;
  readonly alpha?: number;
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
  readonly legend?: boolean;
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
  readonly toolbar?: boolean;
}
export interface QuickPlotOptions
  extends FigureOptions, SeriesOptions, AxesOptions {}
export interface SaveFigureOptions {
  /** Output pixels per CSS pixel. Defaults to the display density, capped at two. */
  readonly pixelRatio?: number;
}

type Pair = [number, number];
type Kind = "line" | "scatter" | "bar";
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
    marker: options.marker ?? (kind === "scatter" ? "o" : "none"),
    markerSize: options.markerSize ?? 3.5,
    alpha: options.alpha ?? 1,
    width: options.width ?? 0.8,
  };
  positive(result.lineWidth, "lineWidth");
  positive(result.markerSize, "markerSize");
  positive(result.width, "width");
  if (!Number.isFinite(result.alpha) || result.alpha < 0 || result.alpha > 1)
    throw new RangeError("alpha must be between zero and one.");
  if (!["-", "--", ":", "none"].includes(result.lineStyle))
    throw new TypeError("Unknown lineStyle.");
  if (!["o", "s", "none"].includes(result.marker))
    throw new TypeError("Unknown marker.");
  if (typeof result.color !== "string" || !result.color.trim())
    throw new TypeError("color must be a CSS color.");
  return result;
}
/** An independently updateable artist. NaN/Infinity split lines and are omitted from bounds. */
export class Series {
  /** @internal */
  data: { x: number[]; y: number[] };
  /** @internal */
  readonly style: Style;
  /** @internal Histogram edges, when applicable. */
  edges?: readonly number[];
  private removed = false;
  /** @internal */
  constructor(
    readonly axes: Axes,
    readonly kind: Kind,
    data: { x: number[]; y: number[] },
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
  private settings: AxesOptions = {};
  private colorIndex = 0;
  private disposed = false;
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
      "Drag to pan; scroll to zoom; arrow keys to move; +/− to zoom; Home to reset.";
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
    );
    this.canvas.addEventListener("focus", this.redraw);
    this.canvas.addEventListener("blur", this.redraw);
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
    data: { x: number[]; y: number[] },
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
    const previous = this.settings;
    this.settings = next;
    try {
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
    this.assertAlive();
    this.settings = { ...this.settings, grid: visible };
    this.redraw();
    return this;
  }
  legend(visible = true): this {
    this.assertAlive();
    this.settings = { ...this.settings, legend: visible };
    this.redraw();
    return this;
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
    for (const series of this.artists) {
      for (let i = 0; i < series.data.x.length; i++) {
        const x = series.data.x[i],
          y = series.data.y[i];
        if (
          !Number.isFinite(scaleValue(x, scales.x)) ||
          !Number.isFinite(scaleValue(y, scales.y))
        )
          continue;
        include("x", x);
        include("y", y);
        if (series.kind === "bar") {
          include("x", series.edges?.[i] ?? x - series.style.width / 2);
          include("x", series.edges?.[i + 1] ?? x + series.style.width / 2);
          if (scales.y === "linear") include("y", 0);
        }
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
    ].filter(Boolean);
    this.canvas.setAttribute(
      "aria-label",
      labels.join(". ") ||
        `Subplot ${this.index + 1}, ${this.artists.length} series`,
    );
  }
  readonly redraw = (): void => {
    if (!this.disposed) this.figure.redraw();
  };
  /** @internal GPU input only; axes/grid/ticks/glyphs are generated by the shaders. */
  snapshot(): RenderAxes {
    return {
      bounds: this.controller.bounds(),
      settings: this.settings,
      series: this.artists,
      focused: this.canvas.matches(":focus-visible"),
    };
  }
  /** @internal */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.destroy();
    this.canvas.removeEventListener("focus", this.redraw);
    this.canvas.removeEventListener("blur", this.redraw);
    this.artists.length = 0;
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
      options.pixelRatio ?? Math.min(win.devicePixelRatio || 1, 2),
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
  private snapshot(width: number, height: number): Scene {
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
      axes: this.axes.map((ax) => ax.snapshot()),
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
      this.snapshot(width, height),
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
