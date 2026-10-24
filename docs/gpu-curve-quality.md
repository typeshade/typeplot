# Procedural curve rendering and camera independence

Scalar callbacks and arbitrary spatial callbacks have distinct mathematical representations.

Scalar graphs represent y = f(x) over the entire visible plane. In 3D,
the shader intersects inverse camera rays with z=0, using the same camera as the ground
lattice. No fixed parameter domain, 96-segment loop or path mesh remains in this path.
The 2D screen-distance estimate uses derivatives of the coordinate transform and finite
callback slopes. In 3D each of four physical subpixel rays is inverted separately, then a
local projected closest-point query measures distance to actual callback positions. In
compressed regions a bracketed search inside the inverse-projected pixel interval resolves
additional crossings. Chords and world-gradient divisions never supply 3D scalar coverage.
The query remains numerical; arbitrary subpixel frequencies and f32 precision still limit
resolved detail. Exact
edge-on views of the graph plane are degenerate and do not have a unique inverse-plane
coordinate. In this narrow singular view, a bounded numerical callback-distance search
covers a view-relative parameter window extending 32 maximum camera spans on either side
of the focus. This avoids dropping the whole graph at the singular orientation, but does
not promise global coverage for an arbitrary callback at an exactly edge-on projection.

Arrays are finite observations. JavaScript callbacks on supplied x arrays remain sampled
data. Extending a mathematical function requires a named TypeShade scalar callback; the
renderer must not invent observations by extrapolating finite arrays.

General spatial callbacks use an independent mathematical parameter domain, defaulting to
[-Infinity, Infinity] for newly compiled programs and editable with setDomain. Unbounded
search uses a rational compactification around a local camera-focus seed. Its tails approach
infinity, but the f32 endpoint guard and finite numerical quality limit resolved coverage;
it does not guarantee that all branches of an arbitrary callback are found. Explicit finite
domains retain their endpoints. Camera zoom/pan affects only the view. A configurable candidate
search locates parameter intervals, then local projected closest-point iterations evaluate
the callback itself. Every projected interval within a sampled-bending guard is queried;
there is no global top-three midpoint ranking. Each interval's two halves get
perspective-correct parameter seeds, actual-callback refinement and shared endpoint
coverage. Near-plane crossings are clipped in parameter space using actual callbacks.
No segment SDF or uploaded path mesh defines the final curve. This remains a bounded
numerical approximation, with configurable samples and refinements; high-frequency or
very complex callbacks can need additional samples and are not claimed to have an exact
closed-form SDF. Near-plane visibility is checked on actual callback positions.

Both callback paths support procedural dashes in curve-parameter coordinates. The scalar
parameter is x, the spatial parameter is t. No cumulative path-length buffer, prefix scan,
compute stage or artificial fuse wrapper is required for these direct fragment fields.

3D wheel zoom anchors the camera focus plane under the pointer. The existing direct
pointer orbit/pan behavior and frame coalescing are preserved. Perspective still has
natural depth-dependent parallax; orthographic focus-plane anchoring is exact.

The Playground provides a separate GPU continuous sine example so visitors can compare
finite sampled data with an unbounded mathematical function. Spatial domains and search
quality remain explicit controls. GPU callback PNG export remains a separate future task;
data figure exports continue to use their existing GPU readback path.

Numeric ticks separate the atlas bearing from character advance and evaluate adjacent
padded glyph cells; advance no longer clips the right edge of 0 and other digits. Font
encoding now reuses X-GIS's exact computeSDF implementation (pinned source and MIT notice
in scripts/vendor and assets), with continuous alpha seeds and radius 8 / edge 192. The
TypeShade font sampler adopts X-GIS's edge 0.75 and physical-size AA rule. All font input
rasterization remains offline. Native hinted ASCII buckets at 12/24/48 pixels are
selected by physical glyph size; the generator preserves original alpha instead of
resampling it, preventing ringing from becoming visible secondary SDF contours. Default
display density now follows DPR up to four, within the existing render budgets. The browser does not use Canvas2D text or DOM overlays.

Automatic data dashes select a signed power-of-two density level in parameter space from
the current viewport, refining on zoom-in as well as coarsening on zoom-out. This keeps the Playground cosine's round caps separated when zoomed
out, while reusing resident sample data. Explicit dashPeriod retains fixed parameter
spacing, which can become subpixel; it is not silently replaced by pixel arc lengths.
Index-coordinate data uses a projected data-envelope estimate for automatic density.

Playground switches retain intrinsic width inside grid fields instead of stretching to
the full input column width, on desktop and mobile.

## Projected interval continuity correction

The former top-three midpoint ranking produced gaps even with solid strokes. A long or
curved interval can pass close to a fragment while its midpoint is farther away than the
midpoints of unrelated intervals. Discarding it changes the selected distance abruptly
across pixels. AA cannot repair this missing interval; it only filters the supplied field.

The renderer now inspects every interval within a projection-aware bending guard. Chords
only seed/cull the numerical query; final coverage always uses actual callback positions.
Screen fractions are mapped back to parameters using homogeneous w, shared interval
endpoints remain in the result, and near-plane clipping bisects actual callback positions.
No sampled polyline is introduced as a rendering primitive. The guard remains numerical,
not a certified enclosure for arbitrary high-frequency callbacks.


## Projective-pole correction

Near the graph plane's vanishing line, the inverse coordinates and their derivatives grow
without bound. The old linearized `abs(y-f(x))/length(gradient)` estimate could shrink toward
zero for pixels far outside the projected curve. Four samples of that same center-ray
linearization did not fix its geometry and could cross the pole together.

The replacement uses actual projected callback points for distance. A finite-search miss
can omit coverage, but cannot create an arbitrarily wide stroke by inflating the inverse
Jacobian. Pixel samples have independent rays and near-plane visibility checks. Dense
crossings receive a safeguarded bracket query, followed by actual-point validation; no
polyline mesh or artificial domain clipping is introduced. Exact edge-on views retain the
existing explicitly bounded fallback described above.

The acceptance radius is the requested CSS stroke radius plus physical-pixel AA; it does
not grow with inverse-projection derivatives. This is a geometric coverage bound, not a
claim of exact global closest-point distance or arbitrary-precision phase evaluation.
Increasing arithmetic precision alone would not correct the former invalid distance model.
