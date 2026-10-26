import { type CompilePlotOptions } from "./plot-source.js";
import type { PlotProgram } from "./types.js";
export type { CompilePlotOptions } from "./plot-source.js";
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
