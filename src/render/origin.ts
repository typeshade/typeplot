import type { Frame, Pack, RenderPipeline, Texture } from "typeshade/runtime";
import { RenderSession } from "./session.js";
import type { LoadedProgram, UniformValues } from "./scene-field.js";
interface Cache {
  texture: Texture;
  key: string;
}
export interface OriginPacket {
  cache: Cache;
  key: string;
  transient: boolean;
}
/** One GPU texel prepares the extended-precision origin; SDF work stays local f32. */
export class CurveOrigin {
  private pipeline!: RenderPipeline;
  private cache?: Cache;
  constructor(
    private readonly owner: RenderSession,
    private readonly loaded: LoadedProgram,
    private readonly manifest: Pack,
    private readonly parameters: readonly string[],
  ) {}
  async initialize(): Promise<void> {
    this.pipeline = await this.owner.run(() =>
      this.loaded.render({
        vertex: "fullscreen",
        fragment: "buildParameterOrigin",
        targets: ["rgba32uint"],
      }),
    );
  }
  packet(
    u: UniformValues,
    transient = false,
    dataGeneration = 0,
  ): OriginPacket {
    let cache = transient ? undefined : this.cache;
    if (!cache) {
      cache = {
        texture: this.owner.runtime.texture({
          size: [1, 1],
          format: "rgba32uint",
        }),
        key: "",
      };
      if (!transient) this.cache = cache;
    }
    return {
      cache,
      key: JSON.stringify([
        u.parameterBase,
        dataGeneration,
        ...this.parameters.map((name) => u[name]),
      ]),
      transient,
    };
  }
  record(
    frame: Frame,
    packet: OriginPacket,
    bindings: Readonly<Record<string, unknown>>,
  ): void {
    if (packet.cache.key === packet.key) return;
    const names = new Set(
      this.manifest.entries
        .filter(
          (entry) =>
            entry.name === this.pipeline.vertex ||
            entry.name === this.pipeline.fragment,
        )
        .flatMap((entry) =>
          (entry.bindings ?? []).map((binding) => binding.name),
        ),
    );
    frame.pass({ color: [packet.cache.texture] }, (pass) =>
      pass.draw(
        this.pipeline,
        Object.fromEntries(
          Object.entries(bindings).filter(([name]) => names.has(name)),
        ) as never,
        { count: 3 },
      ),
    );
    packet.cache.key = packet.key;
  }
  finish(packet: OriginPacket, success = true): void {
    if (packet.transient) packet.cache.texture.destroy();
    else if (!success) packet.cache.key = "";
  }
  dispose(): void {
    this.cache?.texture.destroy();
    this.cache = undefined;
  }
}
