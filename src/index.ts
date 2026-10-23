import {
  createRuntime,
  type Pack,
  type Runtime,
  type Texture,
} from "typeshade/runtime";
import { loadGlyphAtlas } from "./font.js";
import { createPlotInteraction } from "./interaction.js";
import type {
  Plot,
  PlotBounds,
  PlotOptions,
  PlotProgram,
  PlotProjection,
  PlotStyle,
} from "./types.js";
import { plot as plotData } from "./data.js";
import type { Figure, NumericData, QuickPlotOptions } from "./data.js";

export { figure, subplots, linspace, Figure, Axes, Series } from "./data.js";
export type {
  NumericData,
  AxisScale,
  AxisLimits,
  SeriesOptions,
  BarOptions,
  HistogramOptions,
  AxesOptions,
  FigureOptions,
  QuickPlotOptions,
  SaveFigureOptions,
} from "./data.js";

export type {
  Plot,
  PlotBounds,
  PlotKind,
  PlotOptions,
  PlotProgram,
  PlotProjection,
  PlotStyle,
} from "./types.js";

const ACTIVE = new WeakSet<HTMLCanvasElement>();
const MAX_F32 = 3.4028234663852886e38;
const RESERVED = new Set([
  "resolution",
  "plotCenter",
  "plotSpan",
  "plotRotation",
  "plotPan",
  "plotBlend",
  "probe",
  "view3d",
  "appearance",
  "decorations",
]);

function finite(value: number, name: string): number {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_F32) {
    throw new RangeError(`${name} must be a finite f32 value.`);
  }
  return value;
}

function checkedBounds(value: PlotBounds): PlotBounds {
  for (const [name, axis] of Object.entries(value)) {
    if (!Array.isArray(axis) || axis.length !== 2)
      throw new TypeError(`bounds.${name} needs two endpoints.`);
    axis.forEach((v, i) => finite(v, `bounds.${name}[${i}]`));
    const span = axis[1] - axis[0];
    if (!(span > 0) || !Number.isFinite(span) || span * 1e6 > MAX_F32) {
      throw new RangeError(
        `bounds.${name} must be increasing within the f32 interaction range.`,
      );
    }
  }
  if (!value.x || !value.y) throw new TypeError("bounds needs x and y ranges.");
  return { x: [...value.x], y: [...value.y] };
}

/** Mount a compiled TypeShade callback on a canvas. The browser entry contains no compiler. */
export async function createPlot(
  canvas: HTMLCanvasElement,
  program: PlotProgram,
  options: PlotOptions = {},
): Promise<Plot> {
  const win = canvas?.ownerDocument?.defaultView;
  if (!win || typeof canvas.getContext !== "function")
    throw new TypeError("createPlot needs a browser canvas.");
  if (
    !program ||
    program.version !== 1 ||
    !["scalar", "parametric"].includes(program.kind)
  ) {
    throw new TypeError(
      "Unsupported TypePlot program. Compile it with typeplot/compiler.",
    );
  }
  if (ACTIVE.has(canvas))
    throw new Error(
      "This canvas already has a TypePlot instance. Destroy it before mounting another.",
    );
  const backend = options.backend ?? "auto";
  if (!["auto", "webgpu", "webgl2"].includes(backend))
    throw new TypeError("Unknown plot backend.");
  let mode = options.mode ?? (program.kind === "parametric" ? "3d" : "2d");
  const checkMode = (value: string): void => {
    if (value !== "2d" && value !== "3d")
      throw new TypeError("Plot mode must be 2d or 3d.");
    if (value === "2d" && program.kind === "parametric")
      throw new TypeError("Parametric curves require 3d mode.");
  };
  checkMode(mode);
  let projection: PlotProjection =
    options.projection ??
    (program.camera === "projective" ? "perspective" : "orthographic");
  const checkProjection = (value: PlotProjection): void => {
    if (value !== "perspective" && value !== "orthographic")
      throw new TypeError("Projection must be perspective or orthographic.");
    if (value === "perspective" && program.camera !== "projective")
      throw new Error(
        "Recompile this TypePlot program to enable perspective projection.",
      );
  };
  checkProjection(projection);
  if (mode === "2d" && options.projection === "perspective")
    throw new TypeError(
      "2D plots use orthographic projection. Switch to 3d first.",
    );
  const initialProjection = projection;
  if (
    options.label !== undefined &&
    (typeof options.label !== "string" || !options.label.trim())
  )
    throw new TypeError("Plot label must be a non-empty string.");
  const bounds = checkedBounds(options.bounds ?? { x: [-1, 1], y: [-1, 1] });
  const initialProbe = finite(
    options.probe ?? bounds.x[0] / 2 + bounds.x[1] / 2,
    "probe",
  );
  let probe = initialProbe;
  if (
    options.pixelRatio !== undefined &&
    (!(options.pixelRatio > 0) ||
      options.pixelRatio > 4 ||
      !Number.isFinite(options.pixelRatio))
  ) {
    throw new RangeError(
      "pixelRatio must be greater than zero and at most four.",
    );
  }
  const parameters: Record<string, number> = Object.create(null);
  for (const [name, value] of Object.entries(program.parameters ?? {})) {
    if (!/^[A-Za-z_]\w*$/.test(name) || RESERVED.has(name))
      throw new TypeError(`Invalid plot parameter '${name}'.`);
    parameters[name] = finite(value, name);
  }
  const validateParameters = (
    values: Readonly<Record<string, number>>,
  ): void => {
    for (const [name, value] of Object.entries(values)) {
      if (!Object.hasOwn(parameters, name))
        throw new TypeError(`Unknown plot parameter '${name}'.`);
      finite(value, name);
    }
  };
  validateParameters(options.parameters ?? {});
  Object.assign(parameters, options.parameters);
  const initialParameters = { ...parameters };
  const initialMode = mode;
  const manifest = program.manifest as Pack;
  const supportsStyle = manifest.bindings.some(
    (binding) => binding.name === "font",
  );
  const style: Required<PlotStyle> = {
    axisWidth: 1,
    gridWidth: 1,
    curveWidth: 2,
    labelSize: 11,
    grid: true,
    tickLabels: true,
    axisLabels: true,
  };
  const checkStyle = (value: PlotStyle): void => {
    if (!supportsStyle)
      throw new Error(
        "Recompile this TypePlot program to configure its style.",
      );
    for (const [key, setting] of Object.entries(value)) {
      if (!Object.hasOwn(style, key))
        throw new TypeError(`Unknown plot style '${key}'.`);
      if (["grid", "tickLabels", "axisLabels"].includes(key)) {
        if (typeof setting !== "boolean")
          throw new TypeError(`${key} must be a boolean.`);
      } else if (
        typeof setting !== "number" ||
        !Number.isFinite(setting) ||
        setting < (key === "labelSize" ? 6 : 0) ||
        setting > (key === "labelSize" ? 48 : 32)
      ) {
        throw new RangeError(
          `${key} must be ${key === "labelSize" ? "6–48" : "0–32"} CSS pixels.`,
        );
      }
    }
  };
  if (options.style) {
    checkStyle(options.style);
    Object.assign(style, options.style);
  }
  const initialStyle = { ...style };
  const original = {
    width: canvas.width,
    height: canvas.height,
    style: canvas.getAttribute("style"),
    label: canvas.getAttribute("aria-label"),
    labelledby: canvas.getAttribute("aria-labelledby"),
    role: canvas.getAttribute("role"),
  };
  ACTIVE.add(canvas);
  if (options.label !== undefined) {
    canvas.setAttribute("aria-label", options.label);
    canvas.removeAttribute("aria-labelledby");
  } else if (!original.label && !original.labelledby) {
    canvas.setAttribute(
      "aria-label",
      program.kind === "scalar" ? "Function plot" : "Spatial trajectory plot",
    );
  }
  if (original.role === null) canvas.setAttribute("role", "img");
  let rt: Runtime | undefined;
  let glyphs: Texture | undefined;
  let context: GPUCanvasContext | WebGL2RenderingContext | undefined;
  let controller: ReturnType<typeof createPlotInteraction> | undefined;
  let observer: ResizeObserver | undefined;
  let destroyed = false;
  let dirty = false;
  let drawing: Promise<void> | null = null;
  let scheduled = 0;
  const report = (error: unknown): void => {
    const value = error instanceof Error ? error : new Error(String(error));
    if (options.onError) {
      try {
        options.onError(value);
      } catch (callbackError) {
        console.error("[typeplot] onError failed", callbackError);
      }
    } else console.error("[typeplot]", value);
  };
  const requestDraw = (): void => {
    if (!destroyed && !scheduled)
      scheduled = win.requestAnimationFrame(() => {
        scheduled = 0;
        void redraw().catch(report);
      });
  };

  function restoreCanvas(): void {
    canvas.width = original.width;
    canvas.height = original.height;
    if (original.style === null) canvas.removeAttribute("style");
    else canvas.setAttribute("style", original.style);
    for (const [name, value] of [
      ["aria-label", original.label],
      ["aria-labelledby", original.labelledby],
      ["role", original.role],
    ] as const) {
      if (value === null) canvas.removeAttribute(name);
      else canvas.setAttribute(name, value);
    }
  }
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    ACTIVE.delete(canvas);
    dirty = false;
    if (scheduled) win!.cancelAnimationFrame(scheduled);
    observer?.disconnect();
    win!.removeEventListener("resize", requestDraw);
    controller?.destroy();
    if (rt?.tier === "webgpu")
      (context as GPUCanvasContext | undefined)?.unconfigure();
    glyphs?.destroy();
    rt?.destroy();
    restoreCanvas();
  }
  function alive(): void {
    if (destroyed) throw new Error("This plot has been destroyed.");
  }

  let drawFrame: (() => Promise<void>) | undefined;
  function redraw(): Promise<void> {
    if (destroyed)
      return Promise.reject(new Error("This plot has been destroyed."));
    if (!drawFrame) return Promise.resolve();
    dirty = true;
    if (!drawing) {
      drawing = (async () => {
        while (dirty && !destroyed) {
          dirty = false;
          await drawFrame!();
        }
      })().finally(() => {
        drawing = null;
      });
    }
    return drawing;
  }

  try {
    if (backend !== "webgl2") {
      try {
        rt = await createRuntime({ prefer: ["webgpu"], programs: [manifest] });
      } catch (error) {
        if (backend === "webgpu") throw error;
      }
    }
    let format = "rgba8unorm";
    if (rt) {
      const gpu = win.navigator.gpu;
      const target = canvas.getContext("webgpu");
      if (!target || !gpu)
        throw new Error("This canvas has no WebGPU context.");
      context = target;
      format = gpu.getPreferredCanvasFormat();
      target.configure({
        device: rt.device as GPUDevice,
        format: format as GPUTextureFormat,
        alphaMode: "opaque",
      });
    } else {
      const gl = canvas.getContext("webgl2", {
        antialias: false,
        alpha: false,
      });
      if (!gl)
        throw new Error("No WebGPU or WebGL2 rendering backend is available.");
      context = gl;
      rt = await createRuntime({ device: gl, programs: [manifest] });
    }
    const runtime = rt;
    const target = context;
    const pipeline = await runtime.load(manifest).render({ targets: [format] });
    // Older manifests have no font binding and remain usable without recompilation.
    if (manifest.bindings.some((binding) => binding.name === "glyphAtlas"))
      glyphs = await loadGlyphAtlas(runtime);
    let preparedSizing = false;
    controller = createPlotInteraction(
      canvas,
      bounds,
      requestDraw,
      options.interactive !== false,
    );
    drawFrame = async () => {
      if (destroyed) return;
      const box = canvas.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return;
      // Keep an intrinsic canvas at its CSS size when its backing store gains pixels.
      if (!preparedSizing) {
        preparedSizing = true;
        if (
          box.width === original.width &&
          box.height === original.height &&
          !canvas.style.width &&
          !canvas.style.height
        ) {
          canvas.style.width = `${box.width}px`;
          canvas.style.height = `${box.height}px`;
        }
      }
      const ratio =
        options.pixelRatio ?? Math.min(win.devicePixelRatio || 1, 2);
      const width = Math.max(1, box.width * ratio);
      const height = Math.max(1, box.height * ratio);
      const limit =
        runtime.tier === "webgpu"
          ? (runtime.limits.maxTextureDimension2D ?? 8192)
          : ((target as WebGL2RenderingContext).getParameter(
              (target as WebGL2RenderingContext).MAX_RENDERBUFFER_SIZE,
            ) as number);
      const scale = Math.min(
        1,
        limit / width,
        limit / height,
        Math.sqrt(4_194_304 / (width * height)),
      );
      const nextWidth = Math.max(1, Math.round(width * scale));
      const nextHeight = Math.max(1, Math.round(height * scale));
      if (canvas.width !== nextWidth) canvas.width = nextWidth;
      if (canvas.height !== nextHeight) canvas.height = nextHeight;
      const u = {
        ...parameters,
        resolution: [box.width, box.height],
        ...(supportsStyle
          ? {
              appearance: [
                style.axisWidth,
                style.gridWidth,
                style.curveWidth,
                style.labelSize,
              ],
              decorations:
                (style.grid ? 1 : 0) |
                (style.tickLabels ? 2 : 0) |
                (style.axisLabels ? 4 : 0),
            }
          : {}),
        plotCenter: controller!.value("plotCenter"),
        plotSpan: controller!.value("plotSpan"),
        plotRotation: controller!.value("plotRotation"),
        plotPan: controller!.value("plotPan"),
        plotBlend: controller!.value("plotBlend")![0],
        probe,
        view3d: mode === "3d" ? (projection === "perspective" ? 2 : 1) : 0,
      };
      const frame = runtime.frame();
      frame.pass({ color: [target] }, (pass) =>
        pass.draw(
          pipeline,
          {
            u,
            ...(glyphs
              ? {
                  glyphAtlas: glyphs,
                  font: {
                    pixelRatio: Math.min(
                      canvas.width / box.width,
                      canvas.height / box.height,
                    ),
                  },
                }
              : {}),
          } as never,
          { count: 3 },
        ),
      );
      await frame.submit();
    };
    controller.setMode(mode === "3d");
    if (typeof win.ResizeObserver === "function") {
      observer = new win.ResizeObserver(requestDraw);
      observer.observe(canvas);
    }
    win.addEventListener("resize", requestDraw);
    await redraw();
    return {
      backend: runtime.tier,
      get projection() {
        return mode === "2d" ? "orthographic" : projection;
      },
      setMode(value) {
        alive();
        checkMode(value);
        mode = value;
        controller!.setMode(value === "3d");
        requestDraw();
      },
      setStyle(value) {
        alive();
        checkStyle(value);
        Object.assign(style, value);
        requestDraw();
      },
      setProbe(value) {
        alive();
        probe = finite(value, "probe");
        requestDraw();
      },
      setProjection(value) {
        alive();
        checkProjection(value);
        if (mode === "2d" && value === "perspective")
          throw new TypeError(
            "2D plots use orthographic projection. Switch to 3d first.",
          );
        projection = value;
        requestDraw();
      },
      setParameters(values) {
        alive();
        validateParameters(values);
        Object.assign(parameters, values);
        requestDraw();
      },
      bounds() {
        alive();
        return controller!.bounds();
      },
      reset() {
        alive();
        probe = initialProbe;
        Object.assign(style, initialStyle);
        Object.assign(parameters, initialParameters);
        mode = initialMode;
        projection = initialProjection;
        controller!.setMode(mode === "3d");
        controller!.reset();
        requestDraw();
      },
      redraw,
      destroy,
    };
  } catch (error) {
    destroy();
    throw error;
  }
}

/** Plot data directly, or mount a compiled GPU program using the original canvas form. */
export function plot(
  canvas: HTMLCanvasElement,
  program: PlotProgram,
  options?: PlotOptions,
): Promise<Plot>;
export function plot(y: NumericData, options?: QuickPlotOptions): Figure;
export function plot(
  x: NumericData,
  y: NumericData | ((x: number) => number),
  options?: QuickPlotOptions,
): Figure;
export function plot(
  target: HTMLCanvasElement | NumericData,
  dataOrOptions?:
    PlotProgram | NumericData | ((x: number) => number) | QuickPlotOptions,
  options?: PlotOptions | QuickPlotOptions,
): Promise<Plot> | Figure {
  if (
    target &&
    typeof (target as HTMLCanvasElement).getContext === "function"
  ) {
    return createPlot(
      target as HTMLCanvasElement,
      dataOrOptions as PlotProgram,
      options as PlotOptions,
    );
  }
  if (
    typeof dataOrOptions === "function" ||
    (dataOrOptions && "length" in dataOrOptions)
  ) {
    return plotData(
      target as NumericData,
      dataOrOptions as NumericData | ((x: number) => number),
      options as QuickPlotOptions,
    );
  }
  return plotData(target as NumericData, dataOrOptions as QuickPlotOptions);
}
