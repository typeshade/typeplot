# TypePlot website product

TypeScript developers should be able to draw their first plot, inspect the code that produced
it, and continue into guides and the API. Show actual TypePlot output instead of mock charts.

The site follows TypeNN's website rules: Astro static pages, React islands, TailwindCSS v4,
Ant Design v5, IBM Plex fonts, English at `/` and separately authored Korean at `/ko/`.
Deploy only at `plot.typeshade.dev` using Cloudflare Worker static assets.

The data API renders arrays and host-sampled JavaScript functions through precompiled TypeShade shaders.
All grids, axes, ticks, text and series are shader-generated. TypeShade scalar
and parametric callbacks compile at build time and render through WebGPU or WebGL2. Keep
these paths explicit: ordinary JavaScript callbacks are not compiled shaders. Do not claim
full matplotlib compatibility, compilation of ordinary JavaScript callbacks, or fabricated benchmarks.

Use the repository README, source, declarations, and named shader examples as evidence.
Data APIs are currently unreleased. Pin installations to the recorded runtime source commit;
the v0.1.1 tag contains the GPU function API. Browser demos ship a local runtime with its
source commit and license. Never load a remote CDN runtime or evaluate arbitrary source text.

Visitor path: overview → first plot → data or GPU guide → API reference / playground / examples.
Each English route has a Korean counterpart with canonical and language alternate links.
Include actual controls, loading/error states, source links, resource cleanup, and a textual
description or table of plotted data. Label any software-rendered checks accurately.
