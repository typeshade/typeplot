import type { Axes } from "./data.js";
export interface AnnotationOptions {
    readonly color?: string;
    readonly fontSize?: number;
    readonly alpha?: number;
    readonly align?: "left" | "center" | "right";
    /** Counterclockwise rotation, in radians. */
    readonly rotation?: number;
    readonly offset?: readonly [number, number];
    readonly arrow?: boolean;
    readonly lineWidth?: number;
    readonly headSize?: number;
}
export interface AnnotateOptions extends AnnotationOptions {
    readonly xyText?: readonly [number, number];
}
/** Text and arrows are shader-generated; anchors stay in data coordinates. */
export declare class Annotation {
    readonly axes: Axes;
    /** @internal */
    position: [number, number];
    /** @internal */
    readonly target: [number, number];
    /** @internal */
    value: string;
    /** @internal */
    options: Required<AnnotationOptions>;
    private removed;
    /** @internal */
    constructor(axes: Axes, value: string, at: readonly [number, number], options?: AnnotationOptions, target?: readonly [number, number]);
    private alive;
    setText(value: string): this;
    setPosition(position: readonly [number, number]): this;
    set(options: AnnotationOptions): this;
    remove(): void;
    /** @internal */
    detach(): void;
}
