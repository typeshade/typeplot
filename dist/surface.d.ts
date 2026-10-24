import type { PlotCamera, PlotCameraUpdate, SurfaceDomain, SurfaceOptions } from "./types.js";
export declare const DEFAULT_SURFACE: Required<SurfaceOptions>;
export declare const COLOR_MAPS: readonly ["viridis", "plasma", "coolwarm", "gray"];
export declare function surfaceOptions(value: SurfaceOptions, previous?: Required<SurfaceOptions>): Required<SurfaceOptions>;
export declare function surfaceDomain(value: SurfaceDomain): SurfaceDomain;
export declare function surfaceUniforms(style: Required<SurfaceOptions>, domain: SurfaceDomain): {
    surfaceBounds: number[];
    surfaceDomainMode: number;
    surfaceRange: readonly [number, number];
    surfaceDepth: readonly [number, number];
    surfaceRender: number[];
    surfaceFlags: number;
};
export declare function cameraUpdate(value: PlotCameraUpdate, previous: PlotCamera): PlotCamera;
