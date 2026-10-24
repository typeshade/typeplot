import type { Frame, Pack, RenderPipeline, Texture } from "typeshade/runtime";
import manifest from "../../.build/coordinates-program.json";
import { RenderSession } from "./session.js";
import type { ScenePrimaryFrame, UniformValues } from "./scene-field.js";

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
interface Cache {
  texture: Texture;
  key: string;
}
export interface CoordinatePacket {
  bindings: Record<string, unknown>;
  finish(success: boolean): void;
}
/** Load extended-precision axes only when absolute coordinates exceed the f32 budget. */
export class CoordinatesRenderer {
  private readonly pack = manifest as Pack;
  private readonly program;
  private labels!: RenderPipeline;
  private backdrop!: RenderPipeline;
  private overlay!: RenderPipeline;
  private cache?: Cache;
  constructor(
    private readonly owner: RenderSession,
    private readonly format: string,
    private readonly surface: boolean,
    private readonly limit: number,
  ) {
    this.program = owner.runtime.load(this.pack);
  }
  async initialize(): Promise<void> {
    const entries = [
      "buildSpatialLabels",
      "drawBackdrop",
      this.surface ? "drawSurfaceLabels" : "drawLabels",
    ];
    const pipelines = await Promise.allSettled(
      entries.map((fragment, index) =>
        this.owner.run(() =>
          this.program.render({
            vertex: "fullscreen",
            fragment,
            targets: [
              index === 0
                ? "rgba32uint"
                : index === 2
                  ? { format: this.format, blend: BLEND }
                  : this.format,
            ],
          }),
        ),
      ),
    );
    const failed = pipelines.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
    [this.labels, this.backdrop, this.overlay] = pipelines.map(
      (result) => (result as PromiseFulfilledResult<RenderPipeline>).value,
    );
  }
  private draw(
    frame: Frame,
    pipeline: RenderPipeline,
    bindings: Readonly<Record<string, unknown>>,
    target: Texture | GPUCanvasContext | WebGL2RenderingContext,
    load: "clear" | "load" = "clear",
  ): void {
    const names = new Set(
      this.pack.entries
        .filter(
          (entry) =>
            entry.name === pipeline.vertex || entry.name === pipeline.fragment,
        )
        .flatMap((entry) =>
          (entry.bindings ?? []).map((binding) => binding.name),
        ),
    );
    frame.pass({ color: [{ target, load }] }, (pass) =>
      pass.draw(
        pipeline,
        Object.fromEntries(
          Object.entries(bindings).filter(([name]) => names.has(name)),
        ) as never,
        { count: 3 },
      ),
    );
  }
  prepare(
    frame: Frame,
    base: ScenePrimaryFrame,
    ratio: number,
    transient: boolean,
  ): CoordinatePacket {
    const camera = base.u,
      size = camera.resolution as number[];
    const columns = Math.min(
      this.limit,
      Math.ceil(Math.hypot(...size) * ratio) + 2,
    );
    let cache = transient ? undefined : this.cache;
    if (!cache) {
      cache = {
        texture: this.owner.runtime.texture({
          size: [columns, 38],
          format: "rgba32uint",
        }),
        key: "",
      };
      if (!transient) this.cache = cache;
    }
    if (cache.texture.width !== columns) {
      cache.texture.resize(columns, 38);
      cache.key = "";
    }
    const tiles = camera.curveTiles as number[];
    const u: UniformValues = {
      ...camera,
      model: camera.axesModel,
      inverseModel: camera.inverseAxesModel,
      curveTiles: [tiles[0], tiles[1], tiles[2], columns],
    };
    const bindings = {
      u,
      glyphAtlas: base.bindings.glyphAtlas,
      font: { pixelRatio: ratio },
      spatialLabels: cache.texture,
    };
    const key = JSON.stringify([
      u.resolution,
      u.axesOrigin,
      u.plotSpan,
      u.plotPan,
      u.rotationBasis,
      u.cameraLens,
      u.view3d,
      u.appearance,
      u.labelStyle,
      u.decorations,
      u.decorationOpacity,
      u.sceneOpacity,
      u.model,
      u.inverseModel,
      ratio,
    ]);
    try {
      if (cache.key !== key) {
        this.draw(frame, this.labels, bindings, cache.texture);
        cache.key = key;
      }
    } catch (error) {
      if (transient) cache.texture.destroy();
      else cache.key = "";
      throw error;
    }
    return {
      bindings,
      finish(success) {
        if (transient) cache!.texture.destroy();
        else if (!success) cache!.key = "";
      },
    };
  }
  background(frame: Frame, packet: CoordinatePacket, target: Texture): void {
    this.draw(frame, this.backdrop, packet.bindings, target);
  }
  foreground(
    frame: Frame,
    packet: CoordinatePacket,
    target: Texture | GPUCanvasContext | WebGL2RenderingContext,
  ): void {
    this.draw(frame, this.overlay, packet.bindings, target, "load");
  }
  dispose(): void {
    this.cache?.texture.destroy();
    this.cache = undefined;
  }
}
