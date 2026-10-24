import { prepareGlyphAtlas } from "./font.js";

/** Start cacheable font downloads without allocating a device, image or texture. */
export async function preloadFonts(
  options: { readonly korean?: boolean } = {},
): Promise<void> {
  await Promise.all([
    prepareGlyphAtlas(),
    ...(options.korean ? [prepareGlyphAtlas(true)] : []),
  ]);
}
