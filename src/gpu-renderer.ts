import {
  createRuntime,
  type Runtime,
  type Pack,
  type Texture,
  type RenderPipeline,
  type RenderPass,
} from "typeshade/runtime";
import manifest from "../.build/data-program.json";
import atlasUrl from "../assets/typeplot-font.png";
import type { AxesOptions, SeriesOptions } from "./data.js";

export type Backend = "webgpu" | "webgl2";
export interface RenderSeries {
  readonly kind: "line" | "scatter" | "bar";
  readonly data: { x: readonly number[]; y: readonly number[] };
  readonly style: Required<SeriesOptions> & { width: number };
  readonly edges?: readonly number[];
}
export interface RenderAxes {
  readonly bounds: {
    x: readonly [number, number];
    y: readonly [number, number];
  };
  readonly settings: AxesOptions;
  readonly series: readonly RenderSeries[];
  readonly focused: boolean;
}
export interface Scene {
  readonly width: number;
  readonly height: number;
  readonly rows: number;
  readonly cols: number;
  readonly title?: string;
  readonly titleHeight?: number;
  readonly background?: string;
  readonly axes: readonly RenderAxes[];
}
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
};

/** CSS color parsing supplies uniforms only; no host graphics context is created. */
const colors = new WeakMap<Document, Map<string, number[]>>();
function color(value: string, document: Document): number[] {
  let cache = colors.get(document);
  if (!cache) {
    cache = new Map();
    colors.set(document, cache);
  }
  const known = cache.get(value);
  if (known) return [...known];
  const probe = document.createElement("span");
  probe.style.color = value;
  if (!probe.style.color) throw new TypeError(`Invalid CSS color: ${value}`);
  probe.style.display = "none";
  document.body.appendChild(probe);
  const resolved = document.defaultView!.getComputedStyle(probe).color;
  probe.remove();
  // Requesting the sRGB equivalent through computed style covers named and hex colors.
  const channels = resolved
    .match(/^rgba?\(([^)]+)\)$/)?.[1]
    .split(/[,\s/]+/)
    .map(Number);
  if (
    !channels ||
    channels.length < 3 ||
    channels.some((v) => !Number.isFinite(v))
  )
    throw new TypeError(`Use an sRGB CSS color: ${value}`);
  const result = [
    channels[0] / 255,
    channels[1] / 255,
    channels[2] / 255,
    channels[3] ?? 1,
  ];
  if (!value.includes("var(") && value !== "currentColor")
    cache.set(value, result);
  return [...result];
}
function advance(code: number, size: number): number {
  return ((code >= 0x3130 && code <= 0xd7a3 ? 16 : 10) * size) / 16;
}
function textWidth(value: string, size: number): number {
  return Array.from(value).reduce(
    (n, c) => n + advance(c.codePointAt(0)!, size),
    0,
  );
}
function letters(
  value: string,
  x: number,
  y: number,
  size: number,
  align = 0,
  rotate = false,
): Float32Array {
  const points: number[] = [];
  let cursor = -textWidth(value, size) * align;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    for (const [a, b] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
      [1, 1],
      [0, 1],
    ])
      points.push(
        x + (rotate ? 0 : cursor),
        y + (rotate ? -cursor : 0),
        code,
        size,
        rotate ? 1 : 0,
        a,
        b,
      );
    cursor += advance(code, size);
  }
  return new Float32Array(points);
}
function checked(value: number, log: boolean): boolean {
  return (
    Number.isFinite(value) &&
    Math.abs(value) <= 3.402823466e38 &&
    (!log || value > 0)
  );
}
function records(
  series: RenderSeries,
  axes: RenderAxes,
  mode: "line" | "points" | "bar",
): Float32Array {
  const data = series.data,
    count = mode === "line" ? Math.max(0, data.x.length - 1) : data.x.length;
  const out = new Float32Array(count * 5);
  const logX = axes.settings.xScale === "log",
    logY = axes.settings.yScale === "log";
  for (let i = 0; i < count; i++) {
    const x = data.x[i],
      y = data.y[i];
    const a =
      mode === "bar" ? (series.edges?.[i] ?? x - series.style.width / 2) : x;
    const b =
      mode === "bar"
        ? (series.edges?.[i + 1] ?? x + series.style.width / 2)
        : mode === "line"
          ? data.x[i + 1]
          : x;
    const end =
      mode === "bar"
        ? logY
          ? 10 ** axes.bounds.y[0]
          : 0
        : mode === "line"
          ? data.y[i + 1]
          : y;
    const valid =
      checked(x, logX) &&
      checked(y, logY) &&
      checked(a, logX) &&
      checked(b, logX) &&
      checked(end, logY);
    out.set(valid ? [a, y, b, end, 1] : [0, 0, 0, 0, 0], i * 5);
  }
  return out;
}

/** One runtime and glyph texture per figure; all visible geometry and text comes from TypeShade. */
export class GpuRenderer {
  private axes!: RenderPipeline;
  private series!: RenderPipeline;
  private text!: RenderPipeline;
  private glyphs!: Texture;
  private destroyed = false;
  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly runtime: Runtime,
    private target: GPUCanvasContext | WebGL2RenderingContext | undefined,
    private readonly format: string,
  ) {}
  get backend(): Backend {
    return this.runtime.tier;
  }
  static async create(
    canvas: HTMLCanvasElement,
    backend: "auto" | Backend = "auto",
  ): Promise<GpuRenderer> {
    if (!["auto", "webgpu", "webgl2"].includes(backend))
      throw new TypeError("Unknown plot backend.");
    const win = canvas.ownerDocument.defaultView!;
    const program = manifest as Pack;
    if (backend !== "webgl2") {
      let runtime: Runtime | undefined, renderer: GpuRenderer | undefined;
      try {
        runtime = await createRuntime({
          prefer: ["webgpu"],
          programs: [program],
        });
        const format = win.navigator.gpu.getPreferredCanvasFormat();
        renderer = new GpuRenderer(canvas, runtime, undefined, format);
        // Validate pipelines and resources before committing this canvas to a backend.
        await renderer.initialize();
        const context = canvas.getContext("webgpu");
        if (!context) throw new Error("This canvas has no WebGPU context.");
        context.configure({
          device: runtime.device as GPUDevice,
          format,
          alphaMode: "premultiplied",
        });
        renderer.target = context;
        return renderer;
      } catch (error) {
        if (renderer) renderer.destroy();
        else runtime?.destroy();
        if (backend === "webgpu") throw error;
      }
    }
    const context = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
    });
    if (!context)
      throw new Error("TypePlot requires WebGPU or WebGL2 in this browser.");
    const runtime = await createRuntime({
      device: context,
      programs: [program],
    });
    const renderer = new GpuRenderer(canvas, runtime, context, "rgba8unorm");
    try {
      await renderer.initialize();
      return renderer;
    } catch (error) {
      renderer.destroy();
      throw error;
    }
  }
  private async initialize(): Promise<void> {
    const program = this.runtime.load(manifest as Pack);
    const make = (vertex: string, fragment: string) =>
      program.render({
        vertex,
        fragment,
        targets: [{ format: this.format, blend: BLEND }],
      });
    this.axes = await make("surfaceVertex", "axesFragment");
    this.series = await make("seriesVertex", "seriesFragment");
    this.text = await make("textVertex", "textFragment");
    const response = await fetch(atlasUrl);
    const image = await createImageBitmap(await response.blob(), {
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
    });
    try {
      this.glyphs = this.runtime.texture({
        size: [image.width, image.height],
        format: "rgba8unorm",
      });
      if (this.backend === "webgpu")
        (this.runtime.device as GPUDevice).queue.copyExternalImageToTexture(
          { source: image },
          { texture: this.glyphs.texture as GPUTexture },
          [image.width, image.height],
        );
      else {
        const gl = this.target as WebGL2RenderingContext;
        const bound = gl.getParameter(
          gl.TEXTURE_BINDING_2D,
        ) as WebGLTexture | null;
        gl.bindTexture(gl.TEXTURE_2D, this.glyphs.texture as WebGLTexture);
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.bindTexture(gl.TEXTURE_2D, bound);
      }
    } finally {
      image.close();
    }
  }
  private uniform(
    axes: RenderAxes,
    width: number,
    height: number,
    background: number[],
    legend: number[],
  ) {
    return {
      resolution: [width, height],
      lower: [axes.bounds.x[0], axes.bounds.y[0]],
      span: [
        axes.bounds.x[1] - axes.bounds.x[0],
        axes.bounds.y[1] - axes.bounds.y[0],
      ],
      logarithmic: [
        axes.settings.xScale === "log" ? 1 : 0,
        axes.settings.yScale === "log" ? 1 : 0,
      ],
      grid: axes.settings.grid ? 1 : 0,
      layer: 0,
      background,
      legend,
      focus: axes.focused ? 1 : 0,
    };
  }
  private scene(
    pass: RenderPass,
    scene: Scene,
    width: number,
    height: number,
  ): void {
    const ratioX = width / scene.width,
      ratioY = height / scene.height;
    const titleHeight = scene.title ? (scene.titleHeight ?? 42) : 0,
      cellWidth = scene.width / scene.cols,
      cellHeight = (scene.height - titleHeight) / scene.rows;
    const doc = this.canvas.ownerDocument,
      bg = color(scene.background ?? "#fff", doc);
    const ink = [0.06, 0.09, 0.16, 1];
    const text = (
      u: object,
      value: string,
      x: number,
      y: number,
      size: number,
      align = 0,
      rotate = false,
      tint = ink,
    ) => {
      if (!value) return;
      const data = letters(value, x, y, size, align, rotate);
      pass.draw(
        this.text,
        { u, text: { color: tint }, glyphAtlas: this.glyphs } as never,
        { vertices: data, count: data.length / 7 },
      );
    };
    scene.axes.forEach((axes, index) => {
      const x = Math.round((index % scene.cols) * cellWidth * ratioX),
        right = Math.round(((index % scene.cols) + 1) * cellWidth * ratioX);
      const y = Math.round(
          (titleHeight + Math.floor(index / scene.cols) * cellHeight) * ratioY,
        ),
        bottom = Math.round(
          (titleHeight + (Math.floor(index / scene.cols) + 1) * cellHeight) *
            ratioY,
        );
      pass.setViewport(x, y, right - x, bottom - y);
      pass.setScissorRect(x, y, right - x, bottom - y);
      const labels = axes.settings.legend
        ? axes.series.filter(
            (series) =>
              series.style.label && !series.style.label.startsWith("_"),
          )
        : [];
      const legendWidth = labels.length
        ? Math.min(
            cellWidth - 120,
            Math.max(
              ...labels.map((series) => textWidth(series.style.label, 12)),
            ) + 48,
          )
        : 0;
      const legend =
        legendWidth > 50
          ? [
              cellWidth - 32 - legendWidth,
              50,
              legendWidth,
              labels.length * 22 + 12,
            ]
          : [0, 0, 0, 0];
      const u = this.uniform(axes, cellWidth, cellHeight, bg, legend);
      pass.draw(this.axes, { u, glyphAtlas: this.glyphs } as never, {
        count: 3,
      });
      for (const series of axes.series) {
        const style = series.style,
          tint = color(style.color, doc);
        tint[3] *= style.alpha;
        const draw = (mode: "line" | "points" | "bar") => {
          const points = records(series, axes, mode);
          if (!points.length) return;
          const s = {
            color: tint,
            kind: mode === "line" ? 0 : mode === "points" ? 1 : 2,
            width: mode === "line" ? style.lineWidth : style.markerSize,
            dash:
              style.lineStyle === "--" ? 1 : style.lineStyle === ":" ? 2 : 0,
            marker: style.marker === "s" ? 1 : 0,
          };
          pass.draw(this.series, { u, s, points } as never, {
            count: 6,
            instances: points.length / 5,
          });
        };
        if (series.kind === "bar") draw("bar");
        else {
          if (series.kind === "line" && style.lineStyle !== "none")
            draw("line");
          if (style.marker !== "none") draw("points");
        }
      }
      pass.draw(
        this.axes,
        { u: { ...u, layer: 1 }, glyphAtlas: this.glyphs } as never,
        { count: 3 },
      );
      text(u, axes.settings.title ?? "", (76 + cellWidth - 24) / 2, 6, 14, 0.5);
      text(
        u,
        axes.settings.xLabel ?? "",
        (76 + cellWidth - 24) / 2,
        cellHeight - 29,
        13,
        0.5,
      );
      text(
        u,
        axes.settings.yLabel ?? "",
        2,
        (42 + cellHeight - 62) / 2,
        13,
        0.5,
        true,
      );
      if (legend[2] > 0)
        labels.forEach((series, i) => {
          text(
            u,
            "—",
            legend[0] + 8,
            legend[1] + 4 + i * 22,
            12,
            0,
            false,
            color(series.style.color, doc),
          );
          text(
            u,
            series.style.label,
            legend[0] + 36,
            legend[1] + 4 + i * 22,
            12,
          );
        });
    });
    if (scene.title) {
      pass.setViewport(0, 0, width, Math.round(titleHeight * ratioY));
      pass.setScissorRect(0, 0, width, Math.round(titleHeight * ratioY));
      const u = this.uniform(
        scene.axes[0],
        scene.width,
        titleHeight,
        bg,
        [0, 0, 0, 0],
      );
      pass.draw(
        this.axes,
        { u: { ...u, grid: 0 }, glyphAtlas: this.glyphs } as never,
        { count: 3 },
      );
      text(u, scene.title, scene.width / 2, 8, 16, 0.5);
    }
  }
  async render(scene: Scene, ratio: number): Promise<void> {
    if (this.destroyed) return;
    const width = Math.max(1, Math.round(scene.width * ratio)),
      height = Math.max(1, Math.round(scene.height * ratio));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    const frame = this.runtime.frame();
    frame.pass(
      {
        color: [
          {
            target: this.target!,
            clear: [0, 0, 0, 0],
          },
        ],
      },
      (pass) => this.scene(pass, scene, width, height),
    );
    await frame.submit();
  }
  async pixels(
    scene: Scene,
    ratio: number,
  ): Promise<{ bytes: Uint8Array; width: number; height: number }> {
    if (this.destroyed) throw new Error("This renderer has been destroyed.");
    const width = Math.ceil(scene.width * ratio),
      height = Math.ceil(scene.height * ratio);
    const target = this.runtime.texture({
      size: [width, height],
      format: this.format,
    });
    try {
      const frame = this.runtime.frame();
      frame.pass(
        {
          color: [
            {
              target,
              clear: [0, 0, 0, 0],
            },
          ],
        },
        (pass) => this.scene(pass, scene, width, height),
      );
      await frame.submit();
      const bytes = await target.read();
      if (this.format.startsWith("bgra"))
        for (let i = 0; i < bytes.length; i += 4) {
          const r = bytes[i];
          bytes[i] = bytes[i + 2];
          bytes[i + 2] = r;
        }
      for (let i = 0; i < bytes.length; i += 4) {
        const alpha = bytes[i + 3];
        if (alpha > 0 && alpha < 255)
          for (let channel = 0; channel < 3; channel++)
            bytes[i + channel] = Math.min(
              255,
              Math.round((bytes[i + channel] * 255) / alpha),
            );
      }
      return { bytes, width, height };
    } finally {
      target.destroy();
    }
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.glyphs?.destroy();
    if (this.backend === "webgpu")
      (this.target as GPUCanvasContext | undefined)?.unconfigure();
    this.runtime.destroy();
  }
}
