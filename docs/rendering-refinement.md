# Rendering refinements

The dashed data renderer needs continuous projected path length rather than a separate
screen-origin projection for each segment. Compute a segmented prefix sum in TypeShade,
using fixed CSS-pixel dash periods and resetting at missing data. Keep preprocessing on the
GPU and preserve the same rendering path for screen output and PNG export.

Spatial grids must use world-coordinate tick multiples projected with the curve camera.
The current fixed subdivision of the viewport cancels camera zoom. Numeric tick labels
must share the grid coordinates, with readable spacing in both projection modes.

Replace the small coverage font atlas with a signed distance field, reconstructed and
antialiased in TypeShade. Share the font resource between data and GPU function plots.
