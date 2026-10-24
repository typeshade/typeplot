import type {
  PlotCamera,
  PlotCameraUpdate,
  SurfaceDomain,
  SurfaceOptions,
} from "./types.js";
export const DEFAULT_SURFACE: Required<SurfaceOptions> = {
  colorMap: "viridis",
  valueRange: [-1, 1],
  colorBar: true,
  shading: true,
  wireframe: false,
  contours: false,
  contourInterval: 0.25,
  filled: true,
  opacity: 1,
  depthRange: [0.101, 12],
};
export const COLOR_MAPS = ["viridis", "plasma", "coolwarm", "gray"] as const;
export function surfaceOptions(
  value: SurfaceOptions,
  previous = DEFAULT_SURFACE,
): Required<SurfaceOptions> {
  const result = { ...previous, ...value };
  for (const key of Object.keys(value))
    if (!Object.hasOwn(DEFAULT_SURFACE, key))
      throw new TypeError(`Unknown surface option '${key}'.`);
  if (!COLOR_MAPS.includes(result.colorMap))
    throw new TypeError("Unknown colorMap.");
  for (const key of [
    "colorBar",
    "shading",
    "wireframe",
    "contours",
    "filled",
  ] as const)
    if (typeof result[key] !== "boolean")
      throw new TypeError(`${key} must be a boolean.`);
  for (const key of ["valueRange", "depthRange"] as const) {
    const range = result[key];
    if (
      !Array.isArray(range) ||
      range.length !== 2 ||
      !range.every(Number.isFinite) ||
      !(Math.fround(range[1]) > Math.fround(range[0])) ||
      Math.max(...range.map(Math.abs), range[1] - range[0]) > 3.402823466e38
    )
      throw new RangeError(`${key} needs two finite, increasing f32 values.`);
    result[key] = [range[0], range[1]];
  }
  if (result.depthRange[0] < 0.101 || result.depthRange[1] > 1e6)
    throw new RangeError("depthRange must stay within [0.101, 1e6].");
  if (
    !Number.isFinite(result.opacity) ||
    result.opacity < 0 ||
    result.opacity > 1
  )
    throw new RangeError("opacity must be between zero and one.");
  if (
    !Number.isFinite(result.contourInterval) ||
    result.contourInterval < 1e-7 ||
    result.contourInterval > 3.402823466e38
  )
    throw new RangeError(
      "contourInterval must be a finite f32 of at least 1e-7.",
    );
  return result;
}
export function surfaceDomain(value: SurfaceDomain): SurfaceDomain {
  for (const axis of [value?.x, value?.z])
    if (
      !Array.isArray(axis) ||
      axis.length !== 2 ||
      axis.some(
        (v) =>
          typeof v !== "number" ||
          Number.isNaN(v) ||
          (Number.isFinite(v) && Math.abs(v) > 3.402823466e38),
      ) ||
      !(axis[1] > axis[0])
    )
      throw new RangeError(
        "Surface domain needs increasing real x/z endpoints; infinities are supported.",
      );
  return { x: [...value.x], z: [...value.z] };
}
export function surfaceUniforms(
  style: Required<SurfaceOptions>,
  domain: SurfaceDomain,
) {
  const values = [domain.x[0], domain.z[0], domain.x[1], domain.z[1]];
  return {
    surfaceBounds: values.map((v) => (Number.isFinite(v) ? v : 0)),
    surfaceDomainMode:
      (Number.isFinite(domain.x[0]) ? 1 : 0) |
      (Number.isFinite(domain.x[1]) ? 2 : 0) |
      (Number.isFinite(domain.z[0]) ? 4 : 0) |
      (Number.isFinite(domain.z[1]) ? 8 : 0),
    surfaceRange: style.valueRange,
    surfaceDepth: style.depthRange,
    surfaceRender: [
      COLOR_MAPS.indexOf(style.colorMap),
      style.opacity,
      style.contourInterval,
      0,
    ],
    surfaceFlags:
      (style.shading ? 1 : 0) |
      (style.wireframe ? 2 : 0) |
      (style.contours ? 4 : 0) |
      (style.colorBar ? 8 : 0) |
      (style.filled ? 16 : 0),
  };
}
export function cameraUpdate(
  value: PlotCameraUpdate,
  previous: PlotCamera,
): PlotCamera {
  const result = { ...previous };
  for (const [key, pair] of Object.entries(value)) {
    if (key === "z") {
      if (
        typeof pair !== "number" ||
        !Number.isFinite(pair) ||
        Math.abs(pair) > 3.402823466e32
      )
        throw new RangeError(
          "camera.z must be finite within the supported range.",
        );
      result.z = pair;
      continue;
    }
    if (key === "fov" || key === "distance") {
      if (
        typeof pair !== "number" ||
        !Number.isFinite(pair) ||
        (key === "fov"
          ? pair < 0.001 || pair > Math.PI - 0.001
          : pair < 0.202 || pair > 1000)
      )
        throw new RangeError(`camera.${key} is outside the supported range.`);
      result[key] = pair;
      continue;
    }
    if (!["center", "span", "rotation", "pan"].includes(key))
      throw new TypeError(`Unknown camera field '${key}'.`);
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      pair.some((v) => !Number.isFinite(v) || Math.abs(v) > 3.402823466e32) ||
      (key === "span" && pair.some((v) => v <= 0))
    )
      throw new RangeError(
        `camera.${key} needs two finite values${key === "span" ? ", both positive" : ""}.`,
      );
    result[key as "center" | "span" | "rotation" | "pan"] = [...pair] as [
      number,
      number,
    ];
  }
  return result;
}
