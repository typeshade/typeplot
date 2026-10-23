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

Draw arrays, typed arrays or ordinary JavaScript callbacks without a shader, build plugin
or GPU. TypePlot creates a responsive figure, chooses axis limits and cycles series colors:

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
// Remove each figure when its view unmounts.
other.destroy();
fig.destroy();
```

For applications that only plot data, the same API is available from `typeplot/data`.
This smaller browser entry has no GPU runtime or compiler dependency. It renders with Canvas 2D.
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
PNG exports redraw all subplots at the requested density, independent of the on-screen size,
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

Compile with `{ kind: 'parametric' }`. The x bounds supply the parameter interval, and x/y
bounds supply camera normalization. Spatial plots use an orthographic camera and open in 3D.
The current renderer uses a bounded polyline; it does not draw implicit surfaces or meshes.

## GPU function API

`compilePlot(source, options)` accepts `entry` (default `sample`), `kind` (`scalar` or
`parametric`), `fileName`, `files`, `readDocument`, `parameters` and `discontinuous`.
Relative imports use TypeShade's existing resolver. Extra scalar callback arguments match
the declaration order of `parameters`. Their values must fit finite f32 numbers. Callbacks
must guard their mathematical domain; returning a magnitude of at least `1e18` omits a point.
`discontinuous: true` suppresses segment connections across detected jumps.

`createPlot(canvas, program, options)` accepts bounds, backend (`auto`, `webgpu`, `webgl2`),
mode, probe, parameter values, pixel ratio, interaction enablement and an error callback.
The returned plot provides `setMode`, `setProbe`, `setParameters`, `bounds`, `reset`, `redraw`
and `destroy`. Unknown parameter names and non-finite values are rejected.

Wheel input zooms around the cursor. Dragging pans a scalar plot or orbits a 3D plot.
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
