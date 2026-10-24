import type { Matrix4 } from "../transform.js";
import type { PlotProgram } from "../types.js";
import type { UniformValues } from "./scene-field.js";
export interface RelativeFrame {
    model: Matrix4;
    inverse: Matrix4;
    base: number;
    shift: readonly number[];
}
/** All origin subtraction happens in host double precision before uniform packing. */
export declare function relativeFrame(transform: Matrix4, camera: UniformValues, origin: PlotProgram["parameterOrigin"]): RelativeFrame;
export declare function logicalPoint(point: readonly number[], origin: PlotProgram["parameterOrigin"], base: number): readonly [number, number, number];
