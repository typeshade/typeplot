# GPU curve search acceleration

The unbounded helix at quality 128 exposed excessive fragment work: every physical pixel
repeated the complete parameter search, camera-focus estimation and projected axis-label
layout. A procedural distance query still needs spatial acceleration. Being an SDF-like
field does not make a global closest-point search constant-time.

## Rendering architecture

Newly compiled parametric programs declare `acceleration: "tiles-v1"`. TypeShade Runtime
records four named render passes when the view changes:

1. `buildSpatialLabels` prepares a one-dimensional projected-axis layout. It stores exact
   tick values, anchors, density/overlap fades and axis-name locations, with column spacing
   no larger than one physical pixel. The final pass still evaluates glyph SDF coverage at
   display resolution; this is not a low-resolution text image.
2. `buildCurveIntervals` stores two clipped search parts per requested interval in an
   RGBA32F texture. Near-plane clipping and continuity checks evaluate the callback. Each
   record contains parameters, projected endpoints, midpoint and a sampled-bending guard.
3. `buildCurveCandidates` builds an RGBA32UINT bit mask for each screen tile. All 1024
   possible parts have individual bits. Bounds and proxy-distance guards reject distant
   parts; no top-k list, atomics or fixed candidate-list overflow discards intersections.
4. `draw` queries only the tile's candidates, refines actual projected callback positions,
   and evaluates final curve, grid, axis and text coverage. Proxy chords supply seeds and
   bounds, never final curve coverage. Refinement may stop at unchanged f32 iterates or
   fully opaque coverage without changing the displayed result.

The host supplies resources and coherent camera uniforms, including a rotation basis
computed once per frame. It creates no path vertices, projected curve arrays or host label
images. Search and label caches have separate invalidation keys, are reused on unchanged
redraws and are destroyed with the plot. A hidden curve skips candidate construction and
updates only its probe record. No persistent buffer grows with interaction history.

These are rendering passes, owned by Runtime. There is no compute kernel chain here to
wrap in `fuse`. Data plots continue to retain their input through Device. Dashes continue
to use callback parameters, without a path-length prefix sum. `quality.samples`,
`quality.refinements` and display density are not lowered during interaction.

WebGPU supports the cache targets directly. WebGL2 uses them with
`EXT_color_buffer_float`; otherwise the reference fragment query remains available.
`createPlot(canvas, program, { acceleration: false })` selects that reference explicitly.
Old compiled programs use their original entry point and bindings. Recompile to gain the
new cache. WebGL2 display submissions also wait on a nonblocking GPU fence, allowing the
existing redraw loop to coalesce input instead of queuing outdated frames indefinitely.
WebGPU Runtime submissions already wait for GPU completion. Destroying a plot releases
pending fence waiters.

## What Manim and matplotlib do

[3b1b/manim's stroke shader](https://github.com/3b1b/manim/blob/fafa083a4fb274bba9cabde0b6e2f50ba6da0622/manimlib/shaders/stroke.wgsl)
stores quadratic Bezier controls and expands adaptive strips around them on the GPU,
with bounded subdivision and rounded joints. Its fragment shader evaluates coverage
inside that limited raster footprint. It does not run a global implicit query for every
pixel or guarantee infinitely resolved arbitrary function domains.

[matplotlib's path converters](https://github.com/matplotlib/matplotlib/blob/39b27ddaafe636f06776a2044b5df05d07648dc4/src/path_converters.h)
clip paths and simplify projected vertices using a pixel-distance threshold. Its ordinary
line workflow supplies finite sampled paths to renderers such as Agg; mplot3d projects
data into that plotting pipeline. Blitting can reuse static backgrounds, but a changing
camera still requires updating affected content.

The common principle is to limit repeated work to what can affect the image. TypePlot
applies it with resident GPU search records while retaining actual callback evaluation
and procedural coverage. It does not adopt Manim's stroke meshes or matplotlib's CPU
path renderer. No external implementation code was copied for this change.

## Manual validation, 2026-10-24

In headless Chromium with SwiftShader WebGL2, a 350 by 350 CSS-pixel canvas at DPR 2
(700 by 700 physical pixels), the unbounded helix used 128 search samples and five
refinements. Seven camera-changing redraws were timed after initialization; a one-pixel
`readPixels` after each redraw ensured actual GPU completion. The median of the last five
was 6879.7 ms before acceleration and 827.5 ms after it, about 8.3 times faster. This is a
software-renderer reproduction, not an iPhone frame-rate measurement. A queue-only timing
or `gl.finish` without a confirming readback was not used as performance evidence.

Reference and cached paths produced pixel-identical screenshots in nine manual WebGL2
scenes: default perspective, a fold, a near-camera view at 512 samples, orthographic,
finite-domain dashes, a half-infinite domain, a 16-sample finite domain, a hidden curve
with a visible probe, and a resized canvas. No GL errors or page errors were reported.
The comparison covers these scenes, not every possible callback.

Native WebGPU executed all cache passes and returned rendered pixels without validation
errors. The cloud Chromium swap-chain interop failed independently of these shaders;
manual QA substituted an offscreen GPU output texture and uploaded the exact offline
font bytes directly. Across five reference/cache comparisons (perspective, near-camera
512 samples, orthographic dashes, hidden curve and resize), four images matched exactly;
the remaining image differed by more than eight channel levels at one pixel, with a
maximum difference of ten. Neither QA substitution is in the product runtime.

Real CDP touch events also confirmed data/3D-scalar pinch and pan plus double-tap camera
reset at a 390-pixel mobile viewport with DPR 2. Legacy manifests, scalar projection
changes, destroying a plot during a redraw, and a 600 by 520 PNG data export completed
without page or GL errors. These browser checks do not replace physical iPhone profiling.

## Remaining limits

The bending guard is sampled, not a certified enclosure for arbitrary callbacks.
Unbounded compactification, f32 phase precision, quality budgets and local closest-point
refinement still limit resolved coverage. This cache cannot prove that every branch was
found. Many genuinely overlapping projected intervals remain expensive, and expensive
callbacks still cost GPU time. These limits require further algorithmic work or explicit
domain/quality choices; they are not solved by claiming an exact analytic SDF.
