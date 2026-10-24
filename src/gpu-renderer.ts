import { color } from "./render/color.js";
import { RenderSession } from "./render/session.js";
import type {
  FigureSnapshot as Scene,
  AxesSnapshot as RenderAxes,
  SeriesSnapshot as RenderSeries,
  FieldSnapshot as RenderField,
} from "./render/snapshot.js";
import {
  createRuntime,
  type Resident,
  type Runtime,
  type Pack,
  type Texture,
  type RenderPipeline,
  type RenderPass,
} from "typeshade/runtime";
import manifest from "../.build/data-program.json";
import { loadGlyphAtlas, prepareGlyphAtlas } from "./font.js";
import type { SeriesOptions, SeriesData } from "./data.js";
import { COLOR_MAPS } from "./surface.js";
import type { AnnotationOptions } from "./annotation.js";

export type Backend = "webgpu" | "webgl2";
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
interface SampleResource {
  data: RenderSeries["data"];
  points: Resident<Float32Array>;
  count: number;
  ordered: boolean;
  period: number;
  parameterRange: number;
  xParameter: boolean;
  bounds: readonly number[];
  parameter: SeriesOptions["parameter"];
}

/** One runtime and glyph texture per figure; all visible geometry and text comes from TypeShade. */
export class GpuRenderer {
  private axes!: RenderPipeline;
  private series!: RenderPipeline;
  private text!: RenderPipeline;
  private labelPlate!: RenderPipeline;
  private picking!: RenderPipeline;
  private fieldPipeline!: RenderPipeline;
  private fieldPicking!: RenderPipeline;
  private colorBar!: RenderPipeline;
  private annotationLine!: RenderPipeline;
  private glyphs!: Texture;
  private fullGlyphs = false;
  private glyphUpgrade?: Promise<void>;
  private program!: ReturnType<Runtime["load"]>;
  private samples = new Map<object, SampleResource>();
  private fields = new Map<
    object,
    {
      values: readonly number[];
      levels: string;
      points: Resident<Float32Array>;
    }
  >();
  private destroyed = false;
  private readonly session: RenderSession;
  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly runtime: Runtime,
    private target: GPUCanvasContext | WebGL2RenderingContext | undefined,
    private readonly format: string,
  ) {
    this.session = new RenderSession(
      runtime,
      canvas.ownerDocument.defaultView!,
    );
  }
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
    const glyphSource = prepareGlyphAtlas();
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
        await renderer.initialize(glyphSource);
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
      await renderer.initialize(glyphSource);
      return renderer;
    } catch (error) {
      renderer.destroy();
      throw error;
    }
  }
  private async initialize(glyphSource: Promise<Blob>): Promise<void> {
    this.program = this.runtime.load(manifest as Pack);
    const glyphs = this.session.run(() =>
      loadGlyphAtlas(
        this.runtime,
        false,
        undefined,
        () => !this.destroyed,
        glyphSource,
      ).then((value) => {
        this.glyphs = value;
      }),
    );
    // Let an already-fetched atlas start its off-thread bitmap decoder before
    // invoking a backend whose pipeline creation may run synchronously.
    await Promise.resolve();
    // Start the atlas request alongside pipeline creation. Settle every resource
    // before cleanup so a failed initialization cannot leave late allocations.
    const results = await Promise.allSettled([
      this.pipeline("axesFragment").then((value) => {
        this.axes = value;
      }),
      this.pipeline("seriesFragment").then((value) => {
        this.series = value;
      }),
      this.pipeline("textFragment", "textVertex").then((value) => {
        this.text = value;
      }),
      glyphs,
      this.session.prepareData(),
    ]);
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  }

  private pipeline(
    fragment: string,
    vertex = "surfaceVertex",
    integer = false,
  ): Promise<RenderPipeline> {
    return this.session.run(() =>
      this.program.render({
        vertex,
        fragment,
        targets: integer
          ? ["rgba32uint"]
          : [{ format: this.format, blend: BLEND }],
      }),
    );
  }

  private async prepareScene(scene: Scene): Promise<void> {
    const jobs: Promise<unknown>[] = [this.ensureGlyphs(scene)];
    if (!this.fieldPipeline && scene.axes.some((axes) => axes.fields.length))
      jobs.push(
        this.pipeline("fieldFragment").then((value) => {
          this.fieldPipeline = value;
        }),
      );
    if (
      !this.colorBar &&
      scene.axes.some((axes) =>
        axes.fields.some((field) => field.options.colorBar),
      )
    )
      jobs.push(
        this.pipeline("colorBarFragment").then((value) => {
          this.colorBar = value;
        }),
      );
    if (
      !this.labelPlate &&
      scene.axes.some((axes) => axes.settings.labelBackground)
    )
      jobs.push(
        this.pipeline("labelPlateFragment").then((value) => {
          this.labelPlate = value;
        }),
      );
    if (
      !this.annotationLine &&
      scene.axes.some((axes) =>
        axes.annotations.some((annotation) => annotation.options.arrow),
      )
    )
      jobs.push(
        this.pipeline("annotationFragment").then((value) => {
          this.annotationLine = value;
        }),
      );
    await Promise.all(jobs);
  }

  private async ensureGlyphs(scene: Scene): Promise<void> {
    if (this.fullGlyphs) return;
    const hangul = /[\uac00-\ud7a3]/;
    const needsFull =
      hangul.test(scene.title ?? "") ||
      scene.axes.some(
        (axes) =>
          [
            axes.settings.title,
            axes.settings.xLabel,
            axes.settings.yLabel,
          ].some((value) => hangul.test(value ?? "")) ||
          axes.series.some((series) => hangul.test(series.style.label)) ||
          axes.annotations.some((annotation) => hangul.test(annotation.value)),
      );
    if (!needsFull) return;
    if (!this.glyphUpgrade) {
      this.glyphUpgrade = this.session
        .run(() =>
          loadGlyphAtlas(
            this.runtime,
            true,
            this.glyphs,
            () => !this.destroyed,
          ),
        )
        .then(() => {
          this.fullGlyphs = true;
        })
        .finally(() => {
          this.glyphUpgrade = undefined;
        });
    }
    await this.glyphUpgrade;
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
      grid: axes.gridOpacity,
      labelStyle: [
        axes.settings.labelSize ?? 11,
        axes.settings.tickDensity ?? 1,
        axes.settings.labelHalo ?? 0.8,
        axes.settings.labelBackground ? 1 : 0,
      ],
      layer: 0,
      background,
      legend,
      focus: axes.focused ? 1 : 0,
    };
  }
  /** Input data stays resident. Camera changes update uniforms, not path geometry. */
  private sampleResource(series: RenderSeries): SampleResource {
    const previous = this.samples.get(series.key);
    if (
      previous?.data === series.data &&
      previous.parameter === series.style.parameter
    )
      return previous;
    if (previous) this.release(previous.points);
    const { x, y } = series.data;
    const ordered = x.every(
      (value, i) => Number.isFinite(value) && (i === 0 || value > x[i - 1]),
    );
    const useX =
      series.style.parameter === "x" ||
      (series.style.parameter === "auto" && ordered);
    const packed = new Float32Array(x.length * 8);
    let lower = Infinity,
      upper = -Infinity;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let i = 0; i < x.length; i++) {
      const parameter = useX ? x[i] : i;
      let extra = [0, 0, 0, 0];
      if (series.kind === "bar")
        extra = [
          series.edges?.[i] ?? x[i] - series.style.width / 2,
          series.edges?.[i + 1] ?? x[i] + series.style.width / 2,
          0,
          0,
        ];
      else if (series.kind === "barh")
        extra = [
          y[i] - series.style.width / 2,
          y[i] + series.style.width / 2,
          0,
          0,
        ];
      else if (series.kind === "fill") extra[0] = series.data.lower![i];
      else if (series.kind === "error")
        extra = [
          series.data.xLow?.[i] ?? NaN,
          series.data.xHigh?.[i] ?? NaN,
          series.data.yLow?.[i] ?? NaN,
          series.data.yHigh?.[i] ?? NaN,
        ];
      packed.set([x[i], y[i], parameter, 1, ...extra], i * 8);
      if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
        minX = Math.min(minX, x[i]);
        maxX = Math.max(maxX, x[i]);
        minY = Math.min(minY, y[i]);
        maxY = Math.max(maxY, y[i]);
      }
      if (Number.isFinite(parameter)) {
        lower = Math.min(lower, parameter);
        upper = Math.max(upper, parameter);
      }
    }
    const resource = {
      data: series.data,
      points: this.session.array(packed),
      count: x.length,
      ordered,
      period: Math.max((upper - lower) / 60, 1e-20),
      parameter: series.style.parameter,
      parameterRange: Number.isFinite(upper - lower) ? upper - lower : 0,
      xParameter: useX,
      bounds: Number.isFinite(minX) ? [minX, minY, maxX, maxY] : [0, 0, 0, 0],
    };
    this.samples.set(series.key, resource);
    return resource;
  }
  private release(points: Resident<Float32Array>): void {
    this.session.release(points);
  }
  private prune(scene: Scene): void {
    const live = new Set(
      scene.axes.flatMap((axes) => axes.series.map((series) => series.key)),
    );
    for (const [series, resource] of this.samples)
      if (!live.has(series)) {
        this.release(resource.points);
        this.samples.delete(series);
      }
    const liveFields = new Set(
      scene.axes.flatMap((axes) => axes.fields.map((field) => field.key)),
    );
    for (const [field, resource] of this.fields)
      if (!liveFields.has(field)) {
        this.release(resource.points);
        this.fields.delete(field);
      }
  }
  private fieldResource(field: RenderField): Resident<Float32Array> {
    const levels = JSON.stringify(field.options.levels),
      previous = this.fields.get(field.key);
    if (previous?.values === field.values && previous.levels === levels)
      return previous.points;
    if (previous) this.release(previous.points);
    const array = new Float32Array(
      field.values.length + field.options.levels.length,
    );
    array.set(field.values);
    array.set(field.options.levels, field.values.length);
    const points = this.session.array(array);
    this.fields.set(field.key, { values: field.values, levels, points });
    return points;
  }
  private drawField(
    pass: RenderPass,
    u: object,
    field: RenderField,
    ratio: number,
    query?: {
      pixel: readonly [number, number];
      radius: number;
      series: number;
    },
    bar = false,
  ): void {
    const options = field.options;
    if (!options.visible || options.alpha <= 0) return;
    const [x0, x1, y0, y1] = options.extent;
    const f = {
      bounds: [x0, y0, x1, y1],
      range: options.valueRange,
      shape: options.shape,
      palette: COLOR_MAPS.indexOf(options.colorMap),
      origin: options.origin === "upper" ? 1 : 0,
      mode: ["image", "contour", "contourf"].indexOf(field.mode),
      interpolation: options.interpolation === "linear" ? 1 : 0,
      alpha: options.alpha,
      levels: options.levels.length,
      lineWidth: options.lineWidth,
    };
    pass.draw(
      query ? this.fieldPicking : bar ? this.colorBar : this.fieldPipeline,
      {
        u,
        field: f,
        points: this.fieldResource(field),
        ...(!query ? { font: { pixelRatio: ratio } } : {}),
        ...(bar ? { glyphAtlas: this.glyphs } : {}),
        ...(query ? { query } : {}),
      } as never,
      { count: 3 },
    );
  }
  private drawSeries(
    pass: RenderPass,
    axes: RenderAxes,
    u: object,
    series: RenderSeries,
    ratio: number,
    query?: {
      pixel: readonly [number, number];
      radius: number;
      series: number;
    },
  ): void {
    const style = series.style;
    if (!style.visible || style.alpha <= 0) return;
    const tint = color(style.color, this.canvas.ownerDocument);
    tint[3] *= style.alpha;
    if (tint[3] <= 0) return;
    const draw = (kind: number) => {
      const resource = this.sampleResource(series);
      if (!resource.count) return;
      const s = {
        color: tint,
        kind,
        width: kind === 1 ? style.markerSize : style.lineWidth,
        dash:
          kind === 0 || kind === 4
            ? style.lineStyle === "--"
              ? 1
              : style.lineStyle === ":"
                ? 2
                : 0
            : 0,
        marker: style.marker === "s" ? 1 : 0,
        count: resource.count,
        ordered:
          resource.ordered &&
          (axes.settings.xScale !== "log" || series.data.x[0] > 0)
            ? 1
            : 0,
        period: style.dashPeriod || resource.period,
        offset: style.dashOffset,
        automatic: style.dashPeriod > 0 ? 0 : 1,
        parameterRange: resource.parameterRange,
        xParameter: resource.xParameter ? 1 : 0,
        dataBounds: resource.bounds,
        baseline: style.baseline,
        capSize: style.capSize,
        where: ["pre", "post", "mid"].indexOf(style.where),
      };
      pass.draw(
        query ? this.picking : this.series,
        {
          u,
          s,
          points: resource.points,
          font: { pixelRatio: ratio },
          ...(query ? { query } : {}),
        } as never,
        { count: 3 },
      );
    };
    if (series.kind === "bar") draw(2);
    else if (series.kind === "barh") draw(3);
    else if (series.kind === "fill") draw(6);
    else {
      if (
        (series.kind === "line" ||
          series.kind === "step" ||
          series.kind === "error") &&
        style.lineStyle !== "none"
      )
        draw(series.kind === "step" ? 4 : 0);
      if (series.kind === "stem") draw(5);
      if (series.kind === "error") draw(7);
      if (style.marker !== "none") draw(1);
    }
  }
  pick(
    scene: Scene,
    axesIndex: number,
    position: readonly [number, number],
    radius: number,
  ): Promise<{ series: number; index: number } | null> {
    return this.session.run(() =>
      this.pickFrame(scene, axesIndex, position, radius),
    );
  }
  private async pickFrame(
    scene: Scene,
    axesIndex: number,
    position: readonly [number, number],
    radius: number,
  ): Promise<{ series: number; index: number } | null> {
    if (this.destroyed) throw new Error("This renderer has been destroyed.");
    if (
      !Array.isArray(position) ||
      position.length !== 2 ||
      !position.every(Number.isFinite) ||
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > 64
    )
      throw new RangeError(
        "Picking needs a finite CSS-pixel position and radius between zero and 64.",
      );
    const axes = scene.axes[axesIndex];
    if (!axes) throw new RangeError("Unknown subplot.");
    const pipelines: Promise<unknown>[] = [];
    if (!this.picking && axes.series.length)
      pipelines.push(
        this.pipeline("pickFragment", "surfaceVertex", true).then((value) => {
          this.picking = value;
        }),
      );
    if (!this.fieldPicking && axes.fields.length)
      pipelines.push(
        this.pipeline("fieldPickFragment", "surfaceVertex", true).then(
          (value) => {
            this.fieldPicking = value;
          },
        ),
      );
    await Promise.all(pipelines);
    if (this.destroyed) return null;
    const width = scene.width / scene.cols,
      height = (scene.height - (scene.titleHeight ?? 0)) / scene.rows;
    if (
      position[0] < 0 ||
      position[1] < 0 ||
      position[0] > width ||
      position[1] > height
    )
      return null;
    const output = this.runtime.texture({ size: [1, 1], format: "rgba32uint" });
    try {
      const u = this.uniform(
        axes,
        width,
        height,
        color(scene.background ?? "#fff", this.canvas.ownerDocument),
        [0, 0, 0, 0],
      );
      const frame = this.runtime.frame();
      frame.pass(
        { color: [{ target: output, clear: [0, 0, 0, 0] }] },
        (pass) => {
          axes.fields.forEach((field, index) =>
            this.drawField(pass, u, field, 1, {
              pixel: position,
              radius,
              series: index,
            }),
          );
          axes.series.forEach((series, index) =>
            this.drawSeries(pass, axes, u, series, 1, {
              pixel: position,
              radius,
              series: index + axes.fields.length,
            }),
          );
        },
      );
      await frame.submit();
      const bytes = await output.read();
      const words = new Uint32Array(bytes.buffer, bytes.byteOffset, 4);
      return words[3] ? { series: words[0] - 1, index: words[1] - 1 } : null;
    } finally {
      output.destroy();
    }
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
      annotation?: {
        position: readonly [number, number];
        target: readonly [number, number];
        options: Required<AnnotationOptions>;
      },
    ) => {
      if (!value) return;
      const layout = u as { labelStyle: number[] };
      const width = textWidth(value, size);
      const center = rotate
        ? [x + size * 0.76, y - width * (0.5 - align)]
        : [x + width * (0.5 - align), y + size * 0.76];
      const half = rotate
        ? [size * 0.55 + 2, width * 0.5 + 3.5]
        : [width * 0.5 + 3.5, size * 0.55 + 2];
      const box = [...center, ...half];
      const textUniform = {
        color: tint,
        box,
        anchor: annotation
          ? [...annotation.position, 1, annotation.options.rotation]
          : [0, 0, 0, 0],
        offset: annotation?.options.offset ?? [0, 0],
        target: annotation?.target ?? [0, 0],
        arrow: annotation
          ? [
              annotation.options.arrow ? 1 : 0,
              annotation.options.lineWidth,
              annotation.options.headSize,
              0,
            ]
          : [0, 0, 0, 0],
      };
      if (annotation?.options.arrow)
        pass.draw(
          this.annotationLine,
          {
            u,
            text: textUniform,
            font: { pixelRatio: Math.min(ratioX, ratioY) },
          } as never,
          { count: 3 },
        );
      if (layout.labelStyle[3] > 0 && value !== "—")
        pass.draw(
          this.labelPlate,
          {
            u,
            text: textUniform,
            font: { pixelRatio: Math.min(ratioX, ratioY) },
          } as never,
          { count: 3 },
        );
      const data = letters(value, x, y, size, align, rotate);
      pass.draw(
        this.text,
        {
          u,
          text: textUniform,
          glyphAtlas: this.glyphs,
          font: { pixelRatio: Math.min(ratioX, ratioY) },
        } as never,
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
      pass.draw(
        this.axes,
        {
          u,
          glyphAtlas: this.glyphs,
          font: { pixelRatio: Math.min(ratioX, ratioY) },
        } as never,
        {
          count: 3,
        },
      );
      for (const field of axes.fields)
        this.drawField(pass, u, field, Math.min(ratioX, ratioY));
      for (const series of axes.series)
        this.drawSeries(pass, axes, u, series, Math.min(ratioX, ratioY));
      for (const annotation of axes.annotations) {
        const tint = color(annotation.options.color, doc);
        tint[3] *= annotation.options.alpha;
        text(
          u,
          annotation.value,
          0,
          0,
          annotation.options.fontSize,
          ["left", "center", "right"].indexOf(annotation.options.align) * 0.5,
          false,
          tint,
          annotation,
        );
      }
      pass.draw(
        this.axes,
        {
          u: { ...u, layer: 1 },
          glyphAtlas: this.glyphs,
          font: { pixelRatio: Math.min(ratioX, ratioY) },
        } as never,
        { count: 3 },
      );
      text(u, axes.settings.title ?? "", (76 + cellWidth - 24) / 2, 6, 14, 0.5);
      const colorBar = [...axes.fields]
        .reverse()
        .find((field) => field.options.colorBar && field.options.visible);
      if (colorBar)
        this.drawField(
          pass,
          u,
          colorBar,
          Math.min(ratioX, ratioY),
          undefined,
          true,
        );
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
        {
          u: { ...u, grid: 0 },
          glyphAtlas: this.glyphs,
          font: { pixelRatio: Math.min(ratioX, ratioY) },
        } as never,
        { count: 3 },
      );
      text(u, scene.title, scene.width / 2, 8, 16, 0.5);
    }
  }
  render(scene: Scene, ratio: number): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    return this.session.run(() => this.renderFrame(scene, ratio));
  }
  private async renderFrame(scene: Scene, ratio: number): Promise<void> {
    if (this.destroyed) return;
    await this.prepareScene(scene);
    if (this.destroyed) return;
    const width = Math.max(1, Math.round(scene.width * ratio)),
      height = Math.max(1, Math.round(scene.height * ratio));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    const frame = this.runtime.frame();
    this.prune(scene);
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
    await this.session.present(frame);
  }
  pixels(
    scene: Scene,
    ratio: number,
  ): Promise<{ bytes: Uint8Array; width: number; height: number }> {
    return this.session.run(() => this.readPixels(scene, ratio));
  }
  private async readPixels(
    scene: Scene,
    ratio: number,
  ): Promise<{ bytes: Uint8Array; width: number; height: number }> {
    if (this.destroyed) throw new Error("This renderer has been destroyed.");
    await this.prepareScene(scene);
    if (this.destroyed) throw new Error("This renderer has been destroyed.");
    const width = Math.ceil(scene.width * ratio),
      height = Math.ceil(scene.height * ratio);
    const target = this.runtime.texture({
      size: [width, height],
      format: this.format,
    });
    try {
      const frame = this.runtime.frame();
      this.prune(scene);
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
    // Detach synchronously so a replacement plot can reuse the canvas immediately.
    if (this.backend === "webgpu")
      (this.target as GPUCanvasContext | undefined)?.unconfigure();
    void this.session
      .retire(() => {
        this.glyphs?.destroy();
        this.samples.clear();
        this.fields.clear();
      })
      .catch((error) =>
        console.error("[typeplot] Resource disposal failed", error),
      );
  }
}
