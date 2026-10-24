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

`preloadFonts` from `typeplot/resources` starts the same shared download without importing
the plotting runtime or allocating a decoded image, device or texture. Call it in the browser:

```ts
import { preloadFonts } from "typeplot/resources";

const [, { subplots }] = await Promise.all([
  preloadFonts(),
  import("typeplot/data"),
]);
const {
  fig,
  axes: [ax],
} = subplots(1, 1, { target: "#chart" });
ax.plot([1, 2, 3]);
await fig.ready;
```

`preloadFonts({ korean: true })` also downloads the full Hangul resource. Compressed bytes
are shared across preloads and figures, including requests still in flight. Each runtime
continues to own its image upload and GPU texture.

Only the axes, series and text pipelines are prepared when a data renderer starts. Fields,
colorbars, label plates, annotation arrows and integer picking pipelines are cached on first
use. The atlas request starts before backend selection; bitmap decoding starts ahead of
pipeline creation. GPU function plots prepare their render/cache pipelines and resident
data device concurrently on WebGPU, settling every resource before error cleanup. Their
picking pipeline is created by the first query; registering listeners creates no pipeline.
Destroying during that preparation waits for it before disposing the runtime. WebGL's
current TypeShade pipeline creation remains synchronous; its download and decode work
overlaps startup instead. The sampled-grid program loads when `createSurface` is called.

## Serving and bundling

Vite and other bundlers that support static `new URL(..., import.meta.url)` asset references
copy the fonts into their output. When serving built ESM directly, preserve the entire
`dist/` tree, including shared chunks and `dist/assets/`; copying only `index.js` is insufficient.
Package exports and synchronous figure handles are unchanged. `fig.ready` still waits for
the first complete frame, including any glyphs and pipelines that frame needs.

The website syncs this module/asset graph and records its content hash and source commit.
The default Playground loads the data API, then imports a GPU example only when selected.
A small entry starts its font request and real default chart independently of the React
controls. The controls adopt that live figure through Astro's static HTML slot, without
recreating its context, data or canvas. Unchanged initial frequency and legend settings do
not submit extra frames. Highlighting loads on idle after chart readiness, while plain code
is available immediately. Home/gallery previews retain visibility-based hydration.

The build integration derives module preloads from Rollup's actual static dependency graph.
When an immediate chart is present it also preloads the small fallback backend, identified
by the library build metadata. This fetches/compiles modules without selecting a backend or
creating a second device. Optional GPU examples stay deferred. Font downloads use the shared
resource entry instead of consuming an in-flight `as=fetch` preload body, which failed in
throttled Chromium review. Hashed `/_astro/` URLs retain a one-year immutable cache policy;
HTML uses normal revalidation so deployments can update module URLs.

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

## Follow-up asynchronous startup measurement

The immediate baseline is `1112be54686e302146d286b6f427368814e29260`. The follow-up build
on `perf/async-first-render` uses the same three fresh-context, gzip, 4 Mbps / 80 ms,
390 × 844 / DPR 2, SwiftShader WebGL2 and 2× CPU slowdown conditions. The readiness metric
observes the reset control becoming enabled after `fig.ready`, rather than treating the
first draw call as a completed GPU frame.

| Measurement                      |   Before |    After |
| -------------------------------- | -------: | -------: |
| First WebGL chart draw call      | 2,077 ms | 1,757 ms |
| Chart ready and controls enabled | 2,879 ms | 2,610 ms |
| Main-thread long-task duration   |   302 ms |   252 ms |

With control-module delivery deliberately delayed for a separate ordering check, the chart
draws before the controls hydrate, uses one WebGL context, submits one initial frame and
fetches the base font once. The resulting default canvas is pixel-identical to the baseline.
Native WebGPU review observes two simultaneous initial surface pipelines; registering
hover listeners adds none, and the first pick creates the third. Cancellation during that
first pick completes without validation errors. Desktop/mobile preset changes, animation,
touch input and PNG exports remain functional. These measurements retain the software
renderer limitations above and make no physical-device FPS claim.
