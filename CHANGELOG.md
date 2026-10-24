# Changelog

## v0.2.1

- Allocate procedural curve searches from the projected image footprint, with a separate
  exploration partition that retains folds outside the initial view. Cache parameter seeds,
  interval bounds, tile candidates and active groups on the GPU.
- Refine actual callback coverage to subpixel stability and share traversal with radius-based
  picking, so lowering a search budget does not remove the resolved helix branches.
- Store search and label caches as exact integer bit patterns, retaining the accelerated path
  on WebGL2 without floating-point color attachments. Older manifests remain supported.
- Add optional conservative `surface.heightRange` bounds for ray culling. Color `valueRange`
  continues to control normalization only.
- Inspect local ray extrema at grazing intersections and stop bracket refinement when the
  actual height residual converges. The Playground supplies known physical bounds for its
  sine/cosine surface.
- Describe the advanced Playground controls as search budgets; compiled adaptive programs
  add work required by the image instead of using a low value as a visibility cutoff.

## v0.2.0

Install the versioned release with npm:

```sh
npm install https://github.com/typeshade/typeplot.git#v0.2.0
```

This is a GitHub release. The package is not yet published to the npm registry.
Compiled JavaScript, declarations, named TypeShade shaders and licensed SDF font assets
are included, so consumers do not need to build the library.

### Plotting and scientific graphics

- Arrays, typed arrays and JavaScript callbacks through `plot`, `figure` and `subplots`,
  with multiple series, automatic limits, legends and PNG export.
- Lines, scatter, bars, histograms, steps, stems, error bars, filled bands, images,
  contours, colorbars and data-anchored annotations.
- GPU scalar and parametric functions, height-field surfaces and resident observation grids,
  with picking and hover events.
- Shared scenes for curves and surfaces, affine transforms, groups and seekable timelines
  for camera, function parameters and object state.

### Rendering and interaction

- Named TypeShade shaders render chart graphics on WebGPU or WebGL2, including procedural
  SDF curves, parameter-based dashes, grids, perpendicular ticks and XGIS-derived SDF text.
- Adaptive grid and label levels, halo styling, perspective and orthographic cameras,
  HTML camera controls and optional HTML legends.
- Direct pointer tracking, inertial drags, right-button pan, touch pinch/two-finger pan,
  double-click/tap reset, keyboard navigation and reduced-motion support.
- RTC camera-relative matrices, lazy extended-precision grid phases and numeric labels,
  and GPU-prepared parameter origins for stable large-coordinate periodic curves.

### Startup and resource ownership

- Shared browser modules and font resources, asynchronous preparation, draw coalescing
  and separate compiler/browser entries.
- Known scene objects can prepare together before one complete first frame. Standalone
  pipelines and extended coordinate shaders remain lazy until needed.
- Resident data survives camera and parameter changes. Resource scopes retain pending
  GPU work through disposal, picking and export.

### Documentation

- English and Korean guides, API reference, examples and Playground at
  [plot.typeshade.dev](https://plot.typeshade.dev).
- Precision contracts and numerical limits in [docs/precision.md](docs/precision.md),
  scientific scope in [docs/scientific-motion.md](docs/scientific-motion.md), and startup
  behavior in [docs/loading.md](docs/loading.md).
