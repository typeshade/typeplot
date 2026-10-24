import type { PlotControl, ControlPosition } from "./controls.js";
import type { AnimationClip, AnimationOptions, Timeline, TimelineOptions, TweenOptions } from "./animation.js";
import type { SceneNode, PlotScene, SceneObjectSpec } from "./scene.js";
import type { Matrix4 } from "./transform.js";
export type PlotKind = "scalar" | "parametric" | "surface";
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
    /** Independent coordinate-frame and content transforms in newly compiled programs. */
    readonly scene?: "transform-v1";
    /** Color/depth layer entries for multiple callbacks in one scene. */
    readonly composition?: "layers-v1";
    /** Local parameter windows with a GPU-prepared extended-precision origin. */
    readonly parameterOrigin?: {
        readonly axis: "x" | "y" | "z";
        readonly scale: number;
    };
    /** GPU-resident interval/tile search cache in newly compiled spatial programs. */
    readonly acceleration?: "tiles-v1" | "surface-v1";
    /** Image-driven GPU seed allocation with independent visibility exploration. */
    readonly curveSearch?: "adaptive-v1";
    /** Bit-preserving search and label caches; no float color attachment extension is needed. */
    readonly cacheFormat?: "uint-v1";
    /** One-query GPU picking entry points, available after recompilation. */
    readonly picking?: "point-v1";
}
export interface PlotCamera {
    readonly center: readonly [number, number];
    /** World-space z coordinate of the camera focus. */
    readonly z: number;
    readonly span: readonly [number, number];
    /** Yaw and pitch, in radians. */
    readonly rotation: readonly [number, number];
    readonly pan: readonly [number, number];
    /** Vertical field of view in radians; default PI / 4. */
    readonly fov: number;
    /** Camera distance in normalized scene units; default three. */
    readonly distance: number;
}
export type PlotCameraUpdate = Partial<PlotCamera>;
export type ColorMap = "viridis" | "plasma" | "coolwarm" | "gray";
export interface SurfaceOptions {
    readonly colorMap?: ColorMap;
    /** Color normalization only; it never clips surface geometry. */
    readonly valueRange?: readonly [number, number];
    /** Optional conservative physical height bounds for ray culling; independent of color normalization. */
    readonly heightRange?: readonly [number, number];
    readonly colorBar?: boolean;
    readonly shading?: boolean;
    readonly wireframe?: boolean;
    readonly contours?: boolean;
    readonly contourInterval?: number;
    readonly filled?: boolean;
    readonly opacity?: number;
    /** Finite ray-search window in normalized camera depth; default [0.101, 12]. */
    readonly depthRange?: readonly [number, number];
}
export interface SurfaceDomain {
    readonly x: readonly [number, number];
    readonly z: readonly [number, number];
}
export interface PlotTransition {
    readonly parameters?: Readonly<Record<string, number>>;
    readonly camera?: PlotCameraUpdate;
    readonly transform?: Matrix4;
}
export interface SavePlotOptions {
    readonly width?: number;
    readonly height?: number;
    readonly pixelRatio?: number;
}
export interface PlotPick {
    readonly kind: PlotKind;
    readonly objectId?: string;
    readonly object?: SceneNode;
    /** Local mathematical coordinates, before the scene transform. */
    readonly point: readonly [number, number, number];
    readonly parameter?: number;
    readonly distance: number;
}
export interface PickEvent<T> {
    readonly type: "hover" | "click";
    readonly result: T | null;
    /** CSS pixels from the canvas's top-left corner. */
    readonly position: readonly [number, number];
    readonly originalEvent: PointerEvent | MouseEvent;
}
/** Numerical search controls for arbitrary spatial callbacks, evaluated on the GPU. */
export interface PlotQuality {
    /** Initial search budget hint, 16–512. Adaptive programs enforce image-driven coverage. */
    readonly samples?: number;
    /** Legacy closest-point budget, 1–8. Adaptive programs refine to screen-space convergence. */
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
    /** Additional spatial callbacks, prepared together before the first frame. */
    readonly objects?: readonly SceneObjectSpec[];
    /** Resident read-only f32 arrays declared by the named TypeShade callback. */
    readonly data?: Readonly<Record<string, Float32Array>>;
    readonly camera?: PlotCameraUpdate;
    /** Invertible affine scene transform; shared by 3D plots, axes and lattice. */
    readonly transform?: Matrix4;
    readonly surface?: SurfaceOptions;
    /** Mathematical x/z surface domain. Default unbounded on both axes. */
    readonly surfaceDomain?: SurfaceDomain;
    /** GPU search acceleration when present in the program. Default true. */
    readonly acceleration?: boolean;
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
    /** Retained 3D axes/content hierarchy; older compiled programs require recompilation. */
    readonly scene: PlotScene;
    /** Shared render/lifecycle ownership for composed camera, function and scene clips. */
    timeline(options?: Omit<TimelineOptions, "render" | "window">): Timeline;
    readonly kind: PlotKind;
    getMode(): "2d" | "3d";
    supportsMode(mode: "2d" | "3d"): boolean;
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
    setData(name: string, values: Float32Array): void;
    parameters(): Readonly<Record<string, number>>;
    getCamera(): PlotCamera;
    /** Immediate camera update. Does not replace the reset/home view. */
    setCamera(camera: PlotCameraUpdate): void;
    getTransform(): Matrix4;
    setTransform(matrix: Matrix4): void;
    setSurface(options: SurfaceOptions): void;
    setSurfaceDomain(domain: SurfaceDomain): void;
    /** Captured endpoints, suitable for parallel/sequence clips on a Timeline. */
    transition(to: PlotTransition, options?: TweenOptions): AnimationClip;
    /** Play a camera/parameter/scene transition, with deterministic seek and pause. */
    animate(to: PlotTransition, options?: AnimationOptions): Timeline;
    pick(position: readonly [number, number], radius?: number): Promise<PlotPick | null>;
    on(type: "hover" | "click", listener: (event: PickEvent<PlotPick>) => void): Plot;
    off(type: "hover" | "click", listener: (event: PickEvent<PlotPick>) => void): Plot;
    toBlob(options?: SavePlotOptions): Promise<Blob>;
    saveImage(filename?: string, options?: SavePlotOptions): Promise<void>;
    bounds(): PlotBounds;
    reset(): void;
    redraw(): Promise<void>;
    destroy(): void;
}
