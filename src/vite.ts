import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { compilePlot, type CompilePlotOptions } from "./compiler.js";

export interface TypePlotPluginOptions {
  /** Per-file callback settings, such as scalar parameter defaults. */
  readonly configure?: (fileName: string) => CompilePlotOptions;
}
/** Import curve.shade.ts?plot (scalar) or helix.shade.ts?plot=3d (parametric). */
export function typeplot(options: TypePlotPluginOptions = {}): Plugin {
  return {
    name: "typeplot",
    enforce: "pre",
    load(id) {
      const index = id.indexOf("?");
      if (index < 0) return null;
      const query = new URLSearchParams(id.slice(index + 1));
      if (!query.has("plot")) return null;
      const fileName = id.slice(0, index);
      if (!fileName.endsWith(".shade.ts"))
        throw new TypeError("TypePlot imports require a .shade.ts file.");
      const mode = query.get("plot");
      if (
        mode &&
        !["2d", "3d", "scalar", "parametric", "surface"].includes(mode)
      )
        throw new TypeError(`Unknown plot kind: ${mode}`);
      const configured = options.configure?.(fileName) ?? {};
      this.addWatchFile(fileName);
      const readDocument = (name: string): string | undefined => {
        const supplied = configured.readDocument?.(name);
        if (supplied !== undefined) {
          this.addWatchFile(name);
          return supplied;
        }
        try {
          const source = readFileSync(name, "utf8");
          this.addWatchFile(name);
          return source;
        } catch {
          return undefined;
        }
      };
      const kind =
        mode === "surface"
          ? "surface"
          : mode === "3d" || mode === "parametric"
            ? "parametric"
            : mode === "2d" || mode === "scalar"
              ? "scalar"
              : (configured.kind ?? "scalar");
      const program = compilePlot(readFileSync(fileName, "utf8"), {
        ...configured,
        fileName,
        kind,
        readDocument,
      });
      return { code: `export default ${JSON.stringify(program)};`, map: null };
    },
  };
}
