import type { NumericData } from "./data.js";
import type { Plot, PlotOptions } from "./types.js";
export interface GridSurfaceOptions extends Omit<PlotOptions, "data" | "parameters"> {
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
/** A sampled height field uses the same implicit ray query and camera as GPU functions. */
export declare function createSurface(canvas: HTMLCanvasElement, values: NumericData, options: GridSurfaceOptions): Promise<GridSurface>;
