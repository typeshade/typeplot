# TypePlot

Plot arrays and JavaScript functions with automatic axes, multiple series, subplots and PNG
export. For GPU function plots, TypePlot renders TypeShade scalar functions and parametric
x/y/z trajectories with WebGPU and WebGL2 fallback. Both APIs support interactive navigation
and reduced-motion preferences.

## Website

Documentation, interactive examples, and the browser playground are available at
[plot.typeshade.dev](https://plot.typeshade.dev), with Korean pages under `/ko/`.
The website follows the TypeNN site conventions; see [website/README.md](website/README.md).

## Installation

Install the versioned Git release with npm:

```sh
npm install https://github.com/typeshade/typeplot.git#v0.1.1
```

The package includes JavaScript and declarations. TypeScript source in the dependency does
not need a loader. The version tag keeps installations on the same release.

The data plotting API described below targets the next release. The existing v0.1.1 tag
contains the GPU function API; install a Git commit containing these changes to use the new data API.

The package has not been published to the npm registry. Once it is published, registry
installation will use `npm install typeplot`. See the
[publishing procedure](https://github.com/typeshade/typeplot/blob/main/docs/publishing.md).

## Plot data directly

Draw arrays, typed arrays or ordinary JavaScript callbacks without writing shaders or adding
a build plugin. TypePlot uses its precompiled TypeShade shaders on WebGPU or WebGL2 for all
plot graphics, including grids, axes, ticks, text and series:

```ts
import { plot, linspace } from "typeplot";

const x = linspace(0, 2 * Math.PI, 200);
const fig = plot(x, Math.sin, {
  target: "#chart", // Omit to append to document.body.
  title: "Sine wave",
  xLabel: "Angle (radians)",
  yLabel: "Amplitude",
  grid: true,
});

// A single array uses its indices as x coordinates.
const other = plot([3, 1, 4, 1, 5]);
await fig.ready;
// Remove each figure when its view unmounts.
other.destroy();
fig.destroy();
```

For applications that only plot data, the same API is available from `typeplot/data`.
Both browser entries contain the TypeShade runtime and precompiled shaders, without the compiler.
JavaScript callbacks are sampled on the host; all visible chart graphics are rendered by TypeShade.
Figure handles are created synchronously. Await `fig.ready` for backend initialization and the first
complete frame, and handle rejection or pass `onError`. `fig.backend` reports the actual backend.
WebGPU and WebGL2 are supported; there is no Canvas 2D fallback.
The package can be imported on the server, but figures must be created in a mounted browser view.

### Multiple series and subplots

```ts
import { subplots, linspace } from "typeplot/data";

const {
  fig,
  axes: [curves, distribution],
} = subplots(1, 2, {
  target: "#chart",
  width: 1000,
  height: 400,
  title: "Measurements",
});
const x = linspace(0, 2 * Math.PI, 200);
const sine = curves.plot(x, Math.sin, { label: "Sine" });
curves.plot(x, Math.cos, { label: "Cosine", lineStyle: "--" });
curves.set({ title: "Signals", xLabel: "Time", yLabel: "Value", grid: true });
curves.legend();
distribution.histogram([1, 2, 2, 3, 3, 3, 4], { bins: 4 });
distribution.setTitle("Distribution");

// Update an existing series. Limits refit unless explicitly fixed.
sine.setData(
  x,
  x.map((value) => Math.sin(value + 0.5)),
);
curves.setXLimits(0, Math.PI);
// curves.autoscale() returns both axes to automatic limits.

await fig.saveImage("measurements.png", { pixelRatio: 2 });
// Or use await fig.toBlob() for a PNG without initiating a download.
fig.destroy();
```

Axes are always returned as a flat, row-major array, including a single subplot. Each axes
owns its color cycle, limits and interaction. There is no global current-figure state.
Figures include Reset view and Save PNG buttons; pass `toolbar: false` to omit them.
On narrow screens, multi-column figures scroll horizontally to keep their axes legible.

### Data plotting API

| Call                                                                                | Behavior                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `plot(y, options?)` / `plot(x, yOrFunction, options?)`                              | Create and return a single-axes `Figure`.                                 |
| `figure(options?)`                                                                  | Create an empty figure; draw with `fig.axes[0]`.                          |
| `subplots(rows?, cols?, options?)`                                                  | Return `{ fig, axes }` with independent subplots.                         |
| `ax.plot(y, options?)` / `ax.plot(x, yOrFunction, options?)`                        | Add a line and return its `Series`.                                       |
| `ax.scatter(x, y, options?)`                                                        | Add markers.                                                              |
| `ax.bar(x, heights, { width?, ...style }?)`                                         | Add bars at numeric x coordinates.                                        |
| `ax.histogram(values, { bins?, density?, ...style }?)`                              | Return `{ counts, bins, series }`. Bins may be a count or explicit edges. |
| `ax.set({ title, xLabel, yLabel, xLimits, yLimits, xScale, yScale, grid, legend })` | Set presentation and ranges together.                                     |
| `ax.setTitle(text)` / `setXLabel(text)` / `setYLabel(text)`                         | Set individual labels.                                                    |
| `ax.setXLimits(min, max)` / `setYLimits(min, max)`                                  | Fix axis limits, including when data changes.                             |
| `ax.setXScale("log")` / `setYScale("log")`                                          | Select linear or base-10 logarithmic coordinates.                         |
| `ax.grid(visible?)` / `ax.legend(visible?)`                                         | Toggle grid or labeled-series legend; default `true`.                     |
| `ax.autoscale()` / `ax.reset()` / `ax.clear()`                                      | Refit ranges, restore the home view, or remove series and settings.       |
| `series.setData(y)` / `series.setData(x, y)` / `series.remove()`                    | Update or remove one line, scatter series or bar series.                  |
| `fig.saveImage(filename?, options?)` / `fig.toBlob(options?)`                       | Download a PNG or return a PNG Blob.                                      |
| `fig.destroy()`                                                                     | Release observers, listeners and animation frames, and remove the figure. |
| `linspace(start, stop, count = 50)`                                                 | Return a `Float64Array`, including both endpoints.                        |

Series options include `label`, CSS `color`, `lineWidth`, `lineStyle` (`"-"`, `"--"`, `":"`,
`"none"`), `marker` (`"o"`, `"s"`, `"none"`), `markerSize` in CSS pixels, and `alpha`.
Array lengths must match. Data is copied so later input mutations do not silently change a
chart. `NaN` and infinity create line gaps and are omitted from bounds; non-positive values
are also omitted on log axes. Log limits must be positive and all explicit limits increasing.
Adding/removing/updating a series refits automatic ranges; label, grid and legend changes
preserve the current pan/zoom view. Histograms include the rightmost endpoint in the last bin
and density normalizes the total bar area to one; recreate a histogram to change its bins.
PNG exports redraw all subplots through the same TypeShade shaders at the requested density,
then read back the GPU texture and encode its pixels without a host drawing context. Output is independent of the on-screen size,
with a 16 megapixel and 16384 pixel per-dimension limit. Figure dimensions are CSS pixels.
Exports support PNG; this API does not implement all matplotlib chart types or options.
Provide an adjacent description or data table when access to individual values is needed.

## Runnable example

```sh
npm ci
npm run build
npm run dev
```

Open the local Vite URL to use data charts alongside scalar and spatial plots. The example imports shader callbacks
through `?plot`; no manual manifest generation is needed. It includes parameter controls,
keyboard instructions, a 3D toggle, reset and renderer failure messages. Use
`?backend=webgl2` to select WebGL2 explicitly. Run `npm run build:example` for production output.

## Vite

Add the build plugin to `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { typeplot } from "typeplot/vite";
export default defineConfig({ plugins: [typeplot()] });
```

A callback file contains only the function:

```ts
// sine.shade.ts
"use typeshade";
export function sample(x: f32): f32 {
  return sin(x);
}
```

Import its compiled plot in the browser:

```ts
import { createPlot } from "typeplot";
import sine from "./sine.shade.ts?plot";
import helix from "./helix.shade.ts?plot=3d";

const plot = await createPlot(document.querySelector("canvas")!, sine, {
  bounds: { x: [-6.28, 6.28], y: [-1.25, 1.25] },
});
```

For parameterized callbacks, set defaults with
`typeplot({ configure: file => ({ parameters: { exponent: 2 } }) })` for the applicable files.
For host TypeScript projects, add `/// <reference types="typeplot/client" />` to the project's
environment declarations. Exclude `**/*.shade.ts` from the host `tsconfig.json`; the plugin
validates these files with the TypeShade compiler, whose shader types and operators differ
from host TypeScript. The TypeShade editor extension provides shader diagnostics.

The plugin compiles callback imports during the build and watches their shader dependencies.
The browser receives a serialized program and the runtime.

## Scalar functions

Write a TypeShade callback in `curve.shade.ts`:

```ts
"use typeshade";

export function sample(x: f32, exponent: f32): f32 {
  if (x < 0) return 1e20;
  return pow(x, exponent);
}
```

Compile it during the application build:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { compilePlot } from "typeplot/compiler";

const program = compilePlot(readFileSync("curve.shade.ts", "utf8"), {
  fileName: "curve.shade.ts",
  parameters: { exponent: 2 },
});
writeFileSync("curve.js", `export default ${JSON.stringify(program)};\n`);
```

Create the plot in the browser:

```js
import { createPlot } from "typeplot";
import program from "./curve.js";

const canvas = document.querySelector("canvas");
const plot = await createPlot(canvas, program, {
  bounds: { x: [0, 1], y: [0, 1] },
  probe: 0.5,
});

plot.setParameters({ exponent: 3 });
plot.setMode("3d");
// Release observers, event listeners and runtime resources when the view is removed.
plot.destroy();
```

Set the canvas's CSS width and height in the application. TypePlot sizes its drawing buffer
for the display density. It does not add page containers, controls or global styles.

## Spatial trajectories

A parametric callback returns `vec3`. Its first argument is the curve parameter:

```ts
"use typeshade";
export function sample(t: f32): vec3 {
  return vec3(cos(t) * 2, sin(t), t * 0.4);
}
```

Compile with `{ kind: 'parametric' }`. Set `domain: [start, end]` for the callback's parameter
interval; its default is a copy of the initial x bounds. Camera bounds only control the view.
Zooming and panning never change the parameter domain. Spatial plots open in 3D with perspective projection. Pass `projection: "orthographic"`
for parallel projection, or call `plot.setProjection("orthographic")`. Two-dimensional plots
always use orthographic projection. Switching mode preserves the selected 3D projection.
Scalar graphs use the implicit field `y - f(x)` in both 2D and 3D. The spatial renderer
intersects each camera ray with the graph's z=0 plane, then evaluates the function directly.
There are no sampled endpoints, connecting segments or path vertex buffers for scalar graphs.
They extend throughout the visible mathematical domain, including after zooming out. An exactly
edge-on graph plane uses a bounded numerical callback search to handle its singular inverse
projection. Arrays
remain finite observations; host JavaScript callbacks passed to `ax.plot(x, callback)` remain
sampled data and do not automatically become unbounded GPU functions.

Arbitrary spatial callbacks use a separate bounded closest-point search. Candidate parameters
are found on the GPU, then refined against the original projected callback. The renderer draws
no connecting polyline. `quality: { samples: 128, refinements: 5 }` controls this numerical search;
`plot.setQuality()` updates it, and `plot.setDomain()` changes the domain without resetting the
camera. Higher-frequency trajectories may require more search samples (16–512, default 128).
Refinements accept 1–8, default 5. This is a numerical distance approximation for arbitrary
callbacks, rather than a promise of an exact analytic SDF. Scalar fields use four footprint
samples for antialiasing; subpixel oscillations and f32 precision still limit resolved detail.

## GPU function API

`compilePlot(source, options)` accepts `entry` (default `sample`), `kind` (`scalar` or
`parametric`), `fileName`, `files`, `readDocument`, `parameters` and `discontinuous`.
Relative imports use TypeShade's existing resolver. Extra scalar callback arguments match
the declaration order of `parameters`. Their values must fit finite f32 numbers. Callbacks
must guard their mathematical domain; returning a magnitude of at least `1e18` omits a point.
`discontinuous: true` rejects locally detected jumps instead of drawing invented connections.

`createPlot(canvas, program, options)` accepts bounds, backend (`auto`, `webgpu`, `webgl2`),
mode, projection (`perspective` or `orthographic`), spatial callback domain and quality,
style, probe, parameter values, pixel ratio,
interaction enablement and an error callback. `plot.projection` reports the effective projection.
Programs compiled before this camera feature retain orthographic rendering; recompile them
to enable perspective projection.
The returned plot provides `setMode`, `setProjection`, `setProbe`, `setParameters`, `setStyle`, `setDomain`, `domain`, `setQuality`, `bounds`, `reset`, `redraw`
and `destroy`. Unknown parameter names and non-finite values are rejected.

Axis and tick strokes default to **1 CSS px**, independent of camera zoom and display density.
`style` configures the shader's appearance; `setStyle()` patches it without recreating the plot
or resetting the camera. `reset()` restores the initial style along with the camera:

```ts
const plot = await createPlot(canvas, program, {
  style: {
    axisWidth: 1,
    gridWidth: 1,
    curveWidth: 2,
    labelSize: 11,
    tickDensity: 1,
    labelHalo: 0.8,
    labelBackground: false,
    grid: true,
    tickLabels: true,
    axisLabels: true,
  },
});
plot.setStyle({ gridWidth: 0.5, labelSize: 13 });
plot.setStyle({ tickDensity: 1.25, labelHalo: 0.8, labelBackground: false });
```

Widths accept 0–32 CSS px; zero hides the strokes. Labels accept 6–48 CSS px. Recompile
older programs to enable these settings. The shader projects world-coordinate tick multiples
through the curve's camera for spatial grids and numeric labels, in both projection modes.
Stroke outlines and rounded dash ends are analytic distance fields; text uses an offline IBM
Plex signed distance atlas generated with X-GIS computeSDF and sampled with its 0.75 edge /
physical-size antialiasing rule. Native 12/24/48px ASCII buckets preserve
hinting and contour detail at different physical display sizes; rendering follows DPR up
to four within the render budgets. Line, marker and bar fields use a fullscreen triangle per series, without host path
tessellation. Increasing-x lines use GPU binary searches to limit local field evaluation. Spatial callbacks use bounded closest-point search against the callback itself.

GPU function styles additionally support `lineStyle: "-" | "--" | ":"`, `dashPeriod`
(default 0.2 parameter units) and `dashOffset` (default 0). Scalar graphs use x as their
parameter; spatial callbacks use t. `plot.setStyle({ lineStyle: "--", dashPeriod: 0.5 })`
updates the procedural pattern without recompilation or camera changes.

Dashed data paths repeat in **curve parameter coordinates**, evaluated directly in the SDF.
`parameter: "auto"` uses x for strictly increasing x data, and sample index otherwise. Select
`"x"` or `"index"` explicitly when needed. An explicit `dashPeriod` fixes the period in
parameter units; `dashOffset` fixes its phase origin. Without an explicit period, automatic
density starts at 1/60 of the parameter domain and adjusts by powers of two in both zoom
directions, keeping gaps visible when zoomed in and round caps separated when zoomed out. The GPU derives this level from the viewport and
resident data bounds, without arc-length accumulation. The phase origin stays anchored;
automatic density changes the repeating period at level transitions. Explicit periods
remain attached to the curve, with screen length varying by projection and slope; sufficiently
small fixed periods can merge below pixel resolution. Missing data splits the distance field without rephasing later samples. No cumulative
path-length buffer or prefix-scan pass is used. PNG export uses the same field and layout.

```ts
ax.plot(x, Math.sin, { lineStyle: "--", parameter: "x", dashPeriod: 0.2 });
```

Wheel input zooms around the cursor in 2D and around the camera focus plane in 3D. Left-dragging tracks the pointer directly to pan a scalar plot or orbit a 3D plot. Right-dragging pans either mode; the canvas suppresses its context menu only while interaction is enabled. Rendering
is coalesced to animation frames; dragging and wheel input do not restart eased transitions.
Arrow keys move the view, `+`/`-` zoom, and Home resets the camera. `reset()` restores the
initial plot settings. Reduced motion applies camera changes immediately. Idle plots do
not keep an animation loop running.

## Existing rendering hosts

A host that already owns its compiler and GPU runtime can import only the reusable pieces:

```js
import { plotShaderFiles } from "typeplot/shaders";
import { createPlotInteraction } from "typeplot/interaction";
```

`plotShaderFiles` supplies the separate shader document for TypeShade's `readDocument`.
`typeplot/shade` exposes the original shader module to the TypeShade package resolver.
Its callbacks include `plot2D`, `plot3D`, `plotFilled` and `plotComparison`. The interaction
controller supplies `plotCenter`, `plotSpan`, `plotRotation` and `plotBlend` uniforms.
These entry points let a host reuse an existing device and frame lifecycle.

## Development

```sh
npm ci
npm run build
npm run examples
```

Serve the repository over HTTP and open `/examples/`. Append `?backend=webgl2` to force the
fallback. The browser entry contains the runtime; the separate Node compiler entry contains
TypeShade and TypeScript. The build rejects a compiler dependency in the browser entry.

TypePlot is derived from the graph module developed for typeshade.dev. See LICENSE and NOTICE.

## Canvas accessibility

Pass `label: "Power function"` to name a plot for assistive technology. Without this option,
existing `aria-label` and `aria-labelledby` attributes are preserved; otherwise TypePlot
provides a generic name. Existing roles are preserved, with `img` used as the default.
Add descriptive fallback content inside the canvas and use `aria-describedby` for keyboard
instructions or a textual explanation. A canvas label does not replace an accessible table
or mathematical description of the underlying data. Attributes are restored on destruction.


### Adaptive grid and label layout

Ticks use overlapping world-coordinate decimal lattices. Intermediate ticks fade continuously
with zoom while common multiples stay visible. Spatial labels query the infinite projected
axes, independently of the curve domain. Projected label dimensions control density and
collision fading; nearly coincident x/z axes give x labels priority. Edge and origin guards
reduce clipped and duplicate labels. Extremely compressed or edge-on axes can hide labels.

GPU `style` / `setStyle` and data `Axes.set` expose `labelSize`, `tickDensity` (0.25–4),
`labelHalo` (0–2 CSS px, limited by available glyph padding), and `labelBackground`.
Labels default to a thin halo with no box. Optional rounded backgrounds cover numeric labels
and axis names; data titles and axis descriptions use the same setting. All backgrounds, glyph halos, grids and ticks are
TypeShade distance fields. Log-axis precision follows the adjacent value difference.

Grid visibility fades over 160 ms; GPU numeric/axis-label visibility fades too. Reduced-motion
preferences disable these timed fades. Camera dragging remains direct. Static PNG exports
use the requested final grid visibility, regardless of an in-progress display fade.

See [grid and label implementation notes](docs/grid-label-layout.md).


### Camera gestures

Drag follows the pointer directly. On release, recent drag velocity continues with
frame-rate-independent exponential damping, for 2D panning, 3D orbit and right-button pan.
A new pointer press, wheel input, Escape, reset, or a mode change interrupts momentum.
Reduced-motion preferences disable inertia. Set `inertia: false` in `createPlot` or figure
options to disable it explicitly. Double-click restores the home camera without changing
data or style; `doubleClickReset: false` disables this gesture. Home also resets the view.


### Unbounded parameter domains

Newly compiled spatial programs default to `domain: [-Infinity, Infinity]`. One-sided
infinite domains are accepted too. Finite endpoints continue to clip explicitly.
Unbounded numerical search compactifies the real parameter line into a finite query
coordinate and concentrates detail near a local camera-focus estimate. It does not create
an infinite path mesh or send IEEE infinities into GPU uniforms. `plot.domain()` reports
the mathematical domain; `setDomain` changes it independently of the camera.

This is numerical coverage, not a guaranteed global solution for arbitrary callbacks.
The tails approach infinity, but f32 precision (compact-coordinate endpoint guard 1e-5),
local focus estimation and finite `quality.samples` bound resolved detail. Increasing
quality or supplying a finite domain may be necessary for highly oscillatory/re-entering
curves. Scalar functions still evaluate their implicit field across the entire visible
plane; input arrays remain finite observations. Legacy programs must be recompiled to
support unbounded spatial domains.


### HTML controls and optional HTML legends

```ts
import { ViewControl } from "typeplot";
const view = new ViewControl();
plot.addControl(view, "top-right");
// plot.removeControl(view);
```

Controls implement `onAdd(plot): HTMLElement`, `onRemove(plot): void` and optionally
`onUpdate(plot)`. Positions are top-left, top-right, bottom-left and bottom-right. Controls
are cleaned up on removal/destruction. `ViewControl` provides 2D/3D, projection and camera
reset; parametric programs remain 3D. `getMode`, `getProjection`, `getContainer` and
`resetView` are available to custom controls. `resetView` preserves style and parameters.

Data axes can opt into an HTML legend with `ax.legend("html")` or
`ax.set({ legend: "html" })`. `true` retains the default GPU legend and `false` hides it.
HTML labels use textContent, track series metadata and resize with their subplot. PNG
export renders the corresponding legend on the GPU, independently of DOM controls.


On touchscreens, one finger pans a 2D plot or orbits a 3D plot. Two fingers pinch to zoom
and move together to pan, without rotating the 3D camera. Zoom anchors to the gesture
centroid (the focus plane in perspective). Switching between one and two fingers rebases
input without a camera jump. Touch cancellation clears the gesture. Double-tap restores
the home camera and follows `doubleClickReset`; released single-finger drags retain the
existing inertia/reduced-motion behavior. The page remains scrollable outside the plot.
