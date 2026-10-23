import { type RenderAxes } from "./gpu-renderer.js";
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
export interface QuickPlotOptions extends FigureOptions, SeriesOptions, AxesOptions {
}
export interface SaveFigureOptions {
    /** Output pixels per CSS pixel. Defaults to the figure display density. */
    readonly pixelRatio?: number;
}
type Pair = [number, number];
type Kind = "line" | "scatter" | "bar";
type Style = Required<SeriesOptions> & {
    width: number;
};
/** An independently updateable artist. NaN/Infinity split lines and are omitted from bounds. */
export declare class Series {
    readonly axes: Axes;
    readonly kind: Kind;
    /** @internal */
    data: {
        x: number[];
        y: number[];
    };
    /** @internal */
    readonly style: Style;
    /** @internal Histogram edges, when applicable. */
    edges?: readonly number[];
    private removed;
    /** @internal */
    constructor(axes: Axes, kind: Kind, data: {
        x: number[];
        y: number[];
    }, options: SeriesOptions & {
        width?: number;
    }, index: number);
    setData(y: NumericData): this;
    setData(x: NumericData, y: NumericData): this;
    remove(): void;
    /** @internal */
    detach(): void;
}
/** One subplot, with independent limits, labels, color cycle and interaction. */
export declare class Axes {
    readonly figure: Figure;
    readonly index: number;
    readonly canvas: HTMLCanvasElement;
    private readonly controller;
    private readonly artists;
    private settings;
    private colorIndex;
    private disposed;
    /** @internal */
    constructor(figure: Figure, index: number);
    /** @internal */
    assertAlive(): void;
    plot(y: NumericData, options?: SeriesOptions): Series;
    plot(x: NumericData, y: NumericData | ((x: number) => number), options?: SeriesOptions): Series;
    scatter(x: NumericData, y: NumericData, options?: SeriesOptions): Series;
    bar(x: NumericData, height: NumericData, options?: BarOptions): Series;
    histogram(values: NumericData, options?: HistogramOptions): {
        counts: readonly number[];
        bins: readonly number[];
        series: Series;
    };
    private add;
    /** Set multiple properties in one call. Fixed limits persist as data is added. */
    set(options: AxesOptions): this;
    setTitle(value: string): this;
    setXLabel(value: string): this;
    setYLabel(value: string): this;
    setXLimits(min: number, max: number): this;
    setYLimits(min: number, max: number): this;
    setXScale(value: AxisScale): this;
    setYScale(value: AxisScale): this;
    grid(visible?: boolean): this;
    legend(visible?: boolean): this;
    /** Restore automatic limits for both axes. */
    autoscale(): this;
    clear(): this;
    reset(): this;
    bounds(): {
        x: Pair;
        y: Pair;
    };
    /** @internal */
    removeSeries(series: Series): void;
    /** @internal */
    refresh(): void;
    private updateLabel;
    readonly redraw: () => void;
    /** @internal GPU input only; axes/grid/ticks/glyphs are generated by the shaders. */
    snapshot(): RenderAxes;
    /** @internal */
    destroy(): void;
}
/** Owns the DOM, subplots, resize observer and export lifecycle. */
export declare class Figure {
    readonly element: HTMLDivElement;
    readonly axes: readonly Axes[];
    readonly options: FigureOptions;
    readonly pixelRatio: number;
    private readonly observer?;
    private readonly win;
    private disposed;
    private readonly rows;
    private readonly cols;
    private readonly surface;
    private readonly stage;
    private renderer?;
    private frame;
    private dirty;
    private drawing;
    /** Resolves after backend initialization and the first complete TypeShade frame. */
    readonly ready: Promise<void>;
    get backend(): "webgpu" | "webgl2" | undefined;
    private report;
    /** @internal Use figure() or subplots(). */
    constructor(rows: number, cols: number, options?: FigureOptions);
    readonly redraw: () => void;
    private snapshot;
    private paint;
    /** Redraw all subplots through TypeShade and encode read-back GPU pixels as PNG. */
    toBlob(options?: SaveFigureOptions): Promise<Blob>;
    saveImage(filename?: string, options?: SaveFigureOptions): Promise<void>;
    destroy(): void;
}
/** Create a single-axes figure without global current-figure state. */
export declare function figure(options?: FigureOptions): Figure;
/** Axes are always a flat row-major array, including the 1 × 1 case. */
export declare function subplots(rows?: number, cols?: number, options?: FigureOptions): {
    fig: Figure;
    axes: readonly Axes[];
};
/** Evenly spaced values including both endpoints by default. */
export declare function linspace(start: number, stop: number, count?: number): Float64Array;
export declare function plot(y: NumericData, options?: QuickPlotOptions): Figure;
export declare function plot(x: NumericData, y: NumericData | ((x: number) => number), options?: QuickPlotOptions): Figure;
export {};
