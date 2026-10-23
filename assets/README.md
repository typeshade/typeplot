# TypePlot signed distance glyphs

`typeplot-font.png` contains prebuilt IBM Plex Mono / IBM Plex Sans KR signed distance glyphs for
TypeShade text shaders. It is font input data, not a host-rendered plot overlay. Browser code
only decodes and uploads this asset; glyph positioning, distance reconstruction, pixel-footprint antialiasing and blending run in
`shaders/font.shade.ts` and `shaders/data.shade.ts`. Missing glyphs use the replacement glyph.

The source fonts are the self-hosted TypeNN-family fonts in website/public/fonts/. To rebuild
with Python, Pillow, fontTools, Brotli, NumPy and SciPy installed, run `python3 scripts/build-font.py`.
The normal npm build uses the committed asset and needs no Python dependency.
See LICENSE-IBM-Plex.txt for the SIL Open Font License.
