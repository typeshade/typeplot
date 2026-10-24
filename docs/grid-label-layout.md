# Adaptive grid and label layout

## Coordinate and distance responsibilities

World coordinates define tick identity. An overlapping 1/2/5/10 decimal hierarchy adds intermediate
multiples with continuous scale-dependent alpha; common multiples retain full opacity.
This is a zoom-driven field, not an eased camera or a host-generated tick mesh.

Data axes choose horizontal spacing using formatted numeric advance and vertical spacing
using font height. Logarithmic ticks format the value difference between adjacent log
positions, rather than using the tick value as its precision. Scientific mantissas use
spacing-dependent precision as well.

Spatial axes invert the homogeneous projected line at the screen foot. Each fragment queries
the neighboring world multiples directly, instead of enumerating 16 ticks inside the camera
span. The same camera supplies axis fields, inverse rays, ground lattice and label anchors.
Density uses a local projection Jacobian at the central screen foot. Perspective spacing
away from that point additionally fades overlapping boxes. Common ticks have priority;
origin guards avoid three overlapping zeros and near-coincident x/z axes prioritize x labels.
This is a local layout policy, not a general global label-packing solver.

Font fill and halo come from one sampled X-GIS distance field. Rounded label backgrounds
use analytic box distance with three-CSS-pixel corners. Formatted text advance determines
plate width; atlas padding is preserved independently. Plate visibility follows its label.
Boxes are disabled by default; the default label treatment is a halo only.
Default halo is 0.8 CSS px; expansion is bounded by glyph padding to avoid clipping.
Data titles, axis descriptions and legend text have shader-rendered plates as well.
No Canvas2D, SVG or DOM chart overlays are introduced.

Visibility changes use reversible 160 ms opacity transitions, independent of direct camera
input. Reduced-motion preferences skip timed transitions. Data PNG export takes final
visibility, so exporting during a fade does not capture a partly hidden grid.

## Future geometric animation

Projection and field evaluation remain separate, but TypePlot does not yet expose arbitrary
model/view/projection matrices or non-linear deformation maps. Projective matrices preserve
straight lines. Curved-grid effects need a non-linear mapping, its inverse or another hit
strategy, and a Jacobian for distance/AA conversion. Arbitrary fields are not automatically
signed distance functions after a deformation.

Compared with Manim, additional work remains in scene graphs and hierarchical transforms,
deterministic timelines with parallel/sequential composition and seeking, semantic shape
correspondence for morphs, mathematical typesetting, annotation objects and fixed-step video
export. This change supplies grid/label quality and shared projection helpers only; it does
not claim to implement those animation systems.


## Direct input and release inertia

Dragging still applies pointer deltas immediately. A short low-pass filter estimates only
release velocity. After pointerup, exponential damping integrates displacement analytically
with respect to elapsed time; velocity is bounded, stale releases and pointer cancellation
do not launch momentum, and background pauses stop the fling. Rotation pitch and data
center retain their limits. New input, Escape, reset, reduced motion and destruction stop
animation. Double-click resets only the camera; data and style are unchanged.
