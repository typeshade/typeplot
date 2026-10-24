import { GpuCompletion } from "./gpu-completion.js";
import {
  Timeline,
  tween,
  type AnimationClip,
  type AnimationOptions,
  type TweenOptions,
} from "./animation.js";
import {
  identityMatrix,
  invertAffineMatrix,
  matrixInterpolator,
  type Matrix4,
} from "./transform.js";
import {
  DEFAULT_SURFACE,
  surfaceOptions,
  surfaceDomain,
  surfaceUniforms,
  cameraUpdate,
} from "./surface.js";
import { PointerPicker } from "./picking.js";
import { encodePng } from "./png.js";
export {
  Timeline,
  ValueTracker,
  tween,
  sequence,
  parallel,
  wait,
  ease,
} from "./animation.js";
export type {
  AnimationClip,
  AnimationOptions,
  TimelineOptions,
  TweenOptions,
  Easing,
  AnimationState,
} from "./animation.js";
export {
  identityMatrix,
  multiplyMatrices,
  translationMatrix,
  scaleMatrix,
  rotationMatrix,
} from "./transform.js";
export type { Matrix4 } from "./transform.js";
export { createSurface } from "./grid-surface.js";
export { preloadFonts } from "./resources.js";
export type { GridSurface, GridSurfaceOptions } from "./grid-surface.js";
import { PlotControlHost } from "./controls.js";
export { ViewControl } from "./controls.js";
export type { PlotControl, ControlPosition } from "./controls.js";
import { OpacityFade } from "./fade.js";
import {
  createRuntime,
  createDevice,
  resident,
  type Device,
  type Resident,
  type Pack,
  type Runtime,
  type Texture,
  type RenderPipeline,
} from "typeshade/runtime";
import { loadGlyphAtlas, prepareGlyphAtlas } from "./font.js";
import { createPlotInteraction } from "./interaction.js";
import type {
  Plot,
  PlotBounds,
  PlotOptions,
  PlotProgram,
  PlotProjection,
  PlotStyle,
  PlotQuality,
  PlotCamera,
  PlotCameraUpdate,
  PlotTransition,
  PlotPick,
} from "./types.js";
import { plot as plotData } from "./data.js";
import type { Figure, NumericData, QuickPlotOptions } from "./data.js";

export {
  figure,
  subplots,
  linspace,
  Figure,
  Axes,
  Series,
  Field,
  Annotation,
} from "./data.js";
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
  ErrorBarOptions,
  ErrorValues,
  DataPick,
  FieldOptions,
  FieldStyle,
  FieldKind,
  AnnotationOptions,
  AnnotateOptions,
} from "./data.js";

export type {
  Plot,
  PlotBounds,
  PlotKind,
  PlotOptions,
  PlotProgram,
  PlotProjection,
  PlotStyle,
  PlotQuality,
  PlotCamera,
  PlotCameraUpdate,
  PlotTransition,
  PlotPick,
  PickEvent,
  ColorMap,
  SurfaceOptions,
  SurfaceDomain,
  SavePlotOptions,
} from "./types.js";

const ACTIVE = new WeakSet<HTMLCanvasElement>();
const MAX_F32 = 3.4028234663852886e38;
const RESERVED = new Set([
  "resolution",
  "plotCenter",
  "plotSpan",
  "plotRotation",
  "rotationBasis",
  "plotPan",
  "plotBlend",
  "probe",
  "view3d",
  "appearance",
  "decorations",
  "labelStyle",
  "decorationOpacity",
  "parameterBounds",
  "parameterMode",
  "curveQuality",
  "curvePattern",
  "curveTiles",
  "model",
  "inverseModel",
  "cameraLens",
  "plotCenterZ",
  "surfaceBounds",
  "surfaceDomainMode",
  "surfaceRange",
  "surfaceDepth",
  "surfaceRender",
  "surfaceFlags",
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
    !["scalar", "parametric", "surface"].includes(program.kind)
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
  let mode = options.mode ?? (program.kind === "scalar" ? "2d" : "3d");
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
    options.acceleration !== undefined &&
    typeof options.acceleration !== "boolean"
  )
    throw new TypeError("acceleration must be a boolean.");
  if (
    options.label !== undefined &&
    (typeof options.label !== "string" || !options.label.trim())
  )
    throw new TypeError("Plot label must be a non-empty string.");
  const bounds = checkedBounds(
    options.bounds ??
      (program.kind === "surface"
        ? { x: [-3, 3], y: [-2, 2] }
        : { x: [-1, 1], y: [-1, 1] }),
  );
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
  const manifest = program.manifest as Pack;
  const uniformLayout = manifest.bindings.find(
    (binding) => binding.name === "u",
  )?.layout;
  const fieldLayout = (name: string) =>
    uniformLayout?.kind === "struct"
      ? uniformLayout.fields.find((field) => field.name === name)?.layout
      : undefined;
  const vectorUniform = (name: string, size: number, type: "f32" | "u32") => {
    const field = fieldLayout(name);
    return (
      field?.kind === "vector" && field.size === size && field.type === type
    );
  };
  const modelLayout = fieldLayout("model");
  const supportsTransform =
    modelLayout?.kind === "matrix" &&
    modelLayout.columns === 4 &&
    modelLayout.rows === 4;
  const optionalReserved = new Set([
    "rotationBasis",
    "curveTiles",
    "model",
    "inverseModel",
    "cameraLens",
    "plotCenterZ",
    "surfaceBounds",
    "surfaceDomainMode",
    "surfaceRange",
    "surfaceDepth",
    "surfaceRender",
    "surfaceFlags",
  ]);
  const legacyParameter = (name: string) => {
    const field = fieldLayout(name);
    return (
      optionalReserved.has(name) &&
      field?.kind === "scalar" &&
      field.type === "f32"
    );
  };
  const parameters: Record<string, number> = Object.create(null);
  for (const [name, value] of Object.entries(program.parameters ?? {})) {
    if (
      !/^[A-Za-z_]\w*$/.test(name) ||
      (RESERVED.has(name) && !legacyParameter(name))
    )
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
  if (
    (options.camera?.fov !== undefined ||
      options.camera?.distance !== undefined) &&
    !supportsTransform
  )
    throw new Error("Recompile this program to set the camera lens.");
  if (options.camera?.z !== undefined && !supportsTransform)
    throw new Error("Recompile this program to move the camera focus in 3D.");
  const dataBindings = manifest.bindings
    .filter(
      (binding) =>
        binding.space === "storage" &&
        binding.access === "read" &&
        binding.type === "array<f32>",
    )
    .map((binding) => binding.name);
  const dataArrays = new Map<string, Float32Array>();
  for (const [name, values] of Object.entries(options.data ?? {})) {
    if (
      !dataBindings.includes(name) ||
      !(values instanceof Float32Array) ||
      values.length < 1
    )
      throw new TypeError(
        `data.${name} must supply a nonempty Float32Array for a declared read-only f32 binding.`,
      );
    dataArrays.set(name, values.slice());
  }
  for (const name of dataBindings)
    if (!dataArrays.has(name))
      throw new TypeError(`Missing data for shader storage binding '${name}'.`);
  if (options.transform && !supportsTransform)
    throw new Error("Recompile this program to transform the scene.");
  let model = options.transform
    ? ([...options.transform] as unknown as Matrix4)
    : identityMatrix();
  let inverseModel = invertAffineMatrix(model);
  const initialModel = [...model] as unknown as Matrix4;
  if ((options.surface || options.surfaceDomain) && program.kind !== "surface")
    throw new TypeError("Surface settings require a surface program.");
  let surface = surfaceOptions(options.surface ?? {});
  let automaticDepth = options.surface?.depthRange === undefined;
  let surfaceBounds = surfaceDomain(
    options.surfaceDomain ?? {
      x: [-Infinity, Infinity],
      z: [-Infinity, Infinity],
    },
  );
  const initialSurface = surfaceOptions(surface),
    initialSurfaceBounds = surfaceDomain(surfaceBounds);
  const supportsFields =
    uniformLayout?.kind === "struct" &&
    uniformLayout.fields.some((field) => field.name === "parameterBounds");
  const checkFields = (): void => {
    if (!supportsFields)
      throw new Error(
        "Recompile this TypePlot program to use procedural curve controls.",
      );
  };
  const checkedDomain = (
    value: readonly [number, number],
  ): [number, number] => {
    if (program.kind !== "parametric")
      throw new TypeError(
        "Only parametric curves have a bounded parameter domain. Scalar functions extend across the visible plane.",
      );
    if (!Array.isArray(value) || value.length !== 2)
      throw new TypeError("domain needs two endpoints.");
    value.forEach((n) => {
      if (
        typeof n !== "number" ||
        Number.isNaN(n) ||
        (Number.isFinite(n) && Math.abs(n) > MAX_F32)
      )
        throw new RangeError(
          "domain endpoints must be real f32 values or infinities.",
        );
    });
    if (
      !(value[1] > value[0]) ||
      (Number.isFinite(value[0]) &&
        Number.isFinite(value[1]) &&
        value[1] - value[0] > MAX_F32)
    )
      throw new RangeError(
        "domain must be increasing; infinite endpoints are supported.",
      );
    if (
      (!Number.isFinite(value[0]) || !Number.isFinite(value[1])) &&
      !supportsUnbounded
    )
      throw new Error(
        "Recompile this program to use unbounded parameter domains.",
      );
    return [value[0], value[1]];
  };
  const supportsUnbounded =
    uniformLayout?.kind === "struct" &&
    uniformLayout.fields.some((field) => field.name === "parameterMode");
  let domain: [number, number] =
    program.kind === "parametric" && supportsUnbounded
      ? [-Infinity, Infinity]
      : [...bounds.x];
  if (options.domain !== undefined) {
    checkFields();
    domain = checkedDomain(options.domain);
  }
  const initialDomain = [...domain] as [number, number];
  const quality: Required<PlotQuality> = { samples: 128, refinements: 5 };
  const checkQuality = (value: PlotQuality): void => {
    checkFields();
    if (program.kind === "scalar")
      throw new TypeError(
        "Only spatial curves and surfaces use search quality. Scalar functions evaluate their field directly.",
      );
    for (const [key, number] of Object.entries(value)) {
      if (!Object.hasOwn(quality, key))
        throw new TypeError(`Unknown curve quality '${key}'.`);
      const low = key === "samples" ? 16 : 1,
        high = key === "samples" ? 512 : 8;
      if (!Number.isInteger(number) || number < low || number > high)
        throw new RangeError(
          `${key} must be an integer from ${low} to ${high}.`,
        );
    }
  };
  if (options.quality !== undefined) {
    checkQuality(options.quality);
    Object.assign(quality, options.quality);
  }
  const initialQuality = { ...quality };
  const supportsStyle = manifest.bindings.some(
    (binding) => binding.name === "font",
  );
  const style: Required<PlotStyle> = {
    axisWidth: 1,
    gridWidth: 1,
    curveWidth: 2,
    lineStyle: "-",
    dashPeriod: 0.2,
    dashOffset: 0,
    labelSize: 11,
    tickDensity: 1,
    labelHalo: 0.8,
    labelBackground: false,
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
      if (["lineStyle", "dashPeriod", "dashOffset"].includes(key)) {
        checkFields();
        if (key === "lineStyle") {
          if (!["-", "--", ":"].includes(setting as string))
            throw new TypeError("lineStyle must be -, -- or :.");
        } else {
          finite(setting as number, key);
          if (
            typeof setting !== "number" ||
            (key === "dashPeriod" && setting < 1e-7)
          )
            throw new RangeError(
              `${key} must be ${key === "dashPeriod" ? "at least 1e-7" : "finite"}.`,
            );
        }
      } else if (key === "tickDensity" || key === "labelHalo") {
        const low = key === "tickDensity" ? 0.25 : 0;
        const high = key === "tickDensity" ? 4 : 2;
        if (
          typeof setting !== "number" ||
          !Number.isFinite(setting) ||
          setting < low ||
          setting > high
        )
          throw new RangeError(`${key} must be between ${low} and ${high}.`);
      } else if (
        ["grid", "tickLabels", "axisLabels", "labelBackground"].includes(key)
      ) {
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
  const decorationKeys = ["grid", "tickLabels", "axisLabels"] as const;
  const decorationFades = decorationKeys.map(
    (key) => new OpacityFade(style[key] ? 1 : 0),
  );
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
  let completion: GpuCompletion | undefined;
  let glyphs: Texture | undefined;
  let intervals: Texture | undefined;
  let candidates: Texture | undefined;
  let labels: Texture | undefined;
  let dataDevice: Device | undefined;
  const inputs: Record<string, Resident<Float32Array>> = Object.create(null);
  let inputGeneration = 0;
  let context: GPUCanvasContext | WebGL2RenderingContext | undefined;
  let controller: ReturnType<typeof createPlotInteraction> | undefined;
  let controls: PlotControlHost | undefined;
  let picker: PointerPicker<PlotPick> | undefined;
  let pickPipeline: RenderPipeline | undefined;
  let pickPreparation: Promise<RenderPipeline> | undefined;
  const animations = new Set<Timeline>();
  const pauseAnimations = () => {
    for (const animation of animations) animation.pause();
  };
  let observer: ResizeObserver | undefined;
  let destroyed = false;
  let dirty = false;
  let drawing: Promise<void> | null = null;
  let scheduled = 0;
  const report = (error: unknown): void => {
    if (destroyed) return;
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
    picker?.invalidate();
    if (!destroyed) dirty = true;
    if (!destroyed && !scheduled)
      scheduled = win.requestAnimationFrame(() => {
        scheduled = 0;
        void redraw().catch(report);
        if (decorationFades.some((fade) => fade.active(win.performance.now())))
          requestDraw();
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
    controls?.destroy();
    picker?.destroy();
    for (const animation of animations) animation.cancel();
    animations.clear();
    canvas.removeEventListener("pointerdown", pauseAnimations);
    canvas.removeEventListener("wheel", pauseAnimations);
    canvas.removeEventListener("keydown", pauseAnimations);
    controller?.destroy();
    if (rt?.tier === "webgpu")
      (context as GPUCanvasContext | undefined)?.unconfigure();
    completion?.destroy();
    intervals?.destroy();
    candidates?.destroy();
    labels?.destroy();
    glyphs?.destroy();
    for (const [name, value] of Object.entries(inputs)) {
      if (dataDevice) dataDevice.release(value);
      else value.destroy();
      delete inputs[name];
    }
    dataArrays.clear();
    const releaseRuntime = () => {
      if (dataDevice) {
        const runtime = rt;
        void dataDevice.dispose().then(
          () => runtime?.destroy(),
          () => runtime?.destroy(),
        );
      } else rt?.destroy();
    };
    if (pickPreparation)
      void pickPreparation.then(releaseRuntime, releaseRuntime);
    else releaseRuntime();
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
    const glyphSource = manifest.bindings.some(
      (binding) => binding.name === "glyphAtlas",
    )
      ? prepareGlyphAtlas()
      : undefined;
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
    completion = new GpuCompletion(
      win,
      runtime.tier === "webgl2"
        ? (target as WebGL2RenderingContext)
        : undefined,
    );
    const loaded = runtime.load(manifest);
    const hasCache =
      program.acceleration === "tiles-v1" ||
      program.acceleration === "surface-v1";
    const accelerated =
      hasCache &&
      options.acceleration !== false &&
      (runtime.tier === "webgpu" ||
        !!(target as WebGL2RenderingContext).getExtension(
          "EXT_color_buffer_float",
        ));
    const curveCache = accelerated && program.kind === "parametric";
    const glyphWork = glyphSource
      ? loadGlyphAtlas(
          runtime,
          false,
          undefined,
          () => !destroyed,
          glyphSource,
        ).then((value) => {
          glyphs = value;
        })
      : Promise.resolve();
    await Promise.resolve();
    // WebGPU compiles these independent pipelines concurrently. All resources
    // settle before cleanup, including when a sibling pipeline fails.
    const prepared = await Promise.allSettled([
      glyphWork,
      dataArrays.size && runtime.tier === "webgpu"
        ? createDevice({ runtime }).then((value) => {
            dataDevice = value;
          })
        : Promise.resolve(),
      loaded.render({
        targets: [format],
        ...(hasCache || program.picking === "point-v1"
          ? {
              vertex: "fullscreen",
              fragment: hasCache && !accelerated ? "drawReference" : "draw",
            }
          : {}),
      }),
      curveCache
        ? loaded.render({
            vertex: "fullscreen",
            fragment: "buildCurveIntervals",
            targets: ["rgba32float"],
          })
        : Promise.resolve(undefined),
      accelerated
        ? loaded.render({
            vertex: "fullscreen",
            fragment: "buildSpatialLabels",
            targets: ["rgba32float"],
          })
        : Promise.resolve(undefined),
      curveCache
        ? loaded.render({
            vertex: "fullscreen",
            fragment: "buildCurveCandidates",
            targets: ["rgba32uint"],
          })
        : Promise.resolve(undefined),
    ]);
    function result<T>(value: PromiseSettledResult<T>): T {
      if (value.status === "rejected") throw value.reason;
      return value.value;
    }
    result(prepared[0]);
    result(prepared[1]);
    const pipeline = result(prepared[2]);
    const intervalPipeline = result(prepared[3]);
    const labelPipeline = result(prepared[4]);
    const candidatePipeline = result(prepared[5]);
    for (const [name, values] of dataArrays)
      inputs[name] = dataDevice ? dataDevice.array(values) : resident(values);
    const preparePicking = (): Promise<RenderPipeline> => {
      if (pickPipeline) return Promise.resolve(pickPipeline);
      if (!pickPreparation) {
        pickPreparation = loaded
          .render({
            vertex: "fullscreen",
            fragment: "pick",
            targets: ["rgba32uint"],
          })
          .then((value) => {
            pickPipeline = value;
            return value;
          });
        void pickPreparation.catch(() => {
          pickPreparation = undefined;
        });
      }
      return pickPreparation;
    };
    if (curveCache) {
      intervals = runtime.texture({
        size: [1024, 6],
        format: "rgba32float",
      });
      candidates = runtime.texture({ size: [1, 1], format: "rgba32uint" });
    }
    if (accelerated)
      labels = runtime.texture({ size: [1, 38], format: "rgba32float" });
    let preparedKey = "";
    let preparedLabelsKey = "";
    let preparedSizing = false;
    controller = createPlotInteraction(
      canvas,
      bounds,
      requestDraw,
      options.interactive !== false,
      undefined,
      { inertia: options.inertia, doubleClickReset: options.doubleClickReset },
    );
    if (options.camera)
      controller.setCamera(
        cameraUpdate(options.camera, controller.camera()) as Parameters<
          typeof controller.setCamera
        >[0],
        true,
      );
    let lastUniforms: object | undefined;
    let lastRatio = 1;
    const currentFrame = async () => {
      const box = canvas.getBoundingClientRect(),
        resolution = (lastUniforms as { resolution?: number[] } | undefined)
          ?.resolution;
      if (
        !lastUniforms ||
        dirty ||
        resolution?.[0] !== box.width ||
        resolution?.[1] !== box.height
      )
        await redraw();
      else if (drawing) await drawing;
      alive();
    };
    drawFrame = async () => {
      if (destroyed) return;
      controls?.update();
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
        options.pixelRatio ?? Math.min(win.devicePixelRatio || 1, 4);
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
      const pixelRatio = Math.min(
        canvas.width / box.width,
        canvas.height / box.height,
      );
      const tileSize = Math.max(
        4,
        Math.ceil(16 / pixelRatio),
        Math.ceil(box.width / Math.max(1, Math.floor(limit / 8))),
        Math.ceil(box.height / limit),
      );
      const tileColumns = Math.ceil(box.width / tileSize),
        tileRows = Math.ceil(box.height / tileSize);
      if (
        curveCache &&
        (candidates!.width !== tileColumns * 8 ||
          candidates!.height !== tileRows)
      ) {
        candidates!.resize(tileColumns * 8, tileRows);
        preparedKey = "";
      }
      const labelColumns = Math.min(
        limit,
        Math.ceil(Math.hypot(box.width, box.height) * pixelRatio) + 2,
      );
      if (accelerated && labels!.width !== labelColumns) {
        labels!.resize(labelColumns, 38);
        preparedLabelsKey = "";
      }
      const rotation = [...controller!.value("plotRotation")!];
      const lens = [...controller!.value("plotLens")!];
      const yaw = Math.fround(rotation[0]),
        pitch = Math.fround(rotation[1]);
      const u = {
        ...parameters,
        ...(supportsTransform ? { model, inverseModel } : {}),
        ...(supportsTransform
          ? { cameraLens: [Math.tan(Math.fround(lens[0]) * 0.5), lens[1]] }
          : {}),
        ...(supportsTransform
          ? { plotCenterZ: controller!.value("plotCenterZ")![0] }
          : {}),
        ...(supportsTransform
          ? surfaceUniforms(
              automaticDepth
                ? {
                    ...surface,
                    depthRange: [
                      surface.depthRange[0],
                      Math.max(surface.depthRange[1], lens[1] * 4),
                    ],
                  }
                : surface,
              surfaceBounds,
            )
          : {}),
        ...(vectorUniform("curveTiles", 4, "u32")
          ? {
              curveTiles: accelerated
                ? [tileColumns, tileRows, tileSize, labelColumns]
                : [0, 0, 16, 0],
            }
          : {}),
        ...(supportsFields
          ? {
              parameterBounds: domain.map((endpoint) =>
                Number.isFinite(endpoint) ? endpoint : 0,
              ),
              ...(supportsUnbounded
                ? {
                    parameterMode:
                      (Number.isFinite(domain[0]) ? 0 : 1) |
                      (Number.isFinite(domain[1]) ? 0 : 2),
                  }
                : {}),
              curveQuality: [quality.samples, quality.refinements],
              curvePattern: [
                style.lineStyle === "-" ? 0 : 1,
                style.dashPeriod,
                style.dashOffset,
                style.lineStyle === ":" ? 0.12 : 0.55,
              ],
            }
          : {}),
        resolution: [box.width, box.height],
        ...(supportsStyle
          ? {
              appearance: [
                style.axisWidth,
                style.gridWidth,
                style.curveWidth,
                style.labelSize,
              ],
              labelStyle: [
                style.tickDensity,
                style.labelHalo,
                style.labelBackground ? 1 : 0,
                0,
              ],
              decorationOpacity: decorationFades.map((fade) =>
                fade.value(win.performance.now()),
              ),
              decorations:
                (style.grid || decorationFades[0]!.active(win.performance.now())
                  ? 1
                  : 0) |
                (style.tickLabels ||
                decorationFades[1]!.active(win.performance.now())
                  ? 2
                  : 0) |
                (style.axisLabels ||
                decorationFades[2]!.active(win.performance.now())
                  ? 4
                  : 0),
            }
          : {}),
        plotCenter: [...controller!.value("plotCenter")!],
        plotSpan: [...controller!.value("plotSpan")!],
        plotRotation: rotation,
        ...(vectorUniform("rotationBasis", 4, "f32")
          ? {
              rotationBasis: [
                Math.sin(yaw),
                Math.cos(yaw),
                Math.sin(pitch),
                Math.cos(pitch),
              ],
            }
          : {}),
        plotPan: [...controller!.value("plotPan")!],
        plotBlend: controller!.value("plotBlend")![0],
        probe,
        view3d: mode === "3d" ? (projection === "perspective" ? 2 : 1) : 0,
      };
      lastUniforms = u;
      lastRatio = pixelRatio;
      const frame = runtime.frame();
      const geometryKey = curveCache
        ? JSON.stringify([
            u.resolution,
            u.plotCenter,
            u.plotSpan,
            u.plotRotation,
            u.plotPan,
            u.probe,
            u.view3d,
            lens,
            u.plotCenterZ,
            domain,
            quality.samples,
            style.curveWidth,
            style.lineStyle,
            style.dashPeriod,
            style.dashOffset,
            pixelRatio,
            parameters,
            model,
            inputGeneration,
          ])
        : "";
      const labelsKey = accelerated
        ? JSON.stringify([
            u.resolution,
            u.plotCenter,
            u.plotSpan,
            u.plotRotation,
            u.plotPan,
            u.view3d,
            lens,
            u.plotCenterZ,
            style.labelSize,
            style.tickDensity,
            pixelRatio,
            model,
          ])
        : "";
      if (accelerated && preparedLabelsKey !== labelsKey) {
        frame.pass({ color: [labels!] }, (pass) =>
          pass.draw(labelPipeline!, { u } as never, { count: 3 }),
        );
      }
      if (curveCache && preparedKey !== geometryKey) {
        frame.pass({ color: [intervals!] }, (pass) => {
          if (style.curveWidth === 0) pass.setScissorRect(0, 5, 1, 1);
          pass.draw(
            intervalPipeline!,
            { u, font: { pixelRatio }, ...inputs } as never,
            {
              count: 3,
            },
          );
        });
        if (style.curveWidth > 0)
          frame.pass({ color: [candidates!] }, (pass) =>
            pass.draw(
              candidatePipeline!,
              { u, curveIntervals: intervals } as never,
              { count: 3 },
            ),
          );
      }
      frame.pass({ color: [target] }, (pass) =>
        pass.draw(
          pipeline,
          {
            u,
            ...inputs,
            ...(accelerated
              ? {
                  spatialLabels: labels,
                  ...(curveCache
                    ? { curveIntervals: intervals, curveCandidates: candidates }
                    : {}),
                }
              : {}),
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
      await completion!.wait();
      preparedKey = geometryKey;
      preparedLabelsKey = labelsKey;
    };
    controller.setMode(mode === "3d");
    if (typeof win.ResizeObserver === "function") {
      observer = new win.ResizeObserver(requestDraw);
      observer.observe(canvas);
    }
    win.addEventListener("resize", requestDraw);
    await redraw();
    const plot: Plot = {
      kind: program.kind,
      getMode() {
        alive();
        return mode;
      },
      getProjection() {
        alive();
        return projection;
      },
      getContainer() {
        alive();
        return controls!.container();
      },
      addControl(control, position) {
        alive();
        controls!.add(control, position);
        return plot;
      },
      removeControl(control) {
        alive();
        controls!.remove(control);
        return plot;
      },
      resetView() {
        alive();
        pauseAnimations();
        controller!.reset();
      },
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
        decorationKeys.forEach((key, i) =>
          decorationFades[i]!.set(
            style[key] ? 1 : 0,
            win.performance.now(),
            win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
              false,
          ),
        );
        requestDraw();
      },
      setDomain(value) {
        alive();
        checkFields();
        domain = checkedDomain(value);
        requestDraw();
      },
      domain() {
        alive();
        checkFields();
        if (program.kind !== "parametric")
          throw new TypeError(
            "Scalar functions have no bounded parameter domain.",
          );
        return [...domain];
      },
      setQuality(value) {
        alive();
        checkQuality(value);
        Object.assign(quality, value);
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
      parameters() {
        alive();
        return { ...parameters };
      },
      setData(name, values) {
        alive();
        if (
          !dataArrays.has(name) ||
          !(values instanceof Float32Array) ||
          !values.length
        )
          throw new TypeError(
            "setData needs a declared array binding and a nonempty Float32Array.",
          );
        const copy = values.slice(),
          next = dataDevice ? dataDevice.array(copy) : resident(copy),
          previous = inputs[name];
        inputs[name] = next;
        dataArrays.set(name, copy);
        inputGeneration++;
        if (dataDevice) dataDevice.release(previous);
        else previous.destroy();
        requestDraw();
      },
      getCamera() {
        alive();
        return controller!.camera();
      },
      setCamera(value) {
        alive();
        if (
          (value.fov !== undefined || value.distance !== undefined) &&
          !supportsTransform
        )
          throw new Error("Recompile this program to animate the camera lens.");
        if (value.z !== undefined && !supportsTransform)
          throw new Error(
            "Recompile this program to move the camera focus in 3D.",
          );
        controller!.setCamera(
          cameraUpdate(value, controller!.camera()) as Parameters<
            NonNullable<typeof controller>["setCamera"]
          >[0],
        );
      },
      getTransform() {
        alive();
        return [...model] as unknown as Matrix4;
      },
      setTransform(value) {
        alive();
        if (!supportsTransform)
          throw new Error("Recompile this program to transform the scene.");
        const inverse = invertAffineMatrix(value);
        model = [...value] as unknown as Matrix4;
        inverseModel = inverse;
        requestDraw();
      },
      setSurface(value) {
        alive();
        if (program.kind !== "surface")
          throw new TypeError("Surface settings require a surface program.");
        surface = surfaceOptions(value, surface);
        if (value.depthRange !== undefined) automaticDepth = false;
        requestDraw();
      },
      setSurfaceDomain(value) {
        alive();
        if (program.kind !== "surface")
          throw new TypeError("Surface domains require a surface program.");
        surfaceBounds = surfaceDomain(value);
        requestDraw();
      },
      transition(to, settings = {}) {
        alive();
        validateParameters(to.parameters ?? {});
        const destination = { ...to.parameters };
        const fromParameters = { ...parameters };
        const fromCamera = controller!.camera();
        const toCamera = cameraUpdate(to.camera ?? {}, fromCamera);
        const cameraKeys = Object.keys(to.camera ?? {});
        if (
          (to.camera?.fov !== undefined || to.camera?.distance !== undefined) &&
          !supportsTransform
        )
          throw new Error("Recompile this program to animate the camera lens.");
        if (to.camera?.z !== undefined && !supportsTransform)
          throw new Error(
            "Recompile this program to move the camera focus in 3D.",
          );
        if (to.transform && !supportsTransform)
          throw new Error("Recompile this program to transform the scene.");
        const interpolateModel = to.transform
          ? matrixInterpolator(model, to.transform)
          : undefined;
        return tween(
          0,
          1,
          (progress) => {
            alive();
            const next = Object.fromEntries(
              Object.entries(destination).map(([name, value]) => [
                name,
                fromParameters[name] +
                  (value - fromParameters[name]) * progress,
              ]),
            );
            if (Object.keys(next).length) plot.setParameters(next);
            if (to.camera) {
              const camera = Object.fromEntries(
                cameraKeys.map((key) => {
                  const before = fromCamera[key as keyof PlotCamera],
                    after = toCamera[key as keyof PlotCamera];
                  return [
                    key,
                    typeof before === "number" && typeof after === "number"
                      ? before + (after - before) * progress
                      : (after as readonly number[]).map(
                          (value, i) =>
                            (before as readonly number[])[i] +
                            (value - (before as readonly number[])[i]) *
                              progress,
                        ),
                  ];
                }),
              );
              plot.setCamera(camera);
            }
            if (interpolateModel) plot.setTransform(interpolateModel(progress));
          },
          settings,
        );
      },
      animate(to, settings = {}) {
        alive();
        const animation = new Timeline({
          window: win,
          render: redraw,
          onError: report,
          repeat: settings.repeat,
          yoyo: settings.yoyo,
          reducedMotion: settings.reducedMotion,
          onStateChange(state) {
            if (state === "playing" || state === "paused")
              animations.add(animation);
            else if (state === "finished" || state === "cancelled")
              animations.delete(animation);
          },
        });
        animation.add(plot.transition(to, settings), 0);
        animations.add(animation);
        return animation.play();
      },
      async pick(position, radius = 8) {
        alive();
        if (program.picking !== "point-v1")
          throw new Error("Recompile this program to enable GPU picking.");
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
        const box = canvas.getBoundingClientRect();
        if (
          box.width <= 0 ||
          box.height <= 0 ||
          position[0] < 0 ||
          position[0] > box.width ||
          position[1] < 0 ||
          position[1] > box.height
        )
          return null;
        const [, picking] = await Promise.all([
          currentFrame(),
          preparePicking(),
        ]);
        alive();
        const output = runtime.texture({ size: [2, 1], format: "rgba32uint" });
        try {
          const frame = runtime.frame();
          frame.pass({ color: [output] }, (pass) =>
            pass.draw(
              picking,
              {
                u: lastUniforms,
                ...inputs,
                query: {
                  pixel: [position[0], box.height - position[1]],
                  radius,
                },
              } as never,
              { count: 3 },
            ),
          );
          await frame.submit();
          const bytes = await output.read();
          alive();
          const bits = new Uint32Array(bytes.buffer, bytes.byteOffset, 8);
          if (!bits[3]) return null;
          const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
          return {
            kind: program.kind,
            point: [values[0], values[1], values[2]],
            ...(program.kind === "surface" ? {} : { parameter: values[4] }),
            distance: values[5],
          };
        } finally {
          output.destroy();
        }
      },
      on(type, listener) {
        alive();
        if (program.picking !== "point-v1")
          throw new Error("Recompile this program to enable GPU picking.");
        picker!.on(type, listener);
        return plot;
      },
      off(type, listener) {
        picker!.off(type, listener);
        return plot;
      },
      async toBlob(settings = {}) {
        alive();
        await currentFrame();
        if (!lastUniforms)
          throw new Error(
            "Render the plot at a nonzero CSS size before exporting.",
          );
        const box = canvas.getBoundingClientRect();
        const resolution = (lastUniforms as { resolution: number[] })
          .resolution;
        const cssWidth = settings.width ?? (box.width || resolution[0]),
          cssHeight = settings.height ?? (box.height || resolution[1]);
        const ratio = settings.pixelRatio ?? lastRatio;
        if (
          ![cssWidth, cssHeight, ratio].every(
            (value) => Number.isFinite(value) && value > 0,
          ) ||
          ratio > 4
        )
          throw new RangeError(
            "PNG dimensions and density must be positive and finite; pixelRatio is at most four.",
          );
        const width = Math.ceil(cssWidth * ratio),
          height = Math.ceil(cssHeight * ratio);
        const limit =
          runtime.tier === "webgpu"
            ? (runtime.limits.maxTextureDimension2D ?? 8192)
            : ((target as WebGL2RenderingContext).getParameter(
                (target as WebGL2RenderingContext).MAX_RENDERBUFFER_SIZE,
              ) as number);
        if (
          width * height > 16_777_216 ||
          Math.max(width, height) > Math.min(limit, 16384)
        )
          throw new RangeError(
            "PNG export exceeds the device dimension or 16 megapixel limit.",
          );
        const textures: Texture[] = [];
        const make = (w: number, h: number, format: string) => {
          const texture = runtime.texture({ size: [w, h], format });
          textures.push(texture);
          return texture;
        };
        try {
          const output = make(width, height, format);
          const tileSize = Math.max(
            4,
            Math.ceil(16 / ratio),
            Math.ceil(cssWidth / Math.max(1, Math.floor(limit / 8))),
            Math.ceil(cssHeight / limit),
          );
          const columns = Math.ceil(cssWidth / tileSize),
            rows = Math.ceil(cssHeight / tileSize);
          const labelColumns = Math.min(
            limit,
            Math.ceil(Math.hypot(cssWidth, cssHeight) * ratio) + 2,
          );
          const labels = accelerated
            ? make(labelColumns, 38, "rgba32float")
            : undefined;
          const intervals = curveCache
              ? make(1024, 6, "rgba32float")
              : undefined,
            candidates = curveCache
              ? make(columns * 8, rows, "rgba32uint")
              : undefined;
          const u = {
            ...lastUniforms,
            resolution: [cssWidth, cssHeight],
            ...(vectorUniform("curveTiles", 4, "u32")
              ? {
                  curveTiles: accelerated
                    ? [columns, rows, tileSize, labelColumns]
                    : [0, 0, 16, 0],
                }
              : {}),
          };
          const resources = { ...inputs };
          const frame = runtime.frame();
          if (accelerated)
            frame.pass({ color: [labels!] }, (pass) =>
              pass.draw(labelPipeline!, { u } as never, { count: 3 }),
            );
          if (curveCache) {
            frame.pass({ color: [intervals!] }, (pass) =>
              pass.draw(
                intervalPipeline!,
                { u, font: { pixelRatio: ratio }, ...resources } as never,
                { count: 3 },
              ),
            );
            frame.pass({ color: [candidates!] }, (pass) =>
              pass.draw(
                candidatePipeline!,
                { u, curveIntervals: intervals } as never,
                { count: 3 },
              ),
            );
          }
          frame.pass({ color: [output] }, (pass) =>
            pass.draw(
              pipeline,
              {
                u,
                ...resources,
                ...(accelerated
                  ? {
                      spatialLabels: labels,
                      ...(curveCache
                        ? {
                            curveIntervals: intervals,
                            curveCandidates: candidates,
                          }
                        : {}),
                    }
                  : {}),
                ...(glyphs
                  ? { glyphAtlas: glyphs, font: { pixelRatio: ratio } }
                  : {}),
              } as never,
              { count: 3 },
            ),
          );
          await frame.submit();
          const bytes = await output.read();
          alive();
          if (format.startsWith("bgra"))
            for (let i = 0; i < bytes.length; i += 4) {
              const red = bytes[i];
              bytes[i] = bytes[i + 2];
              bytes[i + 2] = red;
            }
          return encodePng(bytes, width, height);
        } finally {
          for (const texture of textures) texture.destroy();
        }
      },
      async saveImage(filename = "typeplot.png", settings = {}) {
        alive();
        if (!filename.toLowerCase().endsWith(".png"))
          throw new TypeError("saveImage supports PNG files.");
        const blob = await plot.toBlob(settings);
        alive();
        const url = URL.createObjectURL(blob),
          link = canvas.ownerDocument.createElement("a");
        link.href = url;
        link.download = filename;
        link.hidden = true;
        canvas.ownerDocument.body.appendChild(link);
        try {
          link.click();
        } finally {
          link.remove();
          win.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      },
      bounds() {
        alive();
        return controller!.bounds();
      },
      reset() {
        alive();
        pauseAnimations();
        probe = initialProbe;
        domain = [...initialDomain];
        Object.assign(quality, initialQuality);
        Object.assign(style, initialStyle);
        decorationKeys.forEach((key, i) =>
          decorationFades[i]!.set(
            style[key] ? 1 : 0,
            win.performance.now(),
            true,
          ),
        );
        Object.assign(parameters, initialParameters);
        model = [...initialModel] as unknown as Matrix4;
        inverseModel = invertAffineMatrix(model);
        surface = surfaceOptions(initialSurface);
        surfaceBounds = surfaceDomain(initialSurfaceBounds);
        automaticDepth = options.surface?.depthRange === undefined;
        mode = initialMode;
        projection = initialProjection;
        controller!.setMode(mode === "3d");
        controller!.reset();
        requestDraw();
      },
      redraw,
      destroy,
    };
    picker = new PointerPicker(
      canvas,
      (position) => plot.pick(position),
      report,
    );
    canvas.addEventListener("pointerdown", pauseAnimations);
    canvas.addEventListener("wheel", pauseAnimations, { passive: true });
    canvas.addEventListener("keydown", pauseAnimations);
    controls = new PlotControlHost(canvas, plot);
    return plot;
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
