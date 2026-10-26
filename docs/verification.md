# Curve coverage verification

`npm run check:coverage` compares the shader's own curve distance queries with an exact
ground truth on the CPU. CI runs it on every push and pull request. This document records
why the check exists, what it measures and what it does not cover yet.

## Why earlier visibility defects reached `main`

Four curve visibility defects reached `main` in four days: fb51c63, c0b26cb, d11039d and
#27 (a 3D `sqrt` curve broken at x = 0). The owner found each one by eye. The causes were
these:

1. No check evaluated rendering. CI built the package, the examples and the website. No
   step ran a distance query against a reference. The repository rule was "Do not add or
   run tests unless the owner requests verification".
2. Verification was manual and case-specific. The review in
   [adaptive-visibility.md](adaptive-visibility.md#manual-review) covered three helix views
   and one sine surface in a headless browser. It was not kept as a repeatable procedure,
   and it did not include a scalar curve beside an omitted domain.
3. The omitted-domain contract had no single definition. A callback value of magnitude at
   least 1e18 omits a point, but 64 inline tests applied it with different policies:
   stop the search, skip the sample, drop the interval or take a one-sided derivative. #27
   fixed one path. An audit then found the same defect class in six more.
4. Fixed counts and fixed steps hid a scale assumption. A 12-step bisection and a fixed
   derivative step of 1e-4 parameter units are pixel-accurate at the default zoom only.
   `x^0.25` climbs 3.8 px between parameters 0 and 1e-6.
5. Each search had its own implementation. 2D and 3D scalar curves used different
   queries, and four separate refiners look for the nearest callback point. A fix in one
   did not reach the others.
6. The demonstrations used benign values. The Playground power function starts at
   exponent 2. The infinite slope appears only after the exponent moves below 1.

## Structural changes

- `present()` and `presentPoint()` in `shaders/plot.shade.ts` state the omitted-domain
  contract once. Every callback value goes through them, and NaN is omitted everywhere.
- `scalarDomainEdge` bisects a valid/omitted pair to the arithmetic's resolution, so the
  drawn endpoint is the callback's endpoint. `scalarCrossing` stops within an eighth of a
  pixel. `scalarStep` takes the derivative step from the pixel size, not a constant.
- 2D scalar curves keep the tangent-line estimate where it is valid. Beside an omitted
  domain, on a steep branch, or where the tangent line disagrees with the callback at its
  foot point, they use the 3D projected query through `flatView`. The hard cases have one
  implementation.
- `src/plot-source.ts` builds the program documents for `compilePlot` and for the check,
  so the check compiles the text that a plot program ships with.

## What the check measures

`scripts/coverage-check.ts` compiles a catalog of callbacks with `plotSource`.
TypeShade's CPU oracle (`compileModuleJs`, precision `f32`) then evaluates
`projectedScalarDistance` (3D) and `scalarField` (2D) as a correctly rounding f32 machine.

- Callbacks: `sqrt` and `x^0.25` beside an omitted domain, a semicircle with an edge on
  each side, `log` with its steep part near zero, `sin(3x)` and `sin(40x)`.
- Views: 2D, orthographic 3D (front and turned), perspective 3D, at 1x and 100x zoom.
- Pixels: a 24 by 24 window around each hard point, with the shader's four subsamples.
- Truth: the exact JS twin of each callback at f32 parameters. Intervals subdivide until
  each projected chord is below 0.2 px. Each domain edge bisects to the last valid f32
  parameter. Parameters one f32 step apart stay separate points, never a chord.
- Failure: a pixel the truth covers (> 0.5) that the shader leaves (< 0.25), or the
  reverse (< 0.05 against > 0.5). Pixels covered only by isolated f32 points are reported
  as the f32 floor and do not fail: there, no f32 renderer can draw between the points.

The check takes about 40 seconds. `npm run check:coverage -- --only <name>` runs one
callback and prints an ASCII map of each failing window.

## Not covered yet

- Texture-sampling paths. The CPU oracle stubs texture reads, so the cached adaptive
  curves (`cachedCurveHit`, `plot3DAccelerated`) and the label caches are not evaluated.
- Parametric curves, picking and surfaces. The audit of 2026-10-26 found the same
  defect class in `parameterFocus`, `prepareCurveIntervals`, `trajectoryDistance`,
  `referenceSceneHit`, `pickTrajectory` and `surfaceHit`. These are open, and each fix
  adds its cases to the check.
- GPU parity. The oracle rounds f32 operations correctly but does not model GPU
  transcendental precision or fused multiply-add. A browser render remains the final
  check of a visual change.
- Cost. The 2D fallback adds callback evaluations near edges, steep branches and sharp
  extrema. It has not been measured on a GPU.

## Procedure for a visibility defect

1. Add the callback and the hard point to the catalog in `scripts/coverage-check.ts`.
2. Run `npm run check:coverage` and confirm that the new case fails.
3. Fix the shader.
4. Run `npm run check:coverage` and confirm that every case passes.
5. Commit the case with the fix.
