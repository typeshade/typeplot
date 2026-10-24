# TypePlot usability improvements

## TypeShade rendering and camera correction

All visible chart graphics now use named TypeShade shaders. The Canvas 2D data renderer and
export compositor have been removed. Grid spacing, spine coverage, tick positions and tick
number formatting live in shaders/data.shade.ts and shaders/font.shade.ts. Series geometry
and glyph quads are also shader-generated. A static, licensed IBM Plex glyph atlas supplies
font coverage; the host only uploads it. One runtime and atlas serve all subplots in a figure.
The transparent axes canvases carry interaction and accessibility, with no drawing contexts.

A synchronous Figure handle now exposes ready for asynchronous backend initialization and its
first complete frame. Exports render the same scene into a GPU texture, read its bytes and
encode PNG without a host graphics context. Both browser entries include the runtime and
precompiled programs while excluding the compiler. An unavailable explicit backend reports
an error; auto may select TypeShade's WebGL2 renderer after WebGPU setup fails.

Dragging and wheel input update the current camera directly. Host draws are coalesced to
animation frames. Keyboard and reset transitions still honor reduced motion. 2D is orthographic;
newly compiled 3D programs default to perspective and permit orthographic projection. Perspective
uses the viewport aspect ratio and rejects curve segments behind the near plane. The website
keeps mounted plots alive while changing parameters, view mode and projection.

## Data plotting (v0.2.0)

TypePlot now accepts arrays, typed arrays and JavaScript callbacks through `plot(y)` and
`plot(x, yOrFunction)`. The data API creates a synchronous figure handle and renders every graphic through TypeShade shaders,
with automatic ranges, a per-axes color cycle, line styles, markers and missing-value gaps.
It is exported from both `typeplot` and the smaller `typeplot/data` browser entry.

`figure` and `subplots` provide independent axes for multiple lines, scatter plots, numeric
bars and histograms. Axis labels, titles, grids, legends, fixed limits and logarithmic scales
use TypeScript-style names such as `xLabel`, `lineWidth`, `setXLimits` and `saveImage`.
Data changes refit automatic ranges while retaining explicit limits. Presentation changes
retain the current view. `Series.setData` and `remove` support incremental updates.

Each axes reuses the existing interaction controller, with the plot viewport accounted for
when anchoring zoom and panning. Figures include reset and PNG download controls, with
`toBlob` for applications that own their save workflow. PNG export redraws every subplot
at the requested pixel density. Destroying a figure releases its observers, event listeners,
and pending animation frames. The original compiled GPU `plot(canvas, program, options)`
and `createPlot` APIs remain available.

The Vite example shows four data charts, including a log-scaled scatter plot and an update
button, independently of GPU startup. The README documents lifecycle, input validation,
histogram normalization, accessibility and the current PNG-only export limitation.

Validation: `npm run build`, `npm run build:example`, `npm run examples`,
`git diff --check` and `npm pack --dry-run`. No tests were added or run, following the
repository maintenance instructions. Browser interaction and visual review remain pending.

## Implemented

- Runnable Vite application: `npm run dev` imports real scalar and spatial callbacks through
  `?plot`, with parameters, 2D/3D mode, reset and backend selection.
- Responsive layout, fixed-width slider values, visible keyboard focus, canvas fallback
  text, keyboard instructions, toggle state and renderer failure messages.
- Partial startup failure and Vite hot replacement dispose already-created plot instances.
  Back/forward cache navigation keeps mounted instances available on return.
- Optional `PlotOptions.label`, generic fallback canvas names and a default image role.
  Author-supplied labels and roles are preserved unless the label option is explicit.
  Destroying a plot restores original accessibility attributes.
- Explicit `?plot=2d` and `?plot=scalar` override a configured parametric kind, matching
  the existing precedence of explicit spatial imports.

## Build checks

`npm run build`, `npm run build:example`, `npm run examples` and `git diff --check` pass.
The example build includes strict host TypeScript checking and a normal Vite configuration
load. CI now builds this application alongside the library. Generated sample programs are
unchanged. The browser entry retains its emitted-dependency compiler exclusion guard.
Low-level interaction and shared shader exports are unchanged, preserving site integration.

This change adds no test suite. The new example and accessibility behavior have not received
an additional browser interaction review. The existing v0.1.0 release remains unchanged;
these improvements target the v0.1.1 release.
