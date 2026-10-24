# TypeShade-backed rendering architecture

The implementation baseline is TypeShade `91c2fe31de045ebf0e5f2c333ac98b95cc460280`,
the revision in package.json. Capability claims below come from that revision's public
runtime, device, resident and fuse sources, not from design-direction documents.

## Responsibilities

| Existing TypeShade capability                                                                   | TypePlot responsibility                                                                             |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Named shader functions/classes, typed IR, WGSL/GLSL emission and reflected layouts              | Mathematical plot semantics, supported callback contracts and build-time artifacts.                 |
| Runtime.load, Program.render and normalized pipeline caching                                    | Select named stages and bind scene snapshots; retain resolved handles for their use.                |
| Runtime.frame, render/compute passes, attachments, viewport/scissor, depth/stencil and blending | Describe the passes a plot needs and the intended composition. Respect tier refusals.               |
| Runtime.texture, texture readback, resident bindings                                            | Own plot-created textures and semantic caches; explicitly retire them before closing their runtime. |
| Device.array/release, pooling, wait/dispose and device-loss information                         | Give resident observations one owner and keep them resident across camera/style changes.            |
| Device.fuse, scratch storage, reports and time-budgeted kernel chunks                           | Supply real compatible kernel chains when data work needs them, and inspect reports.                |
| CPU evaluation and emulated f64 kernels                                                         | Verify mathematical operations and choose precision deliberately at data/projection boundaries.     |

Public source references at the pinned revision:
[runtime](https://github.com/typeshade/typeshade/blob/91c2fe31de045ebf0e5f2c333ac98b95cc460280/src/runtime/runtime.ts),
[render state and pipelines](https://github.com/typeshade/typeshade/blob/91c2fe31de045ebf0e5f2c333ac98b95cc460280/src/runtime/program.ts),
[device](https://github.com/typeshade/typeshade/blob/91c2fe31de045ebf0e5f2c333ac98b95cc460280/src/runtime/device.ts),
[resident values](https://github.com/typeshade/typeshade/blob/91c2fe31de045ebf0e5f2c333ac98b95cc460280/src/core/resident.ts),
[fuse](https://github.com/typeshade/typeshade/blob/91c2fe31de045ebf0e5f2c333ac98b95cc460280/src/fuse.ts).

The compiler remains a Node/build-time dependency. A browser consumes compiled programs.
TypeShade already owns backend command execution and pipeline caching; TypePlot should not
introduce another GPU API, shader generator, command encoder or buffer pool.

## Boundaries for the structural migration

```text
Figure / Axes / Plot public API          Timeline and interaction
              |                                  |
              v                                  v
     typed render snapshots                 frame requests
              |                                  |
              +-------------+--------------------+
                            v
                   host frame scheduling
                            |
                  data / procedural renderer
                            |
                     render session
                            |
              TypeShade Runtime + owned Device
```

The public facade exports APIs and overloads. Procedural plot implementation, figure/data
models, host scheduling and session lifetime have separate modules. A figure snapshot
describes one render; it is not the future public scene graph. Numeric source values retain
their logical identity while renderer-specific packing chooses the current f32 representation.

Host scheduling coalesces invalidations and keeps one display render in flight. It does not
replace the TypeShade kernel queue or the animation clock. A seek still waits for its render,
and an idle plot creates no continuing animation loop.

A render session borrows its Runtime's device for resident computation on WebGPU, tracks
asynchronous preparation/readback, and retires plot resources before disposing Device and
Runtime. The current TypeShade API rejects createDevice({ runtime }) on WebGL2; that tier
uses resident handles bound by its render runtime, without process-global configure calls.
Plot-created texture handles need explicit destruction, especially with borrowed contexts.

## Computation and rendering

Current SDF curve/axis/label preparation consists of render passes. It belongs to
Runtime.frame(), including passes that prepare lookup textures. A draw cannot be recorded
inside fuse(). Merely wrapping rendering in a fuse scope would not fuse it.

Future data operations can use Device.fuse() for actual named kernel calls. Compilation must
record fusion facts, inputs/outputs must satisfy residency/ownership contracts, and dependency
patterns must permit fusion. Cross-index reads can split a plan. The returned FuseReport is
the evidence of dispatches/submissions, not the existence of a fuse call in source.

Device time budgets size chunks of compute work. They do not automatically bound the time of
an arbitrary fragment ray search. Similarly, emulated f64 in TypeShade does not make the
current f32 camera uniforms and observation packing double precision.

## Compatibility and subsequent work

This migration uses existing data artists, callbacks, cameras, picking, PNG and timelines as
its compatibility baseline. Public scene nodes, group transforms, additional charts, general
surfaces, text layout and video production are subsequent consumers of the foundation.
Rendering remains in named TypeShade shaders, with the existing axis widths, procedural dash
semantics, asynchronous startup and complete-frame readiness.
