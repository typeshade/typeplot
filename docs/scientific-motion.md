# Scientific fields and animation

This extension covers scientific data artists, GPU picking, height fields and coordinated
camera/function animation. It is an independent TypeScript/TypeShade implementation,
with no Python, matplotlib, Manim or D3 runtime dependency.

## Data artists

| API                                              | Behavior                                                     |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `ax.barh(y, widths, options)`                    | Horizontal bars with a configurable baseline.                |
| `ax.step(x, y, { where })`                       | Pre/post/mid steps and parameter-coordinate dashes.          |
| `ax.stem(x, y, options)`                         | Baseline strokes and optional markers.                       |
| `ax.fillBetween(x, first, second, options)`      | A filled band; second can be a scalar.                       |
| `ax.errorbar(x, y, { xError, yError, capSize })` | Symmetric/asymmetric errors and caps.                        |
| `ax.imshow(values, { shape, extent })`           | Row-major scalar observations with nearest/linear filtering. |
| `ax.contour(values, { shape, levels })`          | GPU coverage of interpolated scalar-field isolines.          |
| `ax.contourf(values, { shape, levels })`         | Filled level bands.                                          |
| `ax.colorbar(field)`                             | A shader-rendered scale linked to a field.                   |
| `ax.text(x, y, text, options)`                   | Data-anchored SDF text.                                      |
| `ax.annotate(text, xy, { xyText, arrow: true })` | Text and an implicit arrow.                                  |

All graphics use named TypeShade shaders. No host path meshes or Canvas2D/SVG renderer
is added. Series support setStyle, setVisible and setAlpha. Styles include baseline,
capSize, where and existing colors/widths/markers. Error values accept a nonnegative scalar,
matching array, or `{ lower, upper }`. Use setBandData for fill boundaries; recreate error
bars to change errors. Nonfinite values remain gaps and fixed axes limits persist.

Field shape is `[rows, columns]`, up to 4194304 values. Extent is
`[xMin, xMax, yMin, yMax]`; default bounds span pixel centers from zero. Origin defaults
to upper; lower puts row zero at the lower edge. Options include colorMap, valueRange,
interpolation, alpha, visible, colorBar, levels and lineWidth. Contour lines require
linear interpolation. Levels accept 2–64 increasing, f32-distinguishable values or a count.
Missing values are transparent. setData preserves shape and recomputes automatic color
limits; set changes appearance. Color maps use compact linear anchors for viridis,
plasma, coolwarm and gray, rather than matplotlib's full lookup tables.

Annotations support fontSize, color, alpha, align, counterclockwise rotation in radians,
CSS-pixel offset, arrow, lineWidth and headSize. Anchors do not autoscale axes. Handles
support setText, setPosition, set and remove. Text uses the existing X-GIS SDF atlas;
this is plain glyph rendering, not TeX layout.

## GPU height functions

```ts
// surface.shade.ts
"use typeshade";
export function sample(x: f32, z: f32, phase: f32, amplitude: f32): f32 {
  return amplitude * sin(x + phase) * cos(z - phase * 0.35);
}
// Configure this file's Vite defaults as { phase: 0, amplitude: 1 }.

// main.ts
import { createPlot } from "typeplot";
import surface from "./surface.shade.ts?plot=surface";
const plot = await createPlot(canvas, surface, {
  bounds: { x: [-3, 3], y: [-2, 2] },
  surface: { colorMap: "viridis", valueRange: [-1, 1], colorBar: true },
});
plot.setSurface({ wireframe: true, contours: true, contourInterval: 0.25 });
plot.setMode("2d"); // Same function as an x/z color field and optional contours.
plot.setMode("3d");
```

compilePlot also accepts kind: surface. TypePlot uses **y-up**: the function defines
`y = f(x, z)`. Its mathematical x/z domain defaults to unbounded. surfaceDomain and
setSurfaceDomain restrict it explicitly, accepting finite or infinite endpoints. Camera
bounds do not clip that domain. Color limits normalize appearance without clipping geometry.
Other surface options include shading, filled, opacity and depthRange.

The GPU finds the first resolved ray/height-field crossing and shades callback normals;
no triangle mesh is generated. Quality controls 16–512 ray steps and 1–8 refinement settings,
defaulting to 128 and 5. The default depth search starts at 0.101 and extends to at least
12 or four camera distances. Explicit depthRange fixes the numerical window. Finite search
can miss tangencies, thin branches or high frequencies; it is not a certified global SDF.
The existing magnitude guard of 1e18 marks undefined callback values. Transparency blends
the first resolved surface with the background, without multilayer transparency.

## Resident observation grids

```ts
import { createSurface } from "typeplot";
const plot = await createSurface(canvas, heights, {
  shape: [48, 64],
  extent: [-3, 3, -3, 3],
});
plot.setValues(nextHeights); // Same shape; retain color limits.
// plot.setValues(nextHeights, true) also rescales colors.
plot.animate({ parameters: { heightScale: 1.5 } }, { duration: 2 });
```

A precompiled named callback bilinearly evaluates resident data. Rows progress from zMin
to zMax; extent identifies first/last vertices, unlike image cell edges. At least two
rows/columns are required. Missing cells are not extrapolated. Layout is fixed; heightScale
and heightOffset are animatable parameters. Camera changes retain resident observations.
General callbacks may declare read-only storage arrays of f32 and receive Float32Array
bindings through PlotOptions.data. setData(name, values) replaces a binding. Inputs are
copied; owned resources are released on destruction. No browser compiler is needed.

## Camera and affine scenes

getCamera/setCamera expose immediate center [x,y], z focus, span, yaw/pitch rotation,
screen pan, vertical fov in radians and normalized distance. FOV is 0.001–PI−0.001 and
distance is 0.202–1000. Programmatic changes preserve the home view. 2D stays orthographic.

```ts
import { multiplyMatrices, translationMatrix, rotationMatrix } from "typeplot";
plot.setTransform(
  multiplyMatrices(translationMatrix(1, 0, 0), rotationMatrix(0.4)),
);
plot.setCamera({
  center: [0, 0],
  z: 1,
  rotation: [0.8, 0.5],
  fov: Math.PI / 3,
});
```

Invertible column-major affine 4×4 matrices transform the **3D** plot, lattice, axes and
tick anchors together. Camera state is in world coordinates; picking returns local
mathematical coordinates. Singular transforms are rejected before mutation. Tweening
uses QR factors and quaternion interpolation, preserving rotation/shear rather than
collapsing a matrix through a singular midpoint. It takes the shortest rotation and
cannot cross a reflection determinant. Use an angle tracker for a full object revolution.
Old manifests still render; recompile for lens, z-focus, transforms and picking.

## Timelines and trackers

```ts
const animation = plot.animate(
  {
    parameters: { phase: 2 * Math.PI },
    camera: { rotation: [1.8, 0.6], distance: 3.6, fov: Math.PI / 3 },
  },
  { duration: 6, easing: "smooth" },
);
animation.pause();
await animation.seek(2.5);
animation.play();
await animation.finished;
```

Timeline, tween, wait, parallel, sequence and ValueTracker are exported from typeplot and
typeplot/animation. plot.transition captures an unplayed clip for composition. A timeline
accepts clips at offsets and an optional asynchronous render callback. It supports pause,
seek, replay, cancel, repeat (extra cycles, including Infinity), yoyo and
linear/smooth/easeIn/easeOut/thereAndBack/custom easing. finished resolves to finished or
cancelled; state and time are readable.

Updates derive from captured endpoints and absolute time, never accumulated deltas.
Playback awaits rendering and has no idle animation loop. New pointer/wheel/keyboard input
pauses plot-owned motion; destroying a plot cancels it. Reduced-motion preferences complete
one animation without continuous playback unless overridden. Applications own external
timelines and should cancel them on unmount.

The architecture follows principles visible in
[Manim's animation lifecycle](https://github.com/3b1b/manim/blob/master/manimlib/animation/animation.py):
captured state, normalized time, rate functions, group timing and value updaters. No Manim
source code, renderer or Python runtime is embedded.

## Picking and export

```ts
ax.on("hover", (event) => {
  readout.textContent = event.result
    ? `${event.result.x}, ${event.result.y}`
    : "";
});
plot.on("click", (event) => console.log(event.result?.point));
const point = await plot.pick([120, 90]); // CSS pixels from top-left.
await plot.saveImage("surface.png", { pixelRatio: 2 });
```

on/off support hover and click on axes and GPU plots. pick accepts a 0–64 CSS-pixel radius,
default eight. Data queries render an integer texel using the analytic artist coverage;
topmost matching artists win. Markers/bars identify observations; line/step/fill hits
identify a segment's starting observation. Field hits identify a row-major cell/value.
Function queries search the original callback and return local [x,y,z], distance and a
curve parameter. Surface queries inspect the underlying height field, also in wire mode.
These numerical queries share finite quality/precision limits with rendering.

Hover is opt-in, coalesces events, keeps one readback in flight and clears on leave.
Dragging suppresses click picking. Annotations/legends are not pick targets. There is no
CPU geometry search or DOM tooltip renderer; applications can use their own readout.

GPU plots expose toBlob/saveImage through the same shaders, with temporary caches at
export density. Optional width/height are CSS sizes; pixelRatio is at most four, within
device dimension and 16-megapixel limits. One nonzero-size frame must have rendered before
export. Encoding GPU bytes uses no Canvas2D renderer. Data PNGs also include fields,
colorbars and annotations.

## Further coverage

Specialized statistics (box/violin), pie/polar charts, date/categorical axes, nonuniform
meshes, general vector fields, shared-axis layouts and full matplotlib export/formatting
backends remain separate work. Manim-style TeX layout, object-topology morphs, nonlinear
warps and video/audio composition are also outside this extension. The delivered motion
core focuses on the selected priority: 3D surfaces, camera state and GPU function changes.

## Manual validation (2026-10-24)

Library/example builds, generated programs, website build/typecheck, package dry run and
whitespace checks passed. No repository test suite was added or invoked.

WebGL2 reviews covered every new data family, field cell picking, annotations, PNG,
function/observation surfaces, known ray intersections and deterministic camera/parameter/
transform seeks. A two-by-two height plane returned the expected local point within about
1e-6; replacing all values by values plus one moved the picked height by one. Nine spatial
curve scenes matched the reference path pixel-for-pixel, including 512 samples, perspective
folds, orthographic, dashes, unbounded/half-infinite domains and resizing.

Native WebGPU rendered function surfaces, resident grids, scalar fields, error bars and
annotations; point queries and PNG readback completed without validation/page errors.
Cloud Chromium's swap-chain interop fails independently, so QA supplied an offscreen GPU
output texture and uploaded the exact atlas bytes directly. Neither substitution ships in
the runtime. These checks make no physical iPhone FPS claim.

Desktop and a 390px/DPR2 touchscreen viewport completed Playground preset switches,
play/pause/seek, 2D/3D switching, PNG download and one/two-finger surface navigation without
page errors or horizontal overflow. Shared-runtime imports also removed a duplicate bundle
from the combined Vite example: gzip output decreased from about 2.12 MB to 1.12 MB in the
same local production build configuration.
