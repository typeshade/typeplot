import type { Plot, PlotOptions, PlotProgram } from "./types.js";
import type { Figure, NumericData, QuickPlotOptions } from "./data.js";
export { figure, subplots, linspace, Figure, Axes, Series } from "./data.js";
export type { NumericData, AxisScale, AxisLimits, SeriesOptions, BarOptions, HistogramOptions, AxesOptions, FigureOptions, QuickPlotOptions, SaveFigureOptions, } from "./data.js";
export type { Plot, PlotBounds, PlotKind, PlotOptions, PlotProgram, PlotProjection, PlotStyle, PlotQuality, } from "./types.js";
/** Mount a compiled TypeShade callback on a canvas. The browser entry contains no compiler. */
export declare function createPlot(canvas: HTMLCanvasElement, program: PlotProgram, options?: PlotOptions): Promise<Plot>;
/** Plot data directly, or mount a compiled GPU program using the original canvas form. */
export declare function plot(canvas: HTMLCanvasElement, program: PlotProgram, options?: PlotOptions): Promise<Plot>;
export declare function plot(y: NumericData, options?: QuickPlotOptions): Figure;
export declare function plot(x: NumericData, y: NumericData | ((x: number) => number), options?: QuickPlotOptions): Figure;
