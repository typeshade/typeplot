import type { Figure, NumericData, QuickPlotOptions } from "./data.js";
import type { Plot, PlotOptions, PlotProgram } from "./types.js";
export { createPlot } from "./procedural-plot.js";
export { Timeline, ValueTracker, tween, sequence, parallel, wait, ease, } from "./animation.js";
export type { AnimationClip, AnimationOptions, TimelineOptions, TweenOptions, Easing, AnimationState, } from "./animation.js";
export { identityMatrix, multiplyMatrices, translationMatrix, scaleMatrix, rotationMatrix, } from "./transform.js";
export type { Matrix4 } from "./transform.js";
export { createSurface } from "./grid-surface.js";
export { preloadFonts } from "./resources.js";
export type { GridSurface, GridSurfaceOptions } from "./grid-surface.js";
export { ViewControl } from "./controls.js";
export type { PlotControl, ControlPosition } from "./controls.js";
export { figure, subplots, linspace, Figure, Axes, Series, Field, Annotation, } from "./data.js";
export type { NumericData, AxisScale, AxisLimits, SeriesOptions, BarOptions, HistogramOptions, AxesOptions, FigureOptions, QuickPlotOptions, SaveFigureOptions, ErrorBarOptions, ErrorValues, DataPick, FieldOptions, FieldStyle, FieldKind, AnnotationOptions, AnnotateOptions, } from "./data.js";
export type { Plot, PlotBounds, PlotKind, PlotOptions, PlotProgram, PlotProjection, PlotStyle, PlotQuality, PlotCamera, PlotCameraUpdate, PlotTransition, PlotPick, PickEvent, ColorMap, SurfaceOptions, SurfaceDomain, SavePlotOptions, } from "./types.js";
/** Plot data directly, or mount a compiled GPU program using the original canvas form. */
export declare function plot(canvas: HTMLCanvasElement, program: PlotProgram, options?: PlotOptions): Promise<Plot>;
export declare function plot(y: NumericData, options?: QuickPlotOptions): Figure;
export declare function plot(x: NumericData, y: NumericData | ((x: number) => number), options?: QuickPlotOptions): Figure;
