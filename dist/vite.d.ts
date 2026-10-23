import type { Plugin } from "vite";
import { type CompilePlotOptions } from "./compiler.js";
export interface TypePlotPluginOptions {
    /** Per-file callback settings, such as scalar parameter defaults. */
    readonly configure?: (fileName: string) => CompilePlotOptions;
}
/** Import curve.shade.ts?plot (scalar) or helix.shade.ts?plot=3d (parametric). */
export declare function typeplot(options?: TypePlotPluginOptions): Plugin;
