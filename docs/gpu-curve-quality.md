# Procedural curve rendering and camera independence

Scalar callbacks and arbitrary spatial callbacks have distinct mathematical representations.

Scalar graphs evaluate the implicit field y - f(x) over the entire visible plane. In 3D,
the shader intersects inverse camera rays with z=0, using the same camera as the ground
lattice. No fixed parameter domain, 96-segment loop or path mesh remains in this path.
The screen-distance estimate uses derivatives of the coordinate transform and finite
callback slopes, with four footprint samples for antialiasing. The estimate is local;
arbitrary frequencies below a pixel and f32 precision still limit resolved detail. Exact
edge-on views of the graph plane are degenerate and do not have a unique inverse-plane
coordinate. In this narrow singular view, a bounded numerical callback-distance search
covers a view-relative parameter window extending 32 maximum camera spans on either side
of the focus. This avoids dropping the whole graph at the singular orientation, but does
not promise global coverage for an arbitrary callback at an exactly edge-on projection.

Arrays are finite observations. JavaScript callbacks on supplied x arrays remain sampled
data. Extending a mathematical function requires a named TypeShade scalar callback; the
renderer must not invent observations by extrapolating finite arrays.

General spatial callbacks use an independent parameter domain, frozen at creation and
editable with setDomain. Camera zoom/pan affects only the view. A configurable candidate
search locates parameter intervals, then local projected closest-point iterations evaluate
the callback itself. The three nearest candidates are refined to reduce missed branches.
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

Automatic data dashes now select a power-of-two density level in parameter space from the
current viewport. This keeps the Playground cosine's round caps separated when zoomed
out, while reusing resident sample data. Explicit dashPeriod retains fixed parameter
spacing, which can become subpixel; it is not silently replaced by pixel arc lengths.
Index-coordinate data uses a projected data-envelope estimate for automatic density.

Playground switches retain intrinsic width inside grid fields instead of stretching to
the full input column width, on desktop and mobile.
