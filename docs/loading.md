# Loading behavior

The browser build emits one shared ESM graph for `typeplot`, `typeplot/data`, interaction,
animation and transform entry points. Importing multiple entries shares the same TypeShade
runtime. Compiler and language-service dependencies remain in the separate Node entry.
The browser build checks every emitted module for accidental frontend dependencies.

Font PNGs are content-addressed assets rather than JavaScript data URLs. Common Latin,
Greek, Jamo and symbol glyphs retain their exact source pixels and native hinted size
buckets in the base atlas. A figure that uses precomposed Hangul syllables loads the full
atlas into its existing GPU texture before drawing or exporting that text. Figures share
compressed font bytes; GPU textures remain owned by each runtime. Failed requests can retry.
The texture layout and shader coordinates stay compatible with existing compiled programs.

Only the axes, series and text pipelines are prepared when a data renderer starts. Fields,
colorbars, label plates, annotation arrows and integer picking pipelines are cached on first
use. The initial atlas request overlaps pipeline creation. Function plots and sampled height
surfaces retain their existing TypeShade rendering paths; the sampled-grid program loads
when `createSurface` is called.

## Serving and bundling

Vite and other bundlers that support static `new URL(..., import.meta.url)` asset references
copy the fonts into their output. When serving built ESM directly, preserve the entire
`dist/` tree, including shared chunks and `dist/assets/`; copying only `index.js` is insufficient.
Package exports and synchronous figure handles are unchanged. `fig.ready` still waits for
the first complete frame, including any glyphs and pipelines that frame needs.

The website syncs this module/asset graph and records its content hash and source commit.
The default Playground loads the data API, then imports a GPU example only when selected.
The Playground preloads its base atlas; home/gallery previews retain visibility-based
hydration. Hashed `/_astro/` URLs have a one-year immutable cache policy, while HTML retains
normal revalidation so deployments can update module URLs.

## Manual measurement, 2026-10-24

The before build is `c3be4da58b300953a468012ead1c13e134233e0e`. The optimized build was
measured on `perf/initial-load` using the same compressed static server and Chromium with
SwiftShader WebGL2, a 390 × 844 CSS-pixel viewport, DPR 2, an 80 ms network latency limit,
500,000 bytes/s download throughput and 2× CPU slowdown. Each of three navigations used a
fresh browser context and disabled the HTTP cache. Values below are medians. These are
cloud software-renderer measurements, not physical phone performance or FPS claims.

| Measurement                                           |      Before |     After |
| ----------------------------------------------------- | ----------: | --------: |
| First WebGL chart draw call                           |    4,347 ms |  2,107 ms |
| Encoded same-origin resources through chart readiness | 1,608,725 B | 627,898 B |
| Encoded JavaScript                                    | 1,425,810 B | 299,902 B |
| Decoded JavaScript                                    | 3,258,879 B | 967,366 B |
| Main-thread long-task duration                        |      479 ms |    249 ms |

Network values exclude the HTML navigation, include font/style resources, and use gzip for
JavaScript and styles. The first-draw metric records command submission, not presentation
completion. CDN compression, hardware, warm caches and connection conditions change results.

Manual browser review confirms identical sine/cosine canvas pixels before and after, three
initial data pipelines, deferred Hangul uploads, late annotation/field/colorbar/picking
pipelines, PNG export, GPU preset changes, camera animation, touch orbit and pinch. WebGPU
function/grid surfaces, data fields, picking and PNG execute without validation errors;
the cloud Chromium review uses offscreen output/direct atlas upload to bypass its native
swap-chain/image-import issue. No repository test suite was added or run.
