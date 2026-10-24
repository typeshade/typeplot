import type { FigureSnapshot as Scene } from "./render/snapshot.js";
export type Backend = "webgpu" | "webgl2";
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
    private fullGlyphs;
    private glyphUpgrade?;
    private program;
    private samples;
    private fields;
    private destroyed;
    private readonly session;
    private constructor();
    get backend(): Backend;
    static create(canvas: HTMLCanvasElement, backend?: "auto" | Backend): Promise<GpuRenderer>;
    private initialize;
    private pipeline;
    private prepareScene;
    private ensureGlyphs;
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
    private pickFrame;
    private scene;
    render(scene: Scene, ratio: number): Promise<void>;
    private renderFrame;
    pixels(scene: Scene, ratio: number): Promise<{
        bytes: Uint8Array;
        width: number;
        height: number;
    }>;
    private readPixels;
    destroy(): void;
}
