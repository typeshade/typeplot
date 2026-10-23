# TypePlot

GPU function plots authored with TypeShade. TypePlot renders scalar functions and parametric
x/y/z trajectories with axes, ticks, pan, zoom, orbit and reduced-motion transitions.
It uses the TypeShade program runtime on WebGPU, with WebGL2 fallback.

## Installation

The intended registry installation is:

```sh
npm install typeplot
```

The first release has not been published yet. Until publication, install the review branch
from PR #1:

```sh
npm install https://github.com/typeshade/typeplot.git#feat/initial-plot-library
```

The package includes JavaScript and declarations. TypeScript source in the dependency does
not need a loader. After PR #1 merges, the unqualified Git URL installs the main branch.
See [Publishing](docs/publishing.md) for the registry release procedure.

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

## API

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
