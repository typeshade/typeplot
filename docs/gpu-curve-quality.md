# GPU curve quality

Camera bounds must not define a parametric curve's parameter domain. Freeze the default
domain at creation, expose it explicitly, and let camera zoom/pan change only the view.

Evaluate curve distance directly in TypeShade. A configurable coarse search locates a
candidate interval, then local projected closest-point iterations evaluate the callback
itself to reduce chord artifacts. This remains a bounded numerical approximation for an
arbitrary callback; it does not construct or upload a path mesh.

GPU callback curves need the same parameter-coordinate dash controls as data curves.
The style, independent domain and quality settings should be editable without recreating
the plot. PNG output should use the same TypeShade pipeline and camera as the displayed
GPU plot, including its grid and labels.
