import type { PlotControl, ControlPosition } from "./controls.js";
export type PlotKind = "scalar" | "parametric";
export type PlotProjection = "perspective" | "orthographic";
export interface PlotBounds {
    readonly x: readonly [number, number];
    readonly y: readonly [number, number];
}
/** Serializable build output. The TypeShade manifest is opaque to callers. */
export interface PlotProgram {
    readonly version: 1;
    readonly kind: PlotKind;
    readonly manifest: unknown;
    readonly parameters: Readonly<Record<string, number>>;
    /** Programs compiled with the projective camera support both projection modes. */
    readonly camera?: "projective";
}
/** Numerical search controls for arbitrary spatial callbacks, evaluated on the GPU. */
export interface PlotQuality {
    /** Parameter search intervals, 16–512. Default 128. */
    readonly samples?: number;
    /** Closest-point iterations, 1–8. Default 5. */
    readonly refinements?: number;
}
/** CSS-pixel widths and shader decorations, independent of zoom and display density. */
export interface PlotStyle {
    /** Axis and tick width. Default 1 CSS px; zero hides the strokes. */
    readonly axisWidth?: number;
    /** Grid stroke width. Default 1 CSS px. */
    readonly gridWidth?: number;
    /** Function/trajectory stroke width. Default 2 CSS px. */
    readonly curveWidth?: number;
    readonly lineStyle?: "-" | "--" | ":";
    /** Dash period in callback parameter units. Default 0.2. */
    readonly dashPeriod?: number;
    readonly dashOffset?: number;
    /** Numeric tick and axis label size. Default 11 CSS px. */
    readonly labelSize?: number;
    /** Relative tick density, 0.25–4. Default 1. */
    readonly tickDensity?: number;
    /** SDF label halo width in CSS pixels, 0–2. Default 0.8. */
    readonly labelHalo?: number;
    /** Rounded label plates. Default false; halo remains enabled. */
    readonly labelBackground?: boolean;
    readonly grid?: boolean;
    readonly tickLabels?: boolean;
    readonly axisLabels?: boolean;
}
export interface PlotOptions {
    /** Released-drag inertia. Default true; disabled by reduced-motion preferences. */
    readonly inertia?: boolean;
    /** Double-click restores the home camera. Default true. */
    readonly doubleClickReset?: boolean;
    /** Accessible canvas name. Existing aria-label/aria-labelledby are preserved unless supplied. */
    readonly label?: string;
    readonly bounds?: PlotBounds;
    /** Spatial callback mathematical domain; defaults to [-Infinity, Infinity].
     * Unbounded curves use compactified numerical search; quality still limits resolved detail.
     * Scalar functions are evaluated over the entire visible plane instead. */
    readonly domain?: readonly [number, number];
    readonly quality?: PlotQuality;
    readonly backend?: "auto" | "webgpu" | "webgl2";
    readonly mode?: "2d" | "3d";
    readonly projection?: PlotProjection;
    readonly style?: PlotStyle;
    readonly probe?: number;
    readonly parameters?: Readonly<Record<string, number>>;
    readonly pixelRatio?: number;
    readonly interactive?: boolean;
    readonly onError?: (error: Error) => void;
}
export interface Plot {
    readonly kind: PlotKind;
    getMode(): "2d" | "3d";
    getProjection(): PlotProjection;
    getContainer(): HTMLElement;
    addControl(control: PlotControl, position?: ControlPosition): Plot;
    removeControl(control: PlotControl): Plot;
    /** Restore only the home camera, preserving data, parameters and style. */
    resetView(): void;
    readonly backend: "webgpu" | "webgl2";
    readonly projection: PlotProjection;
    setMode(mode: "2d" | "3d"): void;
    setProjection(projection: PlotProjection): void;
    setStyle(style: PlotStyle): void;
    /** Accepts finite or infinite endpoints. Scalar fields need no domain. */
    setDomain(domain: readonly [number, number]): void;
    domain(): readonly [number, number];
    setQuality(quality: PlotQuality): void;
    setProbe(value: number): void;
    setParameters(values: Readonly<Record<string, number>>): void;
    bounds(): PlotBounds;
    reset(): void;
    redraw(): Promise<void>;
    destroy(): void;
}
