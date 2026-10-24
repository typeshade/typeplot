import { CurveOrigin, type OriginPacket } from "./origin.js";
import { relativeFrame } from "./relative.js";
import type {
  Frame,
  Pack,
  RenderPass,
  RenderPipeline,
  Resident,
  Runtime,
  Texture,
} from "typeshade/runtime";
import type {
  PlotProgram,
  PlotQuality,
  SurfaceDomain,
  SurfaceOptions,
} from "../types.js";
import type {
  PlotScene,
  SceneNode,
  SceneObjectHandle,
  SceneObjectOptions,
  SceneObjectStyle,
} from "../scene.js";
import { surfaceOptions, surfaceDomain, surfaceUniforms } from "../surface.js";
import { color } from "./color.js";
import { WorkScope } from "./lifetime.js";
import { RenderSession } from "./session.js";

export type UniformValues = Readonly<Record<string, unknown>>;
export type LoadedProgram = ReturnType<Runtime["load"]>;
export interface CurveCache {
  intervals: Texture;
  seeds?: Texture;
  groups?: Texture;
  candidates: Texture;
  key: string;
}
export interface ScenePrimaryFrame {
  readonly u: UniformValues;
  readonly bindings: Readonly<Record<string, unknown>>;
  readonly generation: number;
  readonly cache?: CurveCache;
}
export interface ScenePacket {
  readonly field: SceneField;
  readonly u: UniformValues;
  readonly bindings: Readonly<Record<string, unknown>>;
  readonly key: string;
  readonly geometry: string;
  readonly cache?: CurveCache;
  readonly external: boolean;
  readonly origin?: OriginPacket;
}
const finite = (value: number, name: string) => {
  if (!Number.isFinite(value) || Math.abs(value) > 3.402823466e38)
    throw new RangeError(`${name} must be finite within the f32 range.`);
  return value;
};
function domain(value: readonly [number, number]): readonly [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some(
      (v) =>
        typeof v !== "number" ||
        Number.isNaN(v) ||
        (Number.isFinite(v) && Math.abs(v) > 3.402823466e38),
    ) ||
    !(value[1] > value[0]) ||
    (value.every(Number.isFinite) && value[1] - value[0] > 3.402823466e38)
  )
    throw new RangeError(
      "Curve domains need increasing f32 endpoints or infinities.",
    );
  return [value[0], value[1]];
}
function quality(
  value: PlotQuality,
  previous = { samples: 128, refinements: 5 },
) {
  const result = { ...previous, ...value };
  for (const [name, low, high] of [
    ["samples", 16, 512],
    ["refinements", 1, 8],
  ] as const)
    if (
      !Number.isSafeInteger(result[name]) ||
      result[name] < low ||
      result[name] > high
    )
      throw new RangeError(
        `quality.${name} must be an integer from ${low} to ${high}.`,
      );
  return result;
}
const DEFAULT_STYLE: Required<SceneObjectStyle> = {
  color: "#ff7f0e",
  curveWidth: 2,
  lineStyle: "-",
  dashPeriod: 0.2,
  dashOffset: 0,
  depthBias: 0,
};
function style(
  value: SceneObjectStyle,
  previous = DEFAULT_STYLE,
): Required<SceneObjectStyle> {
  for (const key of Object.keys(value))
    if (!(key in DEFAULT_STYLE))
      throw new TypeError(`Unknown scene style '${key}'.`);
  const result = { ...previous, ...value };
  if (
    typeof result.color !== "string" ||
    !result.color.trim() ||
    !["-", "--", ":"].includes(result.lineStyle)
  )
    throw new TypeError("Invalid scene curve appearance.");
  if (
    !Number.isFinite(result.curveWidth) ||
    result.curveWidth < 0 ||
    result.curveWidth > 32 ||
    !Number.isFinite(result.dashPeriod) ||
    result.dashPeriod <= 0
  )
    throw new RangeError(
      "Curve width must be 0–32 CSS px and dashPeriod must be positive.",
    );
  finite(result.dashOffset, "dashOffset");
  finite(result.depthBias, "depthBias");
  return result;
}
/** Per-callback resources. The shared TypeShade Runtime owns pipelines and submissions. */
export class SceneField implements SceneObjectHandle {
  private readonly work = new WorkScope();
  private readonly manifest: Pack;
  private readonly inputNames: string[];
  private readonly data = new Map<string, Float32Array>();
  private readonly inputs: Record<string, Resident<Float32Array>> =
    Object.create(null);
  private readonly retired = new Set<Resident<Float32Array>>();
  private values: Record<string, number>;
  private curveDomain: readonly [number, number];
  private search: ReturnType<typeof quality>;
  private appearance: Required<SceneObjectStyle>;
  private ink: number[];
  private surface: Required<SurfaceOptions>;
  private bounds: SurfaceDomain;
  private automaticDepth: boolean;
  private readonly initial: {
    parameters: Record<string, number>;
    domain: readonly [number, number];
    quality: ReturnType<typeof quality>;
    style: Required<SceneObjectStyle>;
    surface: Required<SurfaceOptions>;
    bounds: SurfaceDomain;
    automaticDepth: boolean;
  };
  private drawPipeline!: RenderPipeline;
  private intervalPipeline?: RenderPipeline;
  private seedPipeline?: RenderPipeline;
  private groupPipeline?: RenderPipeline;
  private candidatePipeline?: RenderPipeline;
  private queryPipeline?: Promise<RenderPipeline>;
  private displayCache?: CurveCache;
  private generation = 0;
  private closed = false;
  private retirement?: Promise<void>;
  readonly accelerated: boolean;
  constructor(
    readonly id: string,
    readonly node: SceneNode,
    readonly program: PlotProgram,
    readonly loaded: LoadedProgram,
    private readonly owner: RenderSession,
    private readonly scene: PlotScene,
    private readonly doc: Document,
    private readonly invalidate: () => void,
    options: SceneObjectOptions,
    readonly primary: boolean,
    accelerate: boolean,
  ) {
    if (
      program.version !== 1 ||
      program.composition !== "layers-v1" ||
      !["scalar", "parametric", "surface"].includes(program.kind)
    )
      throw new Error(
        "Recompile this mathematical program for scene composition.",
      );
    this.manifest = program.manifest as Pack;
    this.inputNames = this.manifest.bindings
      .filter(
        (b) =>
          b.space === "storage" &&
          b.access === "read" &&
          b.type === "array<f32>",
      )
      .map((b) => b.name);
    this.values = { ...program.parameters };
    for (const [name, value] of Object.entries(this.values))
      finite(value, name);
    this.checkParameters(options.parameters ?? {});
    Object.assign(this.values, options.parameters);
    this.curveDomain = domain(options.domain ?? [-Infinity, Infinity]);
    this.search = quality(options.quality ?? {}, {
      samples: program.cacheFormat === "uint-v1" ? 64 : 128,
      refinements: 5,
    });
    this.appearance = style(options.style ?? {});
    this.ink = color(this.appearance.color, doc);
    this.surface = surfaceOptions({ ...options.surface, colorBar: false });
    if ("colorBar" in (options.surface ?? {}))
      throw new TypeError(
        "Additional objects use the primary plot's color-bar controls.",
      );
    this.bounds = surfaceDomain(
      options.surfaceDomain ?? {
        x: [-Infinity, Infinity],
        z: [-Infinity, Infinity],
      },
    );
    this.automaticDepth = options.surface?.depthRange === undefined;
    if (
      program.kind !== "surface" &&
      (options.surface || options.surfaceDomain)
    )
      throw new TypeError("Surface settings need a surface callback.");
    if (!primary) {
      for (const [name, values] of Object.entries(options.data ?? {})) {
        if (
          !this.inputNames.includes(name) ||
          !(values instanceof Float32Array) ||
          !values.length
        )
          throw new TypeError(
            `data.${name} needs a declared nonempty Float32Array.`,
          );
        this.data.set(name, values);
      }
      for (const name of this.inputNames)
        if (!this.data.has(name))
          throw new TypeError(`Missing scene input '${name}'.`);
    }
    this.accelerated =
      program.kind !== "surface" &&
      accelerate &&
      (program.cacheFormat === "uint-v1" ||
        owner.runtime.tier === "webgpu" ||
        !!(owner.runtime.device as WebGL2RenderingContext).getExtension(
          "EXT_color_buffer_float",
        ));
    this.initial = {
      parameters: { ...this.values },
      domain: this.curveDomain,
      quality: this.search,
      style: this.appearance,
      surface: this.surface,
      bounds: this.bounds,
      automaticDepth: this.automaticDepth,
    };
  }
  private originResources?: CurveOrigin;
  private alive(): void {
    if (this.closed) throw new Error("This scene object has been removed.");
  }
  initialize(externalCache = false): Promise<void> {
    return this.work.run(async () => {
      if (!this.primary && this.program.parameterOrigin)
        this.originResources = new CurveOrigin(
          this.owner,
          this.loaded,
          this.manifest,
          Object.keys(this.values),
        );
      const jobs: Promise<unknown>[] = [
        this.originResources?.initialize() ?? Promise.resolve(),
        this.owner
          .run(() =>
            this.loaded.render({
              vertex: "fullscreen",
              fragment:
                this.accelerated || this.program.kind === "surface"
                  ? "drawLayer"
                  : "drawLayerReference",
              targets: ["rgba8unorm", "rgba8unorm"],
            }),
          )
          .then((p) => {
            this.drawPipeline = p;
          }),
      ];
      if (this.accelerated && !externalCache) {
        if (this.program.curveSearch === "adaptive-v1")
          jobs.push(
            this.owner
              .run(() =>
                this.loaded.render({
                  vertex: "fullscreen",
                  fragment: "buildCurveGroups",
                  targets: ["rgba32uint"],
                }),
              )
              .then((p) => {
                this.groupPipeline = p;
              }),
          );
        if (this.program.curveSearch === "adaptive-v1")
          jobs.push(
            this.owner
              .run(() =>
                this.loaded.render({
                  vertex: "fullscreen",
                  fragment: "buildCurveSeeds",
                  targets: [
                    this.program.cacheFormat === "uint-v1"
                      ? "rgba32uint"
                      : "rgba32float",
                  ],
                }),
              )
              .then((p) => {
                this.seedPipeline = p;
              }),
          );
        jobs.push(
          this.owner
            .run(() =>
              this.loaded.render({
                vertex: "fullscreen",
                fragment: "buildCurveIntervals",
                targets: [
                  this.program.cacheFormat === "uint-v1"
                    ? "rgba32uint"
                    : "rgba32float",
                ],
              }),
            )
            .then((p) => {
              this.intervalPipeline = p;
            }),
        );
        jobs.push(
          this.owner
            .run(() =>
              this.loaded.render({
                vertex: "fullscreen",
                fragment: "buildCurveCandidates",
                targets: ["rgba32uint"],
              }),
            )
            .then((p) => {
              this.candidatePipeline = p;
            }),
        );
      }
      if (this.data.size)
        jobs.push(
          this.owner.prepareData().then(() => {
            for (const [name, values] of this.data)
              this.inputs[name] = this.owner.array(values);
            this.data.clear();
          }),
        );
      const results = await Promise.allSettled(jobs),
        failed = results.find((r) => r.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
    });
  }
  private createCache(): CurveCache {
    return {
      intervals: this.owner.runtime.texture({
        size: [this.program.curveSearch === "adaptive-v1" ? 2048 : 1024, 6],
        format:
          this.program.cacheFormat === "uint-v1" ? "rgba32uint" : "rgba32float",
      }),
      candidates: this.owner.runtime.texture({
        size: [1, 1],
        format: "rgba32uint",
      }),
      ...(this.program.curveSearch === "adaptive-v1"
        ? {
            groups: this.owner.runtime.texture({
              size: [1, 1],
              format: "rgba32uint",
            }),
            seeds: this.owner.runtime.texture({
              size: [1024, 1],
              format:
                this.program.cacheFormat === "uint-v1"
                  ? "rgba32uint"
                  : "rgba32float",
            }),
          }
        : {}),
      key: "",
    };
  }
  packet(
    base: ScenePrimaryFrame,
    ratio: number,
    transient: boolean,
  ): ScenePacket {
    this.alive();
    if (
      !this.primary &&
      (this.appearance.color.includes("var(") ||
        this.appearance.color === "currentColor")
    )
      this.ink = color(this.appearance.color, this.doc);
    const inherited = this.scene.nodeSnapshot(this.node),
      camera = base.u;
    const cache = this.accelerated
      ? this.primary && base.cache
        ? base.cache
        : transient
          ? this.createCache()
          : (this.displayCache ??= this.createCache())
      : undefined;
    const external = !!(this.primary && base.cache);
    const local = relativeFrame(
      inherited.transform,
      camera,
      this.program.parameterOrigin,
    );
    const resolution = camera.resolution as number[],
      lens = camera.cameraLens as number[];
    const limit =
      this.owner.runtime.tier === "webgpu"
        ? (this.owner.runtime.limits.maxTextureDimension2D ?? 8192)
        : ((this.owner.runtime.device as WebGL2RenderingContext).getParameter(
            (this.owner.runtime.device as WebGL2RenderingContext)
              .MAX_TEXTURE_SIZE,
          ) as number);
    const groupCount = this.program.curveSearch === "adaptive-v1" ? 16 : 8;
    const tileSize = Math.max(
      4,
      Math.ceil(16 / ratio),
      Math.ceil(resolution[0] / Math.max(1, Math.floor(limit / groupCount))),
      Math.ceil(resolution[1] / limit),
    );
    const columns = Math.ceil(resolution[0] / tileSize),
      rows = Math.ceil(resolution[1] / tileSize);
    let u: UniformValues;
    if (this.primary)
      u = {
        ...camera,
        ...(cache && !external
          ? { curveTiles: [columns, rows, tileSize, 0] }
          : {}),
      };
    else
      u = {
        ...camera,
        ...this.values,
        model: local.model,
        inverseModel: local.inverse,
        parameterBase: local.base,
        probe: this.program.parameterOrigin
          ? (camera.probe as number) +
            (camera.parameterBase as number) -
            local.base
          : camera.probe,
        parameterFocusSeed: this.program.parameterOrigin
          ? 0
          : camera.parameterFocusSeed,
        sceneOpacity: [0, inherited.opacity],
        appearance: [
          0,
          0,
          this.appearance.curveWidth,
          (camera.appearance as number[])[3],
        ],
        curveQuality: [this.search.samples, this.search.refinements],
        curvePattern: [
          this.appearance.lineStyle === "-" ? 0 : 1,
          this.appearance.dashPeriod,
          this.appearance.dashOffset +
            (local.base % this.appearance.dashPeriod),
          this.appearance.lineStyle === ":" ? 0.12 : 0.55,
        ],
        parameterBounds: this.curveDomain.map((v) =>
          Number.isFinite(v) ? v - local.base : 0,
        ),
        parameterMode:
          (Number.isFinite(this.curveDomain[0]) ? 0 : 1) |
          (Number.isFinite(this.curveDomain[1]) ? 0 : 2),
        curveTiles: [columns, rows, tileSize, 0],
        ...surfaceUniforms(
          this.automaticDepth
            ? {
                ...this.surface,
                depthRange: [
                  this.surface.depthRange[0],
                  Math.max(this.surface.depthRange[1], lens[1] * 4),
                ],
              }
            : this.surface,
          this.bounds,
        ),
      };
    const origin = this.originResources?.packet(u, transient, this.generation);
    const parameterValues = Object.keys(this.program.parameters).map(
      (name) => u[name],
    );
    const geometry = JSON.stringify([
      u.resolution,
      u.plotCenter,
      u.plotSpan,
      u.rotationBasis,
      u.plotRotation,
      u.plotPan,
      u.view3d,
      u.cameraLens,
      u.plotCenterZ,
      u.model,
      u.parameterBase,
      u.parameterBounds,
      u.parameterMode,
      u.curveQuality,
      u.curvePattern,
      (u.appearance as number[])[2],
      ratio,
      parameterValues,
      this.primary ? base.generation : this.generation,
    ]);
    const material = this.primary
      ? { ink: [0.09, 0.42, 0.92, 1], bias: 0 }
      : { ink: this.ink, bias: this.appearance.depthBias };
    const bindings = {
      ...(this.primary ? base.bindings : this.inputs),
      u,
      font: { pixelRatio: ratio },
      sceneMaterial: material,
      ...(origin ? { parameterOrigin: origin.cache.texture } : {}),
      ...(cache
        ? {
            curveIntervals: cache.intervals,
            curveCandidates: cache.candidates,
            ...(cache.seeds ? { curveSeeds: cache.seeds } : {}),
            ...(cache.groups ? { curveGroups: cache.groups } : {}),
          }
        : {}),
    };
    const key = JSON.stringify([
      geometry,
      u.surfaceBounds,
      u.surfaceDomainMode,
      u.surfaceRange,
      u.surfaceDepth,
      u.surfaceRender,
      u.surfaceFlags,
      (u.appearance as number[])[3],
      u.labelStyle,
      (u.sceneOpacity as number[])[1],
      material,
    ]);
    return {
      field: this,
      u,
      bindings,
      key,
      cache,
      external,
      origin,
      geometry,
    };
  }
  private draw(
    pass: RenderPass,
    pipeline: RenderPipeline,
    bindings: Readonly<Record<string, unknown>>,
  ): void {
    const names = new Set(
      this.manifest.entries
        .filter(
          (e) => e.name === pipeline.vertex || e.name === pipeline.fragment,
        )
        .flatMap((e) => (e.bindings ?? []).map((b) => b.name)),
    );
    pass.draw(
      pipeline,
      Object.fromEntries(
        Object.entries(bindings).filter(([name]) => names.has(name)),
      ) as never,
      { count: 3 },
    );
  }
  prepare(frame: Frame, packet: ScenePacket): void {
    if (packet.origin)
      this.originResources!.record(frame, packet.origin, packet.bindings);
    const cache = packet.cache;
    if (!cache || packet.external) return;
    const tiles = packet.u.curveTiles as number[];
    const groups = this.program.curveSearch === "adaptive-v1" ? 16 : 8;
    const changed =
      cache.candidates.width !== tiles[0] * groups ||
      cache.candidates.height !== tiles[1];
    if (changed) {
      cache.candidates.resize(tiles[0] * groups, tiles[1]);
      cache.groups?.resize(tiles[0], tiles[1]);
      cache.key = "";
    }
    const key = packet.geometry;
    if (cache.key === key) return;
    if (cache.seeds)
      frame.pass({ color: [cache.seeds] }, (pass) =>
        this.draw(pass, this.seedPipeline!, packet.bindings),
      );
    frame.pass({ color: [cache.intervals] }, (pass) =>
      this.draw(pass, this.intervalPipeline!, packet.bindings),
    );
    frame.pass({ color: [cache.candidates] }, (pass) =>
      this.draw(pass, this.candidatePipeline!, packet.bindings),
    );
    if (cache.groups)
      frame.pass({ color: [cache.groups] }, (pass) =>
        this.draw(pass, this.groupPipeline!, packet.bindings),
      );
    cache.key = key;
  }
  layer(
    frame: Frame,
    packet: ScenePacket,
    colors: Texture,
    depths: Texture,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.prepare(frame, packet);
    frame.pass(
      {
        color: [
          { target: colors, load: "load" },
          { target: depths, load: "load" },
        ],
      },
      (pass) => {
        pass.setViewport(x, y, width, height);
        pass.setScissorRect(x, y, width, height);
        this.draw(pass, this.drawPipeline, packet.bindings);
      },
    );
  }
  query(
    packet: ScenePacket,
    pixel: readonly [number, number],
  ): Promise<{
    point: readonly [number, number, number];
    parameter?: number;
  } | null> {
    return this.work.run(async () => {
      this.queryPipeline ??= this.owner.run(() =>
        this.loaded.render({
          vertex: "fullscreen",
          fragment:
            this.accelerated || this.program.kind === "surface"
              ? "queryLayer"
              : "queryLayerReference",
          targets: ["rgba32uint"],
        }),
      );
      const pipeline = await this.queryPipeline;
      this.alive();
      const output = this.owner.runtime.texture({
        size: [2, 1],
        format: "rgba32uint",
      });
      try {
        const frame = this.owner.runtime.frame();
        frame.pass({ color: [output] }, (pass) =>
          this.draw(pass, pipeline, {
            ...packet.bindings,
            query: { pixel, radius: 0 },
          }),
        );
        await frame.submit();
        const bytes = await output.read();
        this.alive();
        const bits = new Uint32Array(bytes.buffer, bytes.byteOffset, 8);
        if (!bits[3]) return null;
        const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
        return {
          point: [values[0], values[1], values[2]],
          ...(this.program.kind === "surface" ? {} : { parameter: values[4] }),
        };
      } finally {
        output.destroy();
      }
    });
  }
  parameters(): Readonly<Record<string, number>> {
    this.alive();
    return { ...this.values };
  }
  checkParameters(values: Readonly<Record<string, number>>): void {
    this.alive();
    for (const [name, value] of Object.entries(values)) {
      if (!Object.hasOwn(this.values, name))
        throw new TypeError(`Unknown object parameter '${name}'.`);
      finite(value, name);
    }
  }
  setParameters(values: Readonly<Record<string, number>>): void {
    this.checkParameters(values);
    Object.assign(this.values, values);
    this.invalidate();
  }
  setData(name: string, values: Float32Array): void {
    this.alive();
    if (
      !this.inputNames.includes(name) ||
      !(values instanceof Float32Array) ||
      !values.length
    )
      throw new TypeError("Scene data needs a declared nonempty Float32Array.");
    const copy = values.slice(),
      next = this.owner.array(copy);
    this.retired.add(this.inputs[name]);
    this.inputs[name] = next;
    this.generation++;
    this.invalidate();
  }
  setStyle(value: SceneObjectStyle): void {
    this.alive();
    const next = style(value, this.appearance),
      ink = color(next.color, this.doc);
    this.appearance = next;
    this.ink = ink;
    this.invalidate();
  }
  setDomain(value: readonly [number, number]): void {
    this.alive();
    if (this.program.kind === "surface")
      throw new TypeError("Use setSurfaceDomain for surfaces.");
    this.curveDomain = domain(value);
    this.invalidate();
  }
  setQuality(value: PlotQuality): void {
    this.alive();
    this.search = quality(value, this.search);
    this.invalidate();
  }
  setSurface(value: Omit<SurfaceOptions, "colorBar">): void {
    this.alive();
    if (this.program.kind !== "surface")
      throw new TypeError("Surface settings need a surface callback.");
    if ("colorBar" in value)
      throw new TypeError("Color bars belong to the plot frame.");
    this.surface = surfaceOptions(value, this.surface);
    if (value.depthRange !== undefined) this.automaticDepth = false;
    this.invalidate();
  }
  setSurfaceDomain(value: SurfaceDomain): void {
    this.alive();
    if (this.program.kind !== "surface")
      throw new TypeError("Surface domains need a surface callback.");
    this.bounds = surfaceDomain(value);
    this.invalidate();
  }
  reset(): void {
    this.alive();
    this.values = { ...this.initial.parameters };
    this.curveDomain = this.initial.domain;
    this.search = this.initial.quality;
    this.appearance = this.initial.style;
    this.ink = color(this.appearance.color, this.doc);
    this.surface = this.initial.surface;
    this.bounds = this.initial.bounds;
    this.automaticDepth = this.initial.automaticDepth;
    this.invalidate();
  }
  afterFrame(): void {
    for (const handle of this.retired) this.owner.release(handle);
    this.retired.clear();
  }
  releasePacket(packet: ScenePacket): void {
    if (packet.origin) this.originResources!.finish(packet.origin);
    if (
      packet.cache &&
      !packet.external &&
      packet.cache !== this.displayCache
    ) {
      packet.cache.intervals.destroy();
      packet.cache.seeds?.destroy();
      packet.cache.groups?.destroy();
      packet.cache.candidates.destroy();
    }
  }
  close(): Promise<void> {
    this.closed = true;
    return this.work.close();
  }
  dispose(after: Promise<unknown> = Promise.resolve()): Promise<void> {
    if (!this.retirement) {
      this.retirement = Promise.allSettled([this.close(), after]).then(() => {
        this.originResources?.dispose();
        this.displayCache?.intervals.destroy();
        this.displayCache?.seeds?.destroy();
        this.displayCache?.groups?.destroy();
        this.displayCache?.candidates.destroy();
        for (const handle of Object.values(this.inputs))
          this.owner.release(handle);
        this.afterFrame();
        this.data.clear();
        for (const name of Object.keys(this.inputs)) delete this.inputs[name];
      });
    }
    return this.retirement;
  }
}
