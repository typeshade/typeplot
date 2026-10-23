import type { Runtime, Texture } from "typeshade/runtime";
/** Upload the offline SDF resource; all glyph reconstruction runs in TypeShade. */
export declare function loadGlyphAtlas(runtime: Runtime): Promise<Texture>;
