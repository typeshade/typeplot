import font from "../shaders/font.shade.ts?source";
import source from "../shaders/plot.shade.ts?source";
/** Source documents for hosts that already own a TypeShade compilation/runtime pipeline. */
export const plotShaderFiles: Readonly<Record<string, string>> = Object.freeze({
  "function-plot.shade.ts": source,
  "font.shade.ts": font,
});
