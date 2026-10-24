import { type RenderAxes } from "./gpu-renderer.js";
import type { PickEvent } from "./types.js";
import { Field, type FieldOptions } from "./field.js";
import { Annotation, type AnnotationOptions, type AnnotateOptions } from "./annotation.js";
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
export type ErrorValues = number | NumericData | {
    readonly lower: number | NumericData;
    readonly upper: number | NumericData;
};
export interface ErrorBarOptions extends SeriesOptions {
    readonly xError?: ErrorValues;
    readonly yError?: ErrorValues;
}
export type SeriesKind = "line" | "scatter" | "bar" | "barh" | "step" | "stem" | "fill" | "error";
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
export interface QuickPlotOptions extends FigureOptions, SeriesOptions, AxesOptions {
}
export interface SaveFigureOptions {
    /** Output pixels per CSS pixel. Defaults to the figure display density. */
    readonly pixelRatio?: number;
}
type Pair = [number, number];
type Kind = SeriesKind;
type Style = Required<SeriesOptions> & {
    width: number;
};
/** An independently updateable artist. NaN/Infinity split lines and are omitted from bounds. */
export declare class Series {
    readonly axes: Axes;
    readonly kind: Kind;
    /** @internal */
    data: SeriesData;
    /** @internal */
    readonly style: Style;
    /** @internal Histogram edges, when applicable. */
    edges?: readonly number[];
    private removed;
    /** @internal */
    constructor(axes: Axes, kind: Kind, data: SeriesData, options: SeriesOptions & {
        width?: number;
    }, index: number);
    setData(y: NumericData): this;
    setData(x: NumericData, y: NumericData): this;
    setBandData(x: NumericData, first: NumericData, second?: NumericData | number): this;
    setStyle(value: SeriesOptions): this;
    setVisible(value: boolean): this;
    setAlpha(value: number): this;
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
    private readonly fields;
    private readonly annotations;
    private settings;
    private readonly gridFade;
    private fadeFrame;
    private htmlLegend?;
    private legendSignature;
    private colorIndex;
    private disposed;
    private readonly picker;
    /** @internal */
    constructor(figure: Figure, index: number);
    /** @internal */
    assertAlive(): void;
    plot(y: NumericData, options?: SeriesOptions): Series;
    plot(x: NumericData, y: NumericData | ((x: number) => number), options?: SeriesOptions): Series;
    scatter(x: NumericData, y: NumericData, options?: SeriesOptions): Series;
    bar(x: NumericData, height: NumericData, options?: BarOptions): Series;
    barh(y: NumericData, widths: NumericData, options?: BarOptions): Series;
    step(x: NumericData, y: NumericData, options?: SeriesOptions): Series;
    stem(x: NumericData, y: NumericData, options?: SeriesOptions): Series;
    fillBetween(x: NumericData, first: NumericData, second?: NumericData | number, options?: SeriesOptions): Series;
    errorbar(x: NumericData, y: NumericData, options?: ErrorBarOptions): Series;
    imshow(values: NumericData, options: FieldOptions): Field;
    text(x: number, y: number, value: string, options?: AnnotationOptions): Annotation;
    annotate(value: string, xy: readonly [number, number], options?: AnnotateOptions): Annotation;
    /** @internal */
    removeAnnotation(annotation: Annotation): void;
    contour(values: NumericData, options: FieldOptions): Field;
    contourf(values: NumericData, options: FieldOptions): Field;
    private addField;
    colorbar(field: Field, visible?: boolean): this;
    /** @internal */
    removeField(field: Field): void;
    pick(position: readonly [number, number], radius?: number): Promise<DataPick | null>;
    on(type: "hover" | "click", listener: (event: PickEvent<DataPick>) => void): this;
    off(type: "hover" | "click", listener: (event: PickEvent<DataPick>) => void): this;
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
    legend(visible?: boolean | "html"): this;
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
    /** @internal */
    presentationChanged(): void;
    private updateHtmlLegend;
    /** @internal GPU input only; axes/grid/ticks/glyphs are generated by the shaders. */
    snapshot(settled?: boolean): RenderAxes;
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
    /** @internal */
    reportError(error: unknown): void;
    /** @internal */
    pickAxes(index: number, position: readonly [number, number], radius: number): Promise<{
        artist: Series | Field;
        data: SeriesData | number[];
        index: number;
    } | null>;
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
