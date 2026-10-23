import type { AxesOptions, SeriesOptions } from "./data.js";
export type Backend = "webgpu" | "webgl2";
export interface RenderSeries {
    readonly kind: "line" | "scatter" | "bar";
    readonly data: {
        x: readonly number[];
        y: readonly number[];
    };
    readonly style: Required<SeriesOptions> & {
        width: number;
    };
    readonly edges?: readonly number[];
}
export interface RenderAxes {
    readonly bounds: {
        x: readonly [number, number];
        y: readonly [number, number];
    };
    readonly settings: AxesOptions;
    readonly gridOpacity: number;
    readonly series: readonly RenderSeries[];
    readonly focused: boolean;
}
export interface Scene {
    readonly width: number;
    readonly height: number;
    readonly rows: number;
    readonly cols: number;
    readonly title?: string;
    readonly titleHeight?: number;
    readonly background?: string;
    readonly axes: readonly RenderAxes[];
}
/** One runtime and glyph texture per figure; all visible geometry and text comes from TypeShade. */
export declare class GpuRenderer {
    private readonly canvas;
    private readonly runtime;
    private target;
    private readonly format;
    private axes;
    private series;
    private text;
    private labelPlate;
    private glyphs;
    private device?;
    private samples;
    private destroyed;
    private constructor();
    get backend(): Backend;
    static create(canvas: HTMLCanvasElement, backend?: "auto" | Backend): Promise<GpuRenderer>;
    private initialize;
    private uniform;
    /** Input data stays resident. Camera changes update uniforms, not path geometry. */
    private sampleResource;
    private release;
    private prune;
    private scene;
    render(scene: Scene, ratio: number): Promise<void>;
    pixels(scene: Scene, ratio: number): Promise<{
        bytes: Uint8Array;
        width: number;
        height: number;
    }>;
    destroy(): void;
}
