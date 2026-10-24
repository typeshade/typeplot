import type { Runtime, Texture } from "typeshade/runtime";
/** Start I/O before choosing a backend; it owns no decoded image or GPU object. */
export declare function prepareGlyphAtlas(full?: boolean): Promise<Blob>;
/** Upload the offline SDF resource; all glyph reconstruction runs in TypeShade. */
export declare function loadGlyphAtlas(runtime: Runtime, full?: boolean, target?: Texture, active?: () => boolean, prepared?: Promise<Blob>): Promise<Texture>;
