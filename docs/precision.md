# Relative-to-center coordinates

Spatial rendering retains the authoritative world camera and scene matrices as host double
precision numbers. Before uniform packing, the host subtracts the camera origin from each
object's affine translation. GPU projection, distance fields, ray searches and AA then operate
on the resulting local coordinates. Scene transforms remain world transforms in the public API;
picking reconstructs local mathematical and world coordinates from the captured frame origin.
The origin is recomputed from absolute state, rather than accumulated through repeated pans.
Spatial pointer and two-finger panning move the world camera focus in its view plane.
Pointer-anchored zoom moves that focus as it changes the visible span, keeping the relative
origin near the inspected content. The explicit camera `pan` option remains a lens shift.

A large coordinate lattice needs more than moving its visual origin. Its world-anchored
`floor`/`fract` phase must also survive the subtraction. The extended coordinate renderer
keeps the axis origin and grid phase in TypeShade `f64`, reconstructs decimal lattice steps
before multiplying by a large index, narrows the small phase/delta, and
uses the existing SDF glyph atlas. Cached numeric labels retain their fractional world values.
Derivative AA operates on the high/low coordinate difference, rather than a folded phase.
Grid levels fade before projected line spacing becomes a dense carpet.

The extended coordinate program is a separate, lazy Runtime program. The normal 3D path
keeps its f32 shaders; a world-origin-to-visible-span precision budget selects the extended
path when needed. It uses the same Runtime, font texture, frame submission and compositor.
Its integer label cache also works without floating-point color attachments. PNG export
uses an independent cache at export density. No CPU-generated grid or curve mesh is created.

## Parameter origins

Moving the camera origin does not recover a curve parameter already rounded to f32. A callback
with a known reference axis can declare a local parameter window and a named GPU preparation
function:

```ts
const program = compilePlot(source, {
  kind: "parametric",
  parameterOrigin: { axis: "z", scale: 0.4, prepare: "prepare" },
});
```

The source callback receives `(localParameter: f32, preparedOrigin: vec4, ...parameters)`.
The named preparation function receives `(origin: f64, ...parameters)` and returns `vec4`.
It runs into one integer texel when the origin or callback parameters change. Curve interval
search, fragment SDF and picking reuse that texel. Both the preparation and drawing are named
TypeShade shaders executed by Runtime. No host trigonometry supplies curve samples.

For the helix, preparation computes `f32(cos(origin))` and `f32(sin(origin))` after TypeShade's
extended argument reduction. The local callback uses angle addition with its small f32
parameter and returns `z = 0.4 * localParameter`. The host adds `0.4 * origin` to the object's
world translation before subtracting the camera origin. Domain endpoints, parameter-based
dashes, probe coordinates, picking and export use the same window. The reference axis selects
a numerical window; it is not a guaranteed inverse for every arbitrary callback.

The Vite plugin accepts the same setting through its existing per-file `configure` callback.
See [the helix source](../examples/helix.shade.ts) and [Vite configuration](../examples/vite.config.js).

RTC and TypeShade's emulated f64 have finite precision. They preserve small differences before
narrowing; they cannot reconstruct values already rounded by a user-supplied f32 callback.
Cancellation within a mathematical formula still needs its own f64 chain or a stable algebraic
form, with the small final result narrowed only afterward. Numerical curve quality still limits
which branches an arbitrary implicit search resolves.

The implementation follows the distinct failure modes in the TypeShade examples:

- [RTC](https://typeshade.dev/playground/#example=fp64-rtc-twin): subtract before narrowing.
- [Checker plane](https://typeshade.dev/playground/#example=fp64-checker-plane-twin): preserve floor/fract phase.
- [LORAN](https://typeshade.dev/playground/#example=fp64-loran-twin): retain precision through distance differences.
- [Cancellation](https://typeshade.dev/playground/#example=fp64-cancellation-twin): avoid or accurately evaluate cancellation.
- [Sine sweep](https://typeshade.dev/playground/#example=fp64-sine-sweep-twin): reduce large arguments before narrowing.
