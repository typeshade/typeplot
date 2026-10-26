import type { PlotKind } from "./types.js";
export interface CompilePlotOptions {
    readonly entry?: string;
    readonly kind?: PlotKind;
    readonly fileName?: string;
    /** Additional imported shader files, relative to fileName. */
    readonly files?: Readonly<Record<string, string>>;
    readonly readDocument?: (fileName: string) => string | undefined;
    /** Extra f32 arguments to the callback, in declaration order. */
    readonly parameters?: Readonly<Record<string, number>>;
    readonly discontinuous?: boolean;
    /** Parametric callback takes (localParameter, preparedOrigin, ...parameters).
     * The named prepare function takes (f64 origin, ...parameters) and returns vec4. */
    readonly parameterOrigin?: {
        readonly axis: "x" | "y" | "z";
        readonly scale: number;
        readonly prepare: string;
    };
}
/** The TypeShade documents of one plot program, before compilation. compilePlot
 * and scripts/coverage-check.ts both compile exactly this text. */
export interface PlotSource {
    readonly kind: PlotKind;
    readonly parameters: Record<string, number>;
    readonly parameterOrigin?: CompilePlotOptions["parameterOrigin"];
    readonly userFile: string;
    readonly wrapperFile: string;
    readonly wrapper: string;
    readonly readDocument: (fileName: string) => string | undefined;
}
export declare function plotSource(source: string, options?: CompilePlotOptions): PlotSource;
