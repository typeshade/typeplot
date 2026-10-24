# Rendering refinements

## TypeShade execution model

The pinned TypeShade source in `node_modules/typeshade` is the authority for these decisions.
`AUTHORING.md` describes portable compute, kernel functions, fused scopes and fp64.
`src/runtime/device.ts` defines the resource owner; `src/fuse.ts` and
`examples/hosts/loop-fuse/host.ts` describe and demonstrate fusion.

- `Runtime` loads compiled programs, creates cached pipelines, binds named resources and
  renders/dispatches through frames. TypePlot should use this surface rather than implement
  another GPU backend. The browser entry must remain compiler-free.
- `Device` owns resident arrays, pooling, textures, kernel plans, completion and disposal.
  `createDevice({ runtime })` shares a WebGPU runtime's native device. This overload rejects
  WebGL2; that renderer uses runtime-bound Residents instead of another context's resources.
- `device.fuse()` records synchronous kernel calls. Compatible same-index loops become one
  WebGPU dispatch; scratch intermediates may become locals. Build kernel modules with
  `typeshade({ fuse: true })`, and inspect `FuseReport` rather than assume fusion occurred.
  Neighbor accesses, incompatible ranges and independent compute entries may require separate
  groups. WebGL2 does not fuse dispatches. A draw cannot run inside a fused scope.
- Pure SDF helper composition in one fragment entry is already one rendering program. It
  needs no artificial kernel chain or `fuse()` wrapper. Use fusion when a genuine data
  transformation/filter/reduction chain exists.
- TypeShade supplies f64 lowering, guard resources and device-dependent precision variants.
  Future Mandelbrot fields must preserve precision through camera coordinates and iteration,
  narrowing only where the field or output permits it. This is not yet a TypePlot field API.

## Distance-field rendering

The owner chose curve-parameter dashes, not fixed screen arc-length dashes. The renderer
repeats a band in parameter coordinates and evaluates its rounded distance field directly.
There is no length accumulation or prefix scan. Defaults use increasing x or sample index;
`parameter`, `dashPeriod` and `dashOffset` expose that choice. Zoom changes the projected
pattern size. NaN/Infinity creates gaps without resetting the parameter coordinate.

Data lines, markers and bars are field evaluations in a fullscreen triangle per series.
The host supplies data/layout, not line vertex/index geometry. Increasing-x lines use GPU
binary searches to restrict evaluation to overlapping samples. Other paths evaluate their
input intervals directly. Input samples remain resident until data changes; camera input
updates uniforms. Sampled arrays still define a piecewise-linear field approximation.

Spatial axes are projected implicit line SDFs through a common world origin. The ground grid
intersects inverse camera rays with y=0 and evaluates the infinite world lattice, with
screen-space derivative footprints and horizon filtering. Neither uses viewport-derived
segment endpoints. Trajectories evaluate bounded intervals of the TypeShade callback in
fragment code, with near-plane clipping; no trajectory mesh is uploaded.

The shared IBM Plex atlas is a signed distance field reconstructed in TypeShade. The offline
atlas generator uses Pillow, fontTools, brotli, NumPy and SciPy. The generated resource is
committed; consumers and CI need none of those dependencies.

Axes/ticks default to 1 CSS px. GPU plots expose widths, label size and decoration switches
through `style` and `setStyle()`, also available in the playground. Right-dragging pans 3D
in screen space; left-dragging orbits. Both buttons pan 2D. PNG output uses the same shaders.
