import type { PlotKind, PlotProgram } from "./types.js";
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
}
export interface PlotDiagnostic {
    readonly fileName?: string;
    readonly line: number;
    readonly character: number;
    readonly message: string;
    readonly code?: string;
}
export declare class PlotCompileError extends Error {
    readonly diagnostics: readonly PlotDiagnostic[];
    constructor(diagnostics: readonly PlotDiagnostic[]);
}
/** Compile a named TypeShade callback once, on the build machine. */
export declare function compilePlot(source: string, options?: CompilePlotOptions): PlotProgram;
export type { PlotProgram, PlotKind } from "./types.js";
