import type { Axes, NumericData } from "./data.js";
import type { ColorMap } from "./types.js";
export interface FieldOptions {
    /** Row-major values; shape is [rows, columns]. */
    readonly shape: readonly [number, number];
    /** [xMin, xMax, yMin, yMax], independent of camera limits. */
    readonly extent?: readonly [number, number, number, number];
    readonly colorMap?: ColorMap;
    readonly valueRange?: readonly [number, number];
    readonly interpolation?: "nearest" | "linear";
    readonly origin?: "lower" | "upper";
    readonly alpha?: number;
    readonly colorBar?: boolean;
    readonly levels?: number | NumericData;
    readonly lineWidth?: number;
    readonly visible?: boolean;
}
export interface FieldStyle {
    readonly shape: readonly [number, number];
    readonly extent: readonly [number, number, number, number];
    readonly valueRange: readonly [number, number];
    readonly colorMap: ColorMap;
    readonly interpolation: "nearest" | "linear";
    readonly origin: "lower" | "upper";
    readonly alpha: number;
    readonly colorBar: boolean;
    readonly levels: readonly number[];
    readonly lineWidth: number;
    readonly visible: boolean;
}
export type FieldKind = "image" | "contour" | "contourf";
/** Resident scalar observations, rendered as an image or GPU contour field. */
export declare class Field {
    readonly axes: Axes;
    readonly mode: FieldKind;
    /** @internal */
    values: number[];
    /** @internal */
    options: FieldStyle;
    private removed;
    private input;
    /** @internal Use ax.imshow(), contour() or contourf(). */
    constructor(axes: Axes, values: NumericData, options: FieldOptions, mode: FieldKind);
    private alive;
    setData(values: NumericData): this;
    set(options: Omit<Partial<FieldOptions>, "shape">): this;
    remove(): void;
    /** @internal */
    detach(): void;
}
