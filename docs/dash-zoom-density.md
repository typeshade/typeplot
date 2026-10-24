# Dash scale and the X-GIS line renderer

Reference snapshot: X-GIS/X-GIS `221e9ec4c7c72538effe7a5cf726d859a95c7248`:

- [Line renderer overview](https://github.com/X-GIS/X-GIS/blob/221e9ec4c7c72538effe7a5cf726d859a95c7248/docs/tech/dev/04-line-rendering.md)
- [Pattern and unit packing](https://github.com/X-GIS/X-GIS/blob/221e9ec4c7c72538effe7a5cf726d859a95c7248/map/src/render/line-pattern.ts)
- [Line shader](https://github.com/X-GIS/X-GIS/blob/221e9ec4c7c72538effe7a5cf726d859a95c7248/map/src/shaders/dsl/line.ts)

X-GIS separates pattern coordinates, a single meters-per-pixel scale authority, CSS stroke
width and device-pixel AA. The fragment shader evaluates periodic phase; cap/join handling
and pattern extent determine coverage independently. Its cumulative f64 arc coordinate
serves GIS dashes/patterns/gradients. TypePlot keeps the owner's chosen curve-parameter
coordinate, with no cumulative arc preprocessing; the transferable principle is explicit
unit conversion and a stable phase origin, not copying that arc representation.

The TypePlot automatic period previously used max(0, ceil(log2(target/base))). That only
allowed coarser density than the initial domain/60. At deep zoom, one on-band filled the
visible range and the cosine looked solid. Signed levels now refine as well as coarsen,
keeping automatic projected x-periods near the target CSS range in linear viewports. The same periodic capsule
SDF supplies rounded ends and one half-device-pixel AA band. The shader selects nearby
cycles per fragment, so a single data interval can contain many dashes without scanning
the full path, creating dash geometry, or uploading samples on camera changes.

Log-x conversion uses the visible source interval rather than a distant dataset maximum.
For ordered positive-x samples, a binary lookup measures that interval's parameter/log-x
secant. This matches the actual projected interpolation, including sparse samples, rather
than substituting the analytic derivative of x at the viewport center.
Solid series skip density work. Explicit dashPeriod still fixes a period in parameter
units; magnifying a fixed authored period can legitimately show a single on/off interval.
Automatic density changes only at power-of-two transitions and preserves its phase origin.
Index-coordinate density retains the existing projected data-envelope estimate, so actual
screen lengths depend on the parameterization, slope and projection.
