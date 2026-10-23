# Initial TypePlot library

The owner requested an independent TypePlot repository and package on 2026-10-23 UTC.
Extract the shared shader module and interaction controller from TypeShade site PR 233.
Provide build-time compilation of named TypeShade callbacks and a browser-only renderer
using the existing TypeShade runtime. Ship plain JavaScript and declarations for Git installs.
Keep the compiler out of the browser entry. Include 2D and genuine x/y/z examples.

Implementation in progress. Npm publication is outside this change.

The initial browser and compiler APIs are implemented. Four browser reviews passed:
WebGPU/WebGL2 at 1440/390 px, including parameter updates, pan/zoom, 3D view, reset,
invalid-input rejection and destruction. Browser evidence is in /workspace/shared/typeplot.
The browser bundle imports no compiler; the build checks emitted dependencies.
Low-level shader/interaction exports support integration into existing rendering hosts.

The Vite plugin compiles `.shade.ts?plot` and `.shade.ts?plot=3d` imports. Packed dependency
installation works in plain Node without a TypeScript loader. The installed Vite plugin
compiled both scalar and parametric examples. Entry source metadata uses relative paths so
output is reproducible across machines; this fixes the initial CI portability failure.
No compiler is shipped through the browser entry. The installable archive is generated with npm pack.
