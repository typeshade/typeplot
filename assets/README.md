# TypePlot signed distance glyphs

`typeplot-font.png` contains prebuilt IBM Plex Mono / IBM Plex Sans KR glyphs encoded by
X-GIS's original `computeSDF`. It uses continuous alpha seeding, a radius of 8 source
pixels at the 24px reference and edge byte 192. ASCII also has native hinted 12px /
48px buckets with proportional radius 4 / 16, selected by physical display size. The TypeShade sampler follows X-GIS's fill threshold 0.75 and
analytic antialiasing half-width `max(2.52 / physicalFontSize, 1 / 255)`.

The generator is vendored from X-GIS/X-GIS at
`221e9ec4c7c72538effe7a5cf726d859a95c7248`,
`map/src/text/sdf/distance-transform.ts`. The sampling conventions come from
`map/src/shaders/dsl/text.ts` at that commit. See LICENSE-XGIS.txt for its MIT License.

Native FreeType rasterization preserves hinting; no alpha resampling introduces ringing
before the distance transform. Font input is rasterized offline. Browser code only decodes and uploads this resource;
glyph positioning, distance reconstruction and blending run in `shaders/font.shade.ts`
and `shaders/data.shade.ts`. Missing codepoints use the replacement glyph. Numeric layout
separates atlas bearing from advance and evaluates adjacent padded cells, preserving the
complete outline and antialiasing falloff of 0 at character boundaries.

The source fonts are the self-hosted TypeNN-family fonts in website/public/fonts/.
To rebuild with Node 24, Python, Pillow, fontTools and Brotli installed, run
`python3 scripts/build-font.py`. The adapter invokes the original TypeScript generator
only during this offline rebuild. Normal npm builds use the committed asset.
See LICENSE-IBM-Plex.txt for the fonts' SIL Open Font License.
