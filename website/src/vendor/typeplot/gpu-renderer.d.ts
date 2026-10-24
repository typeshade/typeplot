import type { AxesOptions, SeriesOptions, SeriesKind, SeriesData } from "./data.js";
import type { FieldStyle, FieldKind } from "./field.js";
import type { Annotation } from "./annotation.js";
export type Backend = "webgpu" | "webgl2";
export interface RenderSeries {
    readonly kind: SeriesKind;
    readonly data: SeriesData;
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
    readonly fields: readonly RenderField[];
    readonly annotations: readonly Pick<Annotation, "value" | "position" | "target" | "options">[];
    readonly focused: boolean;
}
export interface RenderField {
    readonly values: readonly number[];
    readonly options: FieldStyle;
    readonly mode: FieldKind;
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
    private picking;
    private fieldPipeline;
    private fieldPicking;
    private colorBar;
    private annotationLine;
    private glyphs;
    private device?;
    private samples;
    private fields;
    private destroyed;
    private readonly completion;
    private constructor();
    get backend(): Backend;
    static create(canvas: HTMLCanvasElement, backend?: "auto" | Backend): Promise<GpuRenderer>;
    private initialize;
    private uniform;
    /** Input data stays resident. Camera changes update uniforms, not path geometry. */
    private sampleResource;
    private release;
    private prune;
    private fieldResource;
    private drawField;
    private drawSeries;
    pick(scene: Scene, axesIndex: number, position: readonly [number, number], radius: number): Promise<{
        series: number;
        index: number;
    } | null>;
    private scene;
    render(scene: Scene, ratio: number): Promise<void>;
    pixels(scene: Scene, ratio: number): Promise<{
        bytes: Uint8Array;
        width: number;
        height: number;
    }>;
    destroy(): void;
}
