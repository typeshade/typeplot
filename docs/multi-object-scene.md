# Multiple mathematical objects in a plot scene

The scene retains one canvas, TypeShade Runtime, camera, input controller and glyph atlas.
The original callback remains `scene.content`; `scene.add(program, options)` prepares another
compiled callback and returns a transformable object. Objects expose stable IDs, parameters,
resident input replacement, visibility, opacity and local transitions. Groups use the existing
parent/local transform hierarchy, and `plot.timeline()` owns a shared animation clock.

Each named TypeShade object pass evaluates its SDF or height field into color and camera-depth
attachments. A GPU compositor orders the covered layers at each pixel and blends front to back.
This handles intersecting opaque and translucent objects independently of insertion order,
without a CPU geometry sort. Fields are evaluated once per changed object; composition reuses
unchanged tiles. The atlas uses RGBA8 color and packed f32 depth, avoiding floating-point render
target requirements for composition. Existing curve acceleration retains its tier checks.

Display attachments share a total pixel budget; object count and device dimensions bound
allocation. Export uses export-sized field evaluation and rejects requests exceeding those
limits. Picking queries the displayed depth layers on the GPU, then evaluates the selected
callback for its local mathematical point. It reports the stable object ID and node reference.

Independent 2D mathematical plots retain their existing behavior. Multiple spatial callbacks
share a 3D projection, with perspective and orthographic camera modes.
