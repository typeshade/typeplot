# Adaptive visibility and surface search

TypeShade compiles callbacks to portable WGSL/GLSL and pipeline manifests at build time.
The browser's driver still prepares native GPU pipelines. Camera changes and animation
also need new intersections, distance fields, lighting and antialiasing; the build does
not pre-render those views.

## Curves

Newly compiled programs declare `curveSearch: "adaptive-v1"`. Their search budget is a hint,
not a fixed subdivision of the entire parameter domain. A viewport-dependent minimum drives
GPU allocation, and two partitions cover the same domain: one follows projected work, while
the other preserves exploration across compactified parameter space. This retains folds that
leave and re-enter the view. A separate pass caches parameter seeds before preparing bounds.
New programs start with a budget hint of 64; existing manifests retain their original default.

The resident cache contains numerical search records, not a renderable path. Tile bitsets
and a mask of active groups reject irrelevant records. Display, scene depth and radius-based
picking traverse those records; actual callback evaluations supply the final closest point
and SDF coverage. Refinement stops at subpixel stability, with a finite safeguard. Parameter
dashes, RTC origins and PNG exports retain their existing coordinate contracts.

`cacheFormat: "uint-v1"` stores exact float bits in integer textures, including numeric label
records. Both WebGPU and core WebGL2 can render these targets without a floating-point color
attachment extension. Recompile callbacks with the matching compiler/runtime to enable the
new cache. Older manifests retain their original binding formats. The explicit unaccelerated
reference path remains available for diagnostics and retains its authored search budgets.

Finite searches and sampled bounds cannot certify every branch of an arbitrary callback.
The adaptive allocator resolves the reviewed helix views independently of low budget choices;
it does not claim an exact global inverse for all mathematical functions.

## Surfaces

Height fields still evaluate their actual function. Optional physical height bounds clip
empty ray intervals before callback evaluation and preserve the original search step across
the shortened interval:

```ts
const plot = await createPlot(canvas, surface, {
  surfaceDomain: { x: [-4, 4], z: [-4, 4] },
  surface: {
    heightRange: [-1, 1], // Conservative bound for sin(x) * cos(z).
    valueRange: [-0.25, 0.25], // Color normalization, independent of geometry.
  },
});
```

Omitting `heightRange` leaves the height direction unbounded. A supplied range must contain
the function throughout parameter animation; update it when changing an amplitude or offset.
Equal endpoints support a flat field. One-sided and infinite bounds are allowed.

Ray intervals inspect their local extremum as well as endpoint signs, so a grazing surface
can enter and leave between two samples. Safeguarded interpolation and bisection then stop
when the actual height residual converges, rather than always exhausting a quality-dependent
iteration count. Color, wireframe, contours, normals and picking use the resulting function
point. No CPU surface mesh is generated.

## Manual review

In headless Chromium/SwiftShader WebGL2, three 900 by 400 camera views at search hints
16, 64 and 512 covered every visible analytic helix sample outside the probe marker.
The same integer-cache path rendered with `EXT_color_buffer_float` disabled. Native WebGPU
rendered, exported and picked the curve near a world coordinate of 100,000,000 without
validation errors.

For a 480 by 320 sine/cosine surface, three camera-changing frames per case gave median
times of 299.3 to 230.1 ms in perspective and 296.5 to 222.2 ms in orthographic projection,
comparing the released default budget of 128 with the new automatic/default hint of 64.
There were no new background holes; at most three pixels differed by more than ten channel
levels. These are controlled software-renderer observations, not physical-device FPS claims.
