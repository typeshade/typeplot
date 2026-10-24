import type { Frame, Pack, RenderPipeline, Texture } from "typeshade/runtime";
import compositeManifest from "../../.build/scene-composite-program.json";
import {
  MAX_SCENE_OBJECTS,
  type PlotScene,
  type SceneObject,
  type SceneObjectOptions,
  type SceneObjectHandle,
  type ScenePick,
} from "../scene.js";
import type { PlotProgram } from "../types.js";
import { RenderSession } from "./session.js";
import {
  SceneField,
  type LoadedProgram,
  type ScenePacket,
  type ScenePrimaryFrame,
} from "./scene-field.js";

const BLEND = {
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src-alpha",
    operation: "add",
  },
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add",
  },
} as const;
interface Bundle {
  color: Texture;
  depth: Texture;
  backdrop: Texture;
  width: number;
  height: number;
  columns: number;
  rows: number;
  uniforms: Record<string, unknown>;
  packets: ScenePacket[];
  keys: string[];
  owners: SceneField[];
  backdropKey: string;
  readers: number;
  retired: boolean;
}
/** GPU color/depth composition, separate from camera interaction and logical parenting. */
export class SceneComposer {
  private readonly fields = new Map<SceneObject, SceneField>();
  private readonly active = new Set<SceneObject>();
  private readonly programs = new Map<PlotProgram, LoadedProgram>();
  private readonly primary: SceneField;
  private readonly compositeProgram: LoadedProgram;
  private composePipeline!: RenderPipeline;
  private backdropPipeline!: RenderPipeline;
  private labelsPipeline!: RenderPipeline;
  private pickPipeline?: Promise<RenderPipeline>;
  private display?: Bundle;
  private closed = false;
  private revision = 0;
  private disposing?: Promise<void>;
  private readonly maxDimension: number;
  constructor(
    private readonly owner: RenderSession,
    private readonly scene: PlotScene,
    private readonly source: PlotProgram,
    private readonly sourceProgram: LoadedProgram,
    private readonly format: string,
    private readonly doc: Document,
    private readonly invalidateHost: () => void,
    private readonly idle: () => Promise<void>,
    private readonly accelerate: boolean,
    private readonly primaryCache: boolean,
    private readonly labelsCached: boolean,
  ) {
    this.programs.set(source, sourceProgram);
    this.compositeProgram = owner.runtime.load(compositeManifest as Pack);
    this.primary = new SceneField(
      "primary",
      scene.content,
      source,
      sourceProgram,
      owner,
      scene,
      doc,
      invalidateHost,
      {},
      true,
      accelerate,
    );
    const gl = owner.runtime.device as WebGL2RenderingContext;
    this.maxDimension =
      owner.runtime.tier === "webgpu"
        ? (owner.runtime.limits.maxTextureDimension2D ?? 8192)
        : Math.min(
            gl.getParameter(gl.MAX_TEXTURE_SIZE),
            gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
          );
  }
  isActive(node: SceneObject): boolean {
    return this.active.has(node);
  }
  get hasObjects(): boolean {
    return this.active.size > 0;
  }
  invalidate(): void {
    this.revision++;
  }
  private alive(): void {
    if (this.closed) throw new Error("This plot has been destroyed.");
  }
  async initialize(): Promise<void> {
    const results = await Promise.allSettled([
      this.primary.initialize(this.primaryCache),
      this.owner
        .run(() =>
          this.compositeProgram.render({
            vertex: "fullscreen",
            fragment: "compose",
            targets: [this.format],
          }),
        )
        .then((p) => {
          this.composePipeline = p;
        }),
      this.owner
        .run(() =>
          this.sourceProgram.render({
            vertex: "fullscreen",
            fragment: this.labelsCached
              ? "drawBackdrop"
              : "drawBackdropReference",
            targets: [this.format],
          }),
        )
        .then((p) => {
          this.backdropPipeline = p;
        }),
      this.owner
        .run(() =>
          this.sourceProgram.render({
            vertex: "fullscreen",
            fragment: this.labelsCached ? "drawLabels" : "drawLabelsReference",
            targets: [{ format: this.format, blend: BLEND }],
          }),
        )
        .then((p) => {
          this.labelsPipeline = p;
        }),
    ]);
    const failed = results.find((r) => r.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }
  async attach(
    node: SceneObject,
    program: PlotProgram,
    options: SceneObjectOptions,
  ): Promise<SceneObjectHandle> {
    this.alive();
    if (this.fields.size >= MAX_SCENE_OBJECTS - 1)
      throw new RangeError("The scene is full.");
    let loaded = this.programs.get(program);
    if (!loaded) {
      loaded = this.owner.runtime.load(program.manifest as Pack);
      this.programs.set(program, loaded);
    }
    const field = new SceneField(
      node.id,
      node,
      program,
      loaded,
      this.owner,
      this.scene,
      this.doc,
      this.invalidateHost,
      options,
      false,
      this.accelerate,
    );
    this.fields.set(node, field);
    try {
      await field.initialize();
      this.alive();
      this.active.add(node);
      return field;
    } catch (error) {
      this.fields.delete(node);
      await field.dispose();
      throw error;
    }
  }
  async detach(node: SceneObject): Promise<void> {
    const field = this.fields.get(node);
    this.fields.delete(node);
    this.active.delete(node);
    this.invalidate();
    if (!field) return;
    await field.dispose(this.idle());
    if (!this.hasObjects && this.display) {
      this.retire(this.display);
      this.display = undefined;
    }
  }
  private arrangement(
    width: number,
    height: number,
    count: number,
    budget: number,
  ): { columns: number; rows: number; scale: number } {
    let best = { columns: 1, rows: count, scale: 0 },
      shape = Infinity;
    for (let columns = 1; columns <= count; columns++) {
      const rows = Math.ceil(count / columns),
        scale = Math.min(
          1,
          this.maxDimension / (width * columns),
          this.maxDimension / (height * rows),
          Math.sqrt(budget / (width * height * columns * rows)),
        );
      const aspect = Math.abs(Math.log((width * columns) / (height * rows)));
      if (scale > best.scale || (scale === best.scale && aspect < shape)) {
        best = { columns, rows, scale };
        shape = aspect;
      }
    }
    return best;
  }
  displayScale(width: number, height: number): number {
    return this.arrangement(width, height, this.active.size + 1, 8_388_608)
      .scale;
  }
  checkExportSize(width: number, height: number): void {
    if (!this.hasObjects) return;
    if (
      this.arrangement(width, height, this.active.size + 1, 16_777_216).scale <
      1 - 1e-9
    )
      throw new RangeError(
        "PNG scene attachments exceed the device dimension or total 16-megapixel budget.",
      );
  }
  private bundle(width: number, height: number, transient: boolean): Bundle {
    const count = this.active.size + 1,
      grid = this.arrangement(
        width,
        height,
        count,
        transient ? 16_777_216 : 8_388_608,
      );
    if (grid.scale < 1 - 1e-9)
      throw new RangeError(
        "The requested scene exceeds its attachment pixel budget or device dimensions. Lower the output size or pixel ratio.",
      );
    let result = transient ? undefined : this.display;
    if (
      !result ||
      result.width !== width ||
      result.height !== height ||
      result.columns !== grid.columns ||
      result.rows !== grid.rows
    ) {
      if (result) this.retire(result);
      const texture = (w: number, h: number, format: string) =>
        this.owner.runtime.texture({ size: [w, h], format });
      result = {
        color: texture(width * grid.columns, height * grid.rows, "rgba8unorm"),
        depth: texture(width * grid.columns, height * grid.rows, "rgba8unorm"),
        backdrop: texture(width, height, this.format),
        width,
        height,
        columns: grid.columns,
        rows: grid.rows,
        uniforms: {},
        packets: [],
        keys: [],
        owners: [],
        backdropKey: "",
        readers: 0,
        retired: false,
      };
      if (!transient) this.display = result;
    }
    return result;
  }
  private baseDraw(
    frame: Frame,
    pipeline: RenderPipeline,
    bindings: Readonly<Record<string, unknown>>,
    target: Texture | GPUCanvasContext | WebGL2RenderingContext,
    load: "load" | "clear" = "clear",
  ): void {
    const manifest = this.source.manifest as Pack;
    const required = new Set(
      manifest.entries
        .filter(
          (e) => e.name === pipeline.vertex || e.name === pipeline.fragment,
        )
        .flatMap((e) => (e.bindings ?? []).map((b) => b.name)),
    );
    frame.pass({ color: [{ target, load }] }, (pass) =>
      pass.draw(
        pipeline,
        Object.fromEntries(
          Object.entries(bindings).filter(([name]) => required.has(name)),
        ) as never,
        { count: 3 },
      ),
    );
  }
  record(
    frame: Frame,
    base: ScenePrimaryFrame,
    width: number,
    height: number,
    ratio: number,
    target: Texture | GPUCanvasContext | WebGL2RenderingContext,
    transient = false,
  ): (success?: boolean) => void {
    this.alive();
    const bundle = this.bundle(width, height, transient);
    const fields = [
      this.primary,
      ...[...this.active].map((node) => this.fields.get(node)!),
    ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const packets: ScenePacket[] = [];
    try {
      for (let index = 0; index < fields.length; index++) {
        const field = fields[index],
          packet = field.packet(base, ratio, transient);
        packets.push(packet);
        const key = field.id + ":" + packet.key;
        if (bundle.owners[index] !== field || bundle.keys[index] !== key) {
          field.layer(
            frame,
            packet,
            bundle.color,
            bundle.depth,
            (index % bundle.columns) * width,
            Math.floor(index / bundle.columns) * height,
            width,
            height,
          );
          bundle.keys[index] = key;
          bundle.owners[index] = field;
        }
      }
      const u = base.u;
      const backdropKey = JSON.stringify([
        u.resolution,
        u.axesModel,
        u.inverseAxesModel,
        u.plotCenter,
        u.plotSpan,
        u.rotationBasis,
        u.plotRotation,
        u.plotPan,
        u.cameraLens,
        u.plotCenterZ,
        u.view3d,
        u.appearance,
        u.labelStyle,
        u.decorations,
        u.decorationOpacity,
        (u.sceneOpacity as number[])[0],
        ratio,
      ]);
      if (bundle.backdropKey !== backdropKey) {
        this.baseDraw(
          frame,
          this.backdropPipeline,
          base.bindings,
          bundle.backdrop,
        );
        bundle.backdropKey = backdropKey;
      }
      bundle.uniforms = {
        size: [width, height],
        columns: bundle.columns,
        count: fields.length,
        css: u.resolution,
      };
      frame.pass({ color: [target] }, (pass) =>
        pass.draw(
          this.composePipeline,
          {
            composite: bundle.uniforms,
            layerColor: bundle.color,
            layerDepth: bundle.depth,
            backdrop: bundle.backdrop,
          } as never,
          { count: 3 },
        ),
      );
      this.baseDraw(frame, this.labelsPipeline, base.bindings, target, "load");
      bundle.packets = packets;
    } catch (error) {
      bundle.keys = [];
      bundle.backdropKey = "";
      for (const packet of packets)
        if (packet.cache && !packet.external) packet.cache.key = "";
      for (const packet of packets) packet.field.releasePacket(packet);
      if (transient) this.retire(bundle);
      throw error;
    }
    return (success = true) => {
      if (!success) {
        bundle.keys = [];
        bundle.backdropKey = "";
        for (const packet of packets)
          if (packet.cache && !packet.external) packet.cache.key = "";
      }
      if (transient) {
        for (const packet of packets) packet.field.releasePacket(packet);
        this.retire(bundle);
      } else for (const field of fields) field.afterFrame();
    };
  }
  async pick(
    position: readonly [number, number],
    radius: number,
  ): Promise<ScenePick | null> {
    this.alive();
    this.pickPipeline ??= this.owner.run(() =>
      this.compositeProgram.render({
        vertex: "fullscreen",
        fragment: "pick",
        targets: ["rgba32uint"],
      }),
    );
    const pipeline = await this.pickPipeline;
    this.alive();
    const bundle = this.display;
    if (!bundle) return null;
    const version = this.revision,
      packets = [...bundle.packets],
      uniforms = { ...bundle.uniforms },
      css = uniforms.css as number[];
    bundle.readers++;
    const output = this.owner.runtime.texture({
      size: [1, 1],
      format: "rgba32uint",
    });
    try {
      const frame = this.owner.runtime.frame();
      frame.pass({ color: [output] }, (pass) =>
        pass.draw(
          pipeline,
          {
            composite: uniforms,
            layerColor: bundle.color,
            layerDepth: bundle.depth,
            query: { pixel: [position[0], css[1] - position[1]], radius },
          } as never,
          { count: 3 },
        ),
      );
      await frame.submit();
      const bytes = await output.read();
      if (this.closed || version !== this.revision) return null;
      const bits = new Uint32Array(bytes.buffer, bytes.byteOffset, 4),
        values = new Float32Array(bytes.buffer, bytes.byteOffset, 4);
      const packet = packets[bits[0] - 1];
      if (!packet) return null;
      const point = await packet.field.query(packet, [values[1], values[2]]);
      if (!point || this.closed || version !== this.revision) return null;
      const m = packet.u.model as number[],
        p = point.point;
      const worldPoint = [
        m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
        m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
        m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
      ] as const;
      return {
        kind: packet.field.program.kind,
        point: p,
        ...(point.parameter === undefined
          ? {}
          : { parameter: point.parameter }),
        distance: values[3],
        objectId: packet.field.id,
        object: packet.field.node,
        worldPoint,
      };
    } catch (error) {
      if (this.closed || version !== this.revision) return null;
      throw error;
    } finally {
      output.destroy();
      bundle.readers--;
      if (bundle.retired) this.retire(bundle);
    }
  }
  private retire(bundle: Bundle): void {
    bundle.retired = true;
    if (bundle.readers) return;
    bundle.color.destroy();
    bundle.depth.destroy();
    bundle.backdrop.destroy();
  }
  close(): void {
    this.closed = true;
    this.invalidate();
    void this.primary.close();
    for (const field of this.fields.values()) void field.close();
  }
  dispose(): Promise<void> {
    this.close();
    this.disposing ??= Promise.all([
      this.primary.dispose(),
      ...[...this.fields.values()].map((field) => field.dispose()),
    ]).then(() => {
      if (this.display) this.retire(this.display);
      this.display = undefined;
      this.fields.clear();
      this.active.clear();
      this.programs.clear();
    });
    return this.disposing;
  }
}
