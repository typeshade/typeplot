import { createPlot } from "./procedural-plot.js";
import { plot as plotData } from "./data.js";
import type { Figure, NumericData, QuickPlotOptions } from "./data.js";
import type { Plot, PlotOptions, PlotProgram } from "./types.js";
export { PlotScene, SceneNode, SceneGroup } from "./scene.js";
export type { SceneTransition } from "./scene.js";
export { createPlot } from "./procedural-plot.js";
export {
  Timeline,
  ValueTracker,
  tween,
  sequence,
  parallel,
  wait,
  ease,
} from "./animation.js";
export type {
  AnimationClip,
  AnimationOptions,
  TimelineOptions,
  TweenOptions,
  Easing,
  AnimationState,
} from "./animation.js";
export {
  identityMatrix,
  multiplyMatrices,
  translationMatrix,
  scaleMatrix,
  rotationMatrix,
} from "./transform.js";
export type { Matrix4 } from "./transform.js";
export { createSurface } from "./grid-surface.js";
export { preloadFonts } from "./resources.js";
export type { GridSurface, GridSurfaceOptions } from "./grid-surface.js";
export { ViewControl } from "./controls.js";
export type { PlotControl, ControlPosition } from "./controls.js";
export {
  figure,
  subplots,
  linspace,
  Figure,
  Axes,
  Series,
  Field,
  Annotation,
} from "./data.js";
export type {
  NumericData,
  AxisScale,
  AxisLimits,
  SeriesOptions,
  BarOptions,
  HistogramOptions,
  AxesOptions,
  FigureOptions,
  QuickPlotOptions,
  SaveFigureOptions,
  ErrorBarOptions,
  ErrorValues,
  DataPick,
  FieldOptions,
  FieldStyle,
  FieldKind,
  AnnotationOptions,
  AnnotateOptions,
} from "./data.js";
export type {
  Plot,
  PlotBounds,
  PlotKind,
  PlotOptions,
  PlotProgram,
  PlotProjection,
  PlotStyle,
  PlotQuality,
  PlotCamera,
  PlotCameraUpdate,
  PlotTransition,
  PlotPick,
  PickEvent,
  ColorMap,
  SurfaceOptions,
  SurfaceDomain,
  SavePlotOptions,
} from "./types.js";

/** Plot data directly, or mount a compiled GPU program using the original canvas form. */
export function plot(
  canvas: HTMLCanvasElement,
  program: PlotProgram,
  options?: PlotOptions,
): Promise<Plot>;
export function plot(y: NumericData, options?: QuickPlotOptions): Figure;
export function plot(
  x: NumericData,
  y: NumericData | ((x: number) => number),
  options?: QuickPlotOptions,
): Figure;
export function plot(
  target: HTMLCanvasElement | NumericData,
  dataOrOptions?:
    PlotProgram | NumericData | ((x: number) => number) | QuickPlotOptions,
  options?: PlotOptions | QuickPlotOptions,
): Promise<Plot> | Figure {
  if (
    target &&
    typeof (target as HTMLCanvasElement).getContext === "function"
  ) {
    return createPlot(
      target as HTMLCanvasElement,
      dataOrOptions as PlotProgram,
      options as PlotOptions,
    );
  }
  if (
    typeof dataOrOptions === "function" ||
    (dataOrOptions && "length" in dataOrOptions)
  ) {
    return plotData(
      target as NumericData,
      dataOrOptions as NumericData | ((x: number) => number),
      options as QuickPlotOptions,
    );
  }
  return plotData(target as NumericData, dataOrOptions as QuickPlotOptions);
}
