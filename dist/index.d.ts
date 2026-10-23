import type { Plot, PlotOptions, PlotProgram } from "./types.js";
export type { Plot, PlotBounds, PlotKind, PlotOptions, PlotProgram, } from "./types.js";
/** Mount a compiled TypeShade callback on a canvas. The browser entry contains no compiler. */
export declare function createPlot(canvas: HTMLCanvasElement, program: PlotProgram, options?: PlotOptions): Promise<Plot>;
/** Short form of createPlot. */
export declare const plot: typeof createPlot;
