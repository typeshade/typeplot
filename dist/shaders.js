var e=`"use typeshade";

declare const glyphAtlas: texture_2d<f32>;
class FontUniforms { pixelRatio: f32; }
declare const font: uniform<FontUniforms>;

export function pixelWidth(): f32 { return 1 / max(font.pixelRatio, 0.0001); }

/** A square-ended tick in the screen-axis frame, with physical-pixel AA.
 * The long edge follows the exact perpendicular of the projected axis tangent.
 * Evaluate locally instead of subtracting short, rounded segment endpoints. */
export function tickMark(pixel: vec2, center: vec2, tangent: vec2, halfLength: f32, width: f32): f32 {
  if (width <= 0 || halfLength <= 0) return 0;
  const delta = pixel - center;
  const normal = vec2(-tangent.y, tangent.x);
  const q = abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2(width * 0.5, halfLength);
  const distance = length(max(q, vec2(0))) + min(max(q.x, q.y), 0);
  const aa = pixelWidth() * 0.5;
  return 1 - smoothstep(-aa, aa, distance);
}

/** X-GIS/TinySDF distance encoding over licensed IBM Plex input glyphs.
 * Source conventions: X-GIS/X-GIS map/src/shaders/dsl/text.ts (MIT). */
export function glyphIndex(code: i32): i32 {
  if (code >= 32 && code < 256) return code - 32;
  if (code >= 880 && code < 1024) return 224 + code - 880;
  if (code >= 12592 && code < 12688) return 368 + code - 12592;
  if (code >= 44032 && code <= 55203) return 464 + code - 44032;
  if (code >= 8192 && code < 8960) return 11636 + code - 8192;
  return 12404;
}

export function glyphLayers(p: vec2, code: i32, fontSize: f32, halo: f32): vec2 {
  // Match the physical display size to a native hinted glyph bucket. This
  // follows X-GIS's local-glyph size routing while keeping the atlas offline.
  const index = glyphIndex(code);
  const physicalSize = fontSize * font.pixelRatio;
  let referenceSize = 24;
  let cell = vec2(30, 36);
  let origin = vec2i((index % 132) * 30, (index / 132) * 36);
  if (code >= 32 && code < 128) {
    if (physicalSize <= 14) {
      referenceSize = 12;
      cell = vec2(15, 18);
      origin = vec2i((code - 32) * 15, 3384);
    } else if (physicalSize > 28) {
      referenceSize = 48;
      cell = vec2(60, 72);
      origin = vec2i(((code - 32) % 66) * 60, 3402 + ((code - 32) / 66) * 72);
    }
  }
  const q = p * (referenceSize / fontSize) - vec2(0.5);
  if (q.x < 0 || q.y < 0 || q.x >= cell.x - 1 || q.y >= cell.y - 1) return vec2(0);
  const base = vec2i(floor(q));
  const t = fract(q);
  const a = textureLoad(glyphAtlas, origin + base, 0).r;
  const b = textureLoad(glyphAtlas, origin + base + vec2i(1, 0), 0).r;
  const c = textureLoad(glyphAtlas, origin + base + vec2i(0, 1), 0).r;
  const d = textureLoad(glyphAtlas, origin + base + vec2i(1, 1), 0).r;
  const distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  // X-GIS fill edge and analytic AA: EDGE_GAMMA 0.105 * ONE_EM 24.
  // Explicit physical size keeps the rule valid inside numeric label branches.
  const edge = 0.75;
  const width = max(2.52 / max(fontSize * font.pixelRatio, 1), 1 / 255);
  const fill = smoothstep(edge - width, edge + width, distance);
  // Atlas radius is one third em. Expand the same distance field in CSS pixels.
  const outerEdge = edge - min(halo, fontSize * 0.1) * 3 / fontSize;
  return vec2(fill, smoothstep(outerEdge - width, outerEdge + width, distance));
}

export function glyphCoverage(p: vec2, code: i32, fontSize: f32): f32 {
  return glyphLayers(p, code, fontSize, 0).x;
}

class NumberFormat {
  value: f32;
  negative: bool;
  scientific: bool;
  decimals: i32;
  digits: i32;
  exponent: i32;
  length: i32;
}

function numberFormat(input: f32, spacing: f32): NumberFormat {
  const value = abs(input) < abs(spacing) * 0.0001 ? 0 : input;
  let magnitude = abs(value);
  let exponent = i32(floor(log2(max(magnitude, 1e-30)) / log2(10)));
  const scientific = magnitude > 0 && (exponent >= 5 || exponent < -3);
  let decimals = i32(clamp(ceil(-log2(max(abs(spacing), 1e-30)) / log2(10)), 0, 6));
  let digits: i32 = 1;
  if (scientific) {
    decimals = i32(clamp(ceil(f32(exponent) - log2(max(abs(spacing), 1e-30)) / log2(10)), 0, 6));
    const scale = pow(10, f32(decimals));
    magnitude = floor(magnitude / pow(10, f32(exponent)) * scale + 0.5);
    if (magnitude >= 10 * scale) { magnitude = scale; exponent = exponent + 1; }
  } else {
    magnitude = floor(magnitude * pow(10, f32(decimals)) + 0.5);
    digits = i32(floor(log2(max(floor(magnitude / pow(10, f32(decimals))), 1)) / log2(10))) + 1;
  }
  for (let i = 0; i < 6; i++) {
    if (decimals > 0 && abs(magnitude - floor(magnitude / 10) * 10) < 0.01) {
      magnitude /= 10;
      decimals -= 1;
    }
  }
  const negative = value < 0;
  const length: i32 = scientific ? 5 + (decimals > 0 ? 1 + decimals : 0) + (negative ? i32(1) : i32(0)) : digits + (decimals > 0 ? 1 + decimals : 0) + (negative ? i32(1) : i32(0));
  return { value: magnitude, negative, scientific, decimals, digits, exponent, length };
}

/** Select a formatted character independently of its padded atlas cell. */
function numberGlyph(n: NumberFormat, column: i32): i32 {
  let i = column;
  if (n.negative && i == 0) return 45;
  i = i - (n.negative ? i32(1) : i32(0));
  if (n.scientific) {
    const mantissaLength = 1 + (n.decimals > 0 ? 1 + n.decimals : 0);
    if (i < mantissaLength) {
      if (n.decimals > 0 && i == 1) return 46;
      const digit = i - (i > 1 ? i32(1) : i32(0));
      return 48 + i32(floor(n.value / pow(10, f32(n.decimals - digit)))) % 10;
    }
    const suffix = i - mantissaLength;
    if (suffix == 0) return 101;
    if (suffix == 1) return n.exponent < 0 ? 45 : 43;
    if (suffix == 2) return 48 + abs(n.exponent) / 10;
    return 48 + abs(n.exponent) % 10;
  }
  if (n.decimals > 0 && i == n.digits) return 46;
  const digit = i - (i > n.digits ? i32(1) : i32(0));
  return 48 + i32(floor(n.value / pow(10, f32(n.digits + n.decimals - digit - 1)))) % 10;
}

/** Keep full SDF padding at character boundaries, as X-GIS glyph slots do.
 * Advance locates each glyph; it must never act as a clipping rectangle. */
export function tickNumberLayers(p: vec2, value: f32, spacing: f32, align: f32, fontSize: f32, halo: f32): vec2 {
  const n = numberFormat(value, spacing);
  const advance = fontSize * 0.625;
  const offset = p + vec2(f32(n.length) * advance * align, 0);
  if (offset.y < 0 || offset.y > fontSize * 1.5) return vec2(0);
  const column = i32(floor(offset.x / advance));
  const atlasBearing = fontSize * (3 / 24);
  let coverage = vec2(0);
  for (let neighbor = -1; neighbor <= 1; neighbor++) {
    const index = column + neighbor;
    if (index >= 0 && index < n.length) {
      const local = vec2(offset.x - f32(index) * advance + atlasBearing, offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

export function tickNumber(p: vec2, value: f32, spacing: f32, align: f32): f32 {
  return tickNumberSized(p, value, spacing, align, 11);
}

export function tickNumberSized(p: vec2, value: f32, spacing: f32, align: f32, fontSize: f32): f32 {
  return tickNumberLayers(p, value, spacing, align, fontSize, 0).x;
}

export function numberWidth(value: f32, spacing: f32, size: f32): f32 {
  return f32(numberFormat(value, spacing).length) * size * 0.625;
}

/** Hierarchical decimal lattices: shared ticks retain full opacity at every LOD boundary.
 * Intermediate ticks fade as a continuous function of scale, without camera lag. */
export function tickLevels(raw: f32): vec3 {
  const safe = max(raw, 1e-25);
  const unit = pow(10, floor(log2(safe) / log2(10)));
  const fine = safe < unit * 2 ? unit : safe < unit * 5 ? unit * 2 : unit * 5;
  const coarse = safe < unit * 2 ? unit * 2 : safe < unit * 5 ? unit * 5 : unit * 10;
  const phase = log2(safe / fine) / log2(coarse / fine);
  return vec3(fine, coarse, 1 - smoothstep(0, 1, phase));
}

export function tickOpacity(value: f32, levels: vec3): f32 {
  const multiple = value / levels.y;
  return abs(multiple - floor(multiple + 0.5)) < 0.001 ? 1 : levels.z;
}

/** Compact rounded label plate, using the exact formatted numeric advance. */
export function numberPlate(p: vec2, value: f32, spacing: f32, align: f32, size: f32): f32 {
  const width = numberWidth(value, spacing, size);
  const center = vec2(width * (0.5 - align), size * 0.76);
  const half = vec2(width * 0.5 + 3.5, size * 0.55 + 2);
  const q = abs(p - center) - half + vec2(3);
  const distance = length(max(q, vec2(0))) + min(max(q.x, q.y), 0) - 3;
  return 1 - smoothstep(-pixelWidth() * 0.5, pixelWidth() * 0.5, distance);
}

/** At non-nested 2/5 transitions only shared multiples remain fully opaque. */
export function coarseTickOpacity(value: f32, levels: vec3): f32 {
  const multiple = value / levels.x;
  return abs(multiple - floor(multiple + 0.5)) < 0.001 ? 1 : 1 - levels.z;
}
`;var t=`"use typeshade";

/** Compact linear color-map anchors, evaluated on the GPU. */
export function colorMap(value: f32, palette: u32): vec3 {
  const t = clamp(value, 0, 1);
  if (palette == u32(3)) return vec3(t);
  if (palette == u32(2)) return t < 0.5 ? mix(vec3(0.23, 0.30, 0.75), vec3(0.87), t * 2) : mix(vec3(0.87), vec3(0.71, 0.02, 0.15), t * 2 - 1);
  let a = vec3(0.267, 0.005, 0.329), b = vec3(0.230, 0.322, 0.546), c = vec3(0.128, 0.567, 0.551), d = vec3(0.369, 0.789, 0.383), e = vec3(0.993, 0.906, 0.144);
  if (palette == u32(1)) {a = vec3(0.050, 0.030, 0.528); b = vec3(0.495, 0.012, 0.658); c = vec3(0.798, 0.280, 0.470); d = vec3(0.973, 0.586, 0.252); e = vec3(0.940, 0.975, 0.131);}
  if (t < 0.25) return mix(a, b, t * 4);
  if (t < 0.5) return mix(b, c, t * 4 - 1);
  if (t < 0.75) return mix(c, d, t * 4 - 2);
  return mix(d, e, t * 4 - 3);
}
`;var a=`"use typeshade";
import { glyphCoverage, glyphLayers, tickNumberLayers, numberPlate, numberWidth, tickLevels, tickOpacity, coarseTickOpacity, pixelWidth, tickMark } from "./font.shade.ts";
import { colorMap } from "./palette.shade.ts";

/** Host-controlled viewport, in data units; rotation is yaw/pitch in radians. */
export class PlotViewport {
  resolution: vec2;
  plotCenter: vec2;
  plotSpan: vec2;
  plotRotation: vec2;
  rotationBasis: vec4;
  plotPan: vec2;
  plotBlend: f32;
  appearance: vec4;
  decorations: u32;
  labelStyle: vec4;
  decorationOpacity: vec3;
}

export class PlotUniforms extends PlotViewport {
  model: mat4;
  inverseModel: mat4;
  axesModel: mat4;
  inverseAxesModel: mat4;
  sceneOpacity: vec2;
  cameraLens: vec2;
  plotCenterZ: f32;
  probe: f32;
  parameterFocusSeed: f32;
  view3d: u32;
  parameterBounds: vec2;
  parameterMode: u32;
  curveQuality: vec2u;
  curvePattern: vec4;
  curveTiles: vec4u;
  surfaceBounds: vec4;
  surfaceDomainMode: u32;
  surfaceRange: vec2;
  surfaceDepth: vec2;
  surfaceRender: vec4;
  surfaceFlags: u32;
}

/** Coordinate-frame fields use their own matrix while the callback remains in content space. */
export function axesUniforms(u: PlotUniforms): PlotUniforms {
  return { resolution: u.resolution, plotCenter: u.plotCenter, plotSpan: u.plotSpan, plotRotation: u.plotRotation, rotationBasis: u.rotationBasis, plotPan: u.plotPan, plotBlend: u.plotBlend, appearance: u.appearance, decorations: u.decorations, labelStyle: u.labelStyle, decorationOpacity: u.decorationOpacity, model: u.axesModel, inverseModel: u.inverseAxesModel, axesModel: u.axesModel, inverseAxesModel: u.inverseAxesModel, sceneOpacity: u.sceneOpacity, cameraLens: u.cameraLens, plotCenterZ: u.plotCenterZ, probe: u.probe, parameterFocusSeed: u.parameterFocusSeed, view3d: u.view3d, parameterBounds: u.parameterBounds, parameterMode: u.parameterMode, curveQuality: u.curveQuality, curvePattern: u.curvePattern, curveTiles: u.curveTiles, surfaceBounds: u.surfaceBounds, surfaceDomainMode: u.surfaceDomainMode, surfaceRange: u.surfaceRange, surfaceDepth: u.surfaceDepth, surfaceRender: u.surfaceRender, surfaceFlags: u.surfaceFlags };
}

declare const curveIntervals: texture_2d<f32>;
declare const curveCandidates: texture_2d<u32>;
declare const spatialLabels: texture_2d<f32>;

type ScalarCurve = (x: f32) => f32;
type SpaceCurve = (t: f32) => vec3;
type HeightField = (x: f32, z: f32) => f32;
export class PickUniforms { pixel: vec2; radius: f32; }
declare const query: uniform<PickUniforms>;

/** Axis names use the same compact plate as single-character numeric labels. */
export function axisLabel(pixel: vec2, at: vec2, code: i32, u: PlotViewport): vec3 {
  if (any(abs(pixel - at) > vec2(u.appearance.w * 1.5 + 4 + pixelWidth()))) return vec3(0);
  const local = vec2(pixel.x - at.x, at.y - pixel.y + u.appearance.w * 0.75);
  return vec3(glyphLayers(local + vec2(u.appearance.w * 0.42, 0), code, u.appearance.w, u.labelStyle.y), numberPlate(local, 0, 1, 0.5, u.appearance.w) * u.labelStyle.z);
}

/** CSS-pixel layout keeps line widths and text stable across sizes and display density. */
export function plotSize(resolution: vec2): vec2 {
  return max(resolution, vec2(1));
}

export function distanceCoverage(distance: f32, width: f32): f32 {
  if (width <= 0) return 0;
  const aa = pixelWidth() * 0.5;
  return 1 - smoothstep(max(0, width * 0.5 - aa), width * 0.5 + aa, distance);
}

function stroke(p: vec2, a: vec2, b: vec2, width: f32): f32 {
  const radius = width * 0.5;
  if (width <= 0 || any(p < min(a, b) - vec2(radius + 1)) || any(p > max(a, b) + vec2(radius + 1))) return 0;
  const ab = b - a;
  const t = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0, 1);
  return distanceCoverage(length(p - a - ab * t), width);
}

/** SDF labels share the font and antialiasing used by the data renderer. */
function glyph(p: vec2, origin: vec2, axis: i32, size: f32): f32 {
  return glyphCoverage(vec2(p.x - origin.x + size * 0.42, origin.y - p.y + size * 0.75), 120 + axis, size);
}

function axisLevels(center: f32, span: f32, pixels: f32, horizontal: bool, u: PlotViewport): vec3 {
  const size = u.appearance.w;
  const rough = span * size * 4 / max(pixels, 1);
  const width = max(numberWidth(center - span * 0.5, rough, size), numberWidth(center + span * 0.5, rough, size));
  const gap = horizontal ? max(size * 3.5, width + size * 1.3) : size * 2.6;
  return tickLevels(span * gap / max(pixels * u.labelStyle.x, 1));
}

function numberAt(pixel: vec2, anchor: vec2, value: f32, spacing: f32, align: f32, size: f32, halo: f32, plate: f32): vec3 {
  const delta = vec2(pixel.x - anchor.x, anchor.y - pixel.y);
  if (delta.y < 0 || delta.y > size * 1.5 || abs(delta.x) > size * 16) return vec3(0);
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), numberPlate(delta, value, spacing, align, size) * plate);
}

function labelColor(color: vec3, labels: vec3): vec3 {
  const plated = mix(color, vec3(0.995), labels.z * 0.94);
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), labels.y), vec3(0.25, 0.29, 0.35), labels.x);
}

function pointColor(color: vec3, p: vec2, selected: vec2): vec3 {
  if (any(abs(p - selected) > vec2(7))) return color;
  const radius = length(p - selected);
  const halo = 1 - smoothstep(5, 7, radius);
  const dot = 1 - smoothstep(3, 4.5, radius);
  return mix(mix(color, vec3(1), halo), vec3(0.89, 0.29, 0.04), dot);
}

/** Shared spines, data ticks and axis glyphs for all two-dimensional plot styles. */
function axes2D(uv: vec2, u: PlotViewport, vertical: i32): vec4 {
  const size = plotSize(u.resolution);
  const span = max(u.plotSpan, vec2(0.00001));
  const lo = u.plotCenter - span * 0.5;
  const p = lo + uv * span;
  const pixel = uv * size;
  // When zero is outside the viewport, a boundary spine marks the visible frame.
  const origin = clamp((-lo / span) * size, vec2(14), size - vec2(14));
  let axes = max(
    stroke(pixel, vec2(12, origin.y), vec2(size.x - 12, origin.y), u.appearance.x),
    stroke(pixel, vec2(origin.x, 12), vec2(origin.x, size.y - 12), u.appearance.x),
  );
  const xLevels = axisLevels(u.plotCenter.x, span.x, size.x, true, u);
  const yLevels = axisLevels(u.plotCenter.y, span.y, size.y, false, u);
  let labels = vec3(0);
  let backgroundGrid = 0;
  for (let level = 0; level < 2; level++) {
    const tickStep = level == 0 ? vec2(xLevels.x, yLevels.x) : vec2(xLevels.y, yLevels.y);
    const nearest = floor(p / tickStep + 0.5) * tickStep;
    const weights = level == 0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels));
    const grid = abs(p - nearest) / span * size;
    const at = (nearest - lo) / span * size;
    axes = max(axes, max(
      tickMark(pixel, vec2(at.x, origin.y), vec2(1, 0), 4, u.appearance.x) * weights.x,
      tickMark(pixel, vec2(origin.x, at.y), vec2(0, 1), 4, u.appearance.x) * weights.y
    ));
    backgroundGrid = max(backgroundGrid, max(distanceCoverage(grid.x, u.appearance.y) * weights.x, distanceCoverage(grid.y, u.appearance.y) * weights.y));
    const width = numberWidth(nearest.x, xLevels.x, u.appearance.w);
    const xFit = smoothstep(width + 6, width + 14, tickStep.x / span.x * size.x);
    const yFit = smoothstep(u.appearance.w * 1.6, u.appearance.w * 2.2, tickStep.y / span.y * size.y);
    if ((u.decorations & u32(2)) != u32(0) && at.x > width * 0.5 + 6 && at.x < size.x - width * 0.5 - 6)
      labels = max(labels, numberAt(pixel, vec2(at.x, origin.y < u.appearance.w * 2 ? origin.y + u.appearance.w * 2 : origin.y - u.appearance.w * 0.65), nearest.x, xLevels.x, 0.5, u.appearance.w, u.labelStyle.y, u.labelStyle.z) * weights.x * xFit);
    if ((u.decorations & u32(2)) != u32(0) && at.y > 25 && at.y < size.y - 25 && abs(nearest.y) > yLevels.x * 0.001)
      labels = max(labels, numberAt(pixel, vec2(origin.x < u.appearance.w * 6 ? origin.x + 8 : origin.x - 8, at.y + u.appearance.w * 0.75), nearest.y, yLevels.x, origin.x < u.appearance.w * 6 ? 0 : 1, u.appearance.w, u.labelStyle.y, u.labelStyle.z) * weights.y * yFit);
  }
  labels *= u.decorationOpacity.y;
  if ((u.decorations & u32(4)) != u32(0)) labels = max(labels, axisLabel(pixel, vec2(size.x - 12, clamp(origin.y + 30, 40, size.y - 40)), 120, u) * u.decorationOpacity.z);
  if ((u.decorations & u32(4)) != u32(0)) labels = max(labels, axisLabel(pixel, vec2(clamp(origin.x + 14, 28, size.x - 28), size.y - 40), vertical, u) * u.decorationOpacity.z);
  // The same data-space ticks define the grid; no host-generated line geometry.
  return vec4(max(axes, ((u.decorations & u32(1)) != u32(0) ? backgroundGrid * 0.2 * u.decorationOpacity.x : 0)), labels);
}

function curveCoverage(p: vec2, value: f32, span: vec2, size: vec2, thickness: f32): f32 {
  // Clamp infinities before taking derivatives. A comparison also rejects a NaN result.
  const d = (p.y - clamp(value, -1e18, 1e18)) / span.y;
  const width = max(1 / size.y, min(fwidth(d), 0.025));
  return abs(value) < 1e18 ? 1 - smoothstep(0, width * thickness, abs(d)) : 0;
}

/** Filled scalar graph with a quarter-unit grid and the reference diagonal y = x. */
export function plotFilled(sample: ScalarCurve, uv: vec2, u: PlotViewport): vec4 {
  const span = max(u.plotSpan, vec2(0.00001));
  const p = u.plotCenter + (uv - 0.5) * span;
  const size = plotSize(u.resolution);
  const value = sample(p.x);
  const d = (p.y - clamp(value, -1e18, 1e18)) / span.y;
  const width = max(fwidth(d), 1 / size.y);
  const fill = abs(value) < 1e18 ? 1 - smoothstep(-width, width, d) : 0;
  let color = mix(vec3(0.95, 0.96, 0.98), vec3(0.09, 0.47, 1), fill);
  const g = p * 4;
  const distance = abs(fract(g + 0.5) - 0.5);
  const gridWidth = max(fwidth(g), vec2(0.000001));
  const grid = max(
    1 - smoothstep(0, gridWidth.x, distance.x),
    1 - smoothstep(0, gridWidth.y, distance.y),
  );
  color = mix(color, vec3(0.45), 0.35 * grid);
  const diagonal = curveCoverage(p, p.x, span, size, 1.5);
  color = mix(color, vec3(0.15), 0.6 * diagonal);
  const decor = axes2D(uv, u, 121);
  return vec4(labelColor(mix(color, vec3(0.39, 0.43, 0.49), decor.x), decor.yzw), 1);
}

/** Compare a wider blue curve with a narrow orange curve, including undefined raw pow. */
export function plotComparison(
  first: ScalarCurve,
  second: ScalarCurve,
  uv: vec2,
  u: PlotViewport,
): vec4 {
  const span = max(u.plotSpan, vec2(0.00001));
  const p = u.plotCenter + (uv - 0.5) * span;
  const size = plotSize(u.resolution);
  const blue = curveCoverage(p, first(p.x), span, size, 2.5);
  const orange = curveCoverage(p, second(p.x), span, size, 1);
  const decor = axes2D(uv, u, 121);
  let color = mix(vec3(0.97, 0.97, 0.98), vec3(0.39, 0.43, 0.49), decor.x);
  color = mix(color, vec3(0.09, 0.47, 1), blue);
  return vec4(labelColor(mix(color, vec3(0.98, 0.42, 0.06), orange), decor.yzw), 1);
}

/** A parameter-space dash field. No path mesh or cumulative length buffer. */
function patternDistance(t: f32, rate: f32, u: PlotUniforms): f32 {
  if (u.curvePattern.x == 0) return 0;
  const period = u.curvePattern.y;
  const phase = fract((t + u.curvePattern.z) / period);
  const gap = max(0, abs(phase - 0.5) - u.curvePattern.w * 0.5) * period;
  return gap / max(rate, 1e-20) * pixelWidth();
}

/** Evaluate the graph itself in a local pixel footprint, never a sampled path.
 * Derivatives are taken only of the coordinate transform, not across callback jumps. */
function scalarField(sample: ScalarCurve, p: vec2, dx: vec2, dy: vec2, u: PlotUniforms, jumps: bool): f32 {
  const value = sample(p.x);
  const xGradient = vec2(dx.x, dy.x);
  const yGradient = vec2(dx.y, dy.y);
  const h = max(max(length(xGradient) * 0.125, abs(p.x) * 1e-6), 1e-7);
  const before = sample(p.x - h), after = sample(p.x + h);
  let slope = (after - before) / (2 * h);
  if (!(abs(before) < 1e18)) slope = (after - value) / h;
  if (!(abs(after) < 1e18)) slope = (value - before) / h;
  const normal = yGradient - slope * xGradient;
  const normSquared = max(dot(normal, normal), 1e-30);
  const residual = p.y - value;
  const normalDistance = abs(residual) / sqrt(normSquared) * pixelWidth();
  const parameter = p.x - residual * dot(xGradient, normal) / normSquared;
  // The determinant form avoids cancellation at steep tangents.
  const rate = abs(xGradient.x * yGradient.y - xGradient.y * yGradient.x) / sqrt(normSquared);
  const gapDistance = patternDistance(parameter, rate, u);
  // A discontinuity must not become an invented vertical connecting stroke.
  const continuous = !jumps || abs(value - (before + after) * 0.5) <= max(length(yGradient) * 2, abs(after - before) * 0.2);
  return abs(value) < 1e18 && abs(slope) < 1e18 && continuous ? distanceCoverage(length(vec2(normalDistance, gapDistance)), u.appearance.z) : 0;
}

/** Unbounded scalar field in two dimensions; the camera never sets a function domain. */
export function plot2D(sample: ScalarCurve, uv: vec2, u: PlotUniforms, jumps: bool): vec4 {
  const size = plotSize(u.resolution);
  const span = max(u.plotSpan, vec2(0.00001));
  const p = u.plotCenter + (uv - 0.5) * span;
  const dx = dpdx(p), dy = dpdy(p);
  // Four footprint samples integrate the procedural field, rather than weakening
  // the stroke when a high-frequency function becomes smaller than a pixel.
  let curve = 0;
  for (let i = 0; i < 4; i++) {
    const offset = vec2((i & 1) == 0 ? -0.25 : 0.25, (i & 2) == 0 ? -0.25 : 0.25);
    curve += scalarField(sample, p + dx * offset.x + dy * offset.y, dx, dy, u, jumps) * 0.25;
  }
  const decor = axes2D(uv, u, 121) * u.sceneOpacity.x;
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.39, 0.43, 0.49), decor.x);
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
  color = labelColor(color, decor.yzw);
  const selected = ((vec2(u.probe, sample(u.probe)) - u.plotCenter) / span + 0.5) * size;
  const base = labelColor(mix(vec3(0.965, 0.973, 0.985), vec3(0.39, 0.43, 0.49), decor.x), decor.yzw);
  return vec4(mix(base, abs(sample(u.probe)) < 1e18 ? pointColor(color, uv * size, selected) : color, u.sceneOpacity.y), 1);
}

/** Camera coordinates in normalized world units, shared by projection and inverse rays. */
function basisVector(p: vec3, u: PlotUniforms): vec3 {
  const span = max(u.plotSpan, vec2(0.00001));
  const q = p / vec3(span, max(span.x, span.y));
  const basis = u.rotationBasis;
  const horizontal = q.x * basis.y + q.z * basis.x;
  const depth = -q.x * basis.x + q.z * basis.y;
  return vec3(horizontal, q.y * basis.w - depth * basis.z, q.y * basis.z + depth * basis.w);
}

function cameraPoint(p: vec3, u: PlotUniforms): vec3 {
  return basisVector((u.model * vec4(p, 1)).xyz - vec3(u.plotCenter, u.plotCenterZ), u);
}

export function cameraVector(p: vec3, u: PlotUniforms): vec3 { return basisVector((u.model * vec4(p, 0)).xyz, u); }
function sceneCenter(u: PlotUniforms): vec3 { return (u.inverseModel * vec4(u.plotCenter, u.plotCenterZ, 1)).xyz; }

export function inverseCamera(p: vec3, u: PlotUniforms): vec3 {
  const basis = u.rotationBasis;
  const y = p.y * basis.w + p.z * basis.z;
  const depth = -p.y * basis.z + p.z * basis.w;
  const q = vec3(p.x * basis.y - depth * basis.x, y, p.x * basis.x + depth * basis.y);
  return (u.inverseModel * vec4(q * vec3(u.plotSpan, max(u.plotSpan.x, u.plotSpan.y)), 0)).xyz;
}

/** Project without division so implicit line fields also work at vanishing points. */
export function homogeneous(p: vec3, u: PlotUniforms, direction: bool): vec3 {
  const size = plotSize(u.resolution);
  const camera = direction ? cameraVector(p, u) : cameraPoint(p, u);
  const w = u.view3d == u32(2) ? (direction ? -camera.z : u.cameraLens.y - camera.z) : (direction ? 0 : u.cameraLens.y);
  const focal = 1 / u.cameraLens.x;
  return vec3((vec2(camera.x / (size.x / size.y), camera.y) * focal + (vec2(0.5) + u.plotPan) * w) * size, w);
}

export function project(p: vec3, u: PlotUniforms): vec2 {
  const h = homogeneous(p, u, false);
  return h.xy / max(h.z, 0.101);
}

function cameraDistance(p: vec3, u: PlotUniforms): f32 { return u.cameraLens.y - cameraPoint(p, u).z; }
function inFront(p: vec3, u: PlotUniforms): bool { return u.view3d != u32(2) || cameraDistance(p, u) >= 0.101; }

export class ViewRay { origin: vec3; direction: vec3; }

export function viewRay(uv: vec2, u: PlotUniforms): ViewRay {
  const screen = uv - vec2(0.5) - u.plotPan;
  const size = plotSize(u.resolution);
  const cameraXY = vec2(screen.x * (size.x / size.y), screen.y) * u.cameraLens.x;
  const origin = u.view3d == u32(2) ? vec3(0, 0, u.cameraLens.y) : vec3(cameraXY * u.cameraLens.y, u.cameraLens.y);
  const direction = u.view3d == u32(2) ? vec3(cameraXY, -1) : vec3(0, 0, -1);
  return { origin: inverseCamera(origin, u) + sceneCenter(u), direction: inverseCamera(direction, u) };
}

/** Infinite world axis as a projected implicit line SDF; no range-derived endpoints. */
function axisField(pixel: vec2, axis: vec3, ray: ViewRay, u: PlotUniforms): f32 {
  const origin = homogeneous(vec3(0), u, false);
  const direction = homogeneous(axis, u, true);
  const coefficients = cross(origin, direction);
  const magnitude = length(coefficients.xy);
  let distance = length(pixel - project(vec3(0), u));
  if (magnitude > 1e-12) distance = abs(dot(coefficients, vec3(pixel, 1))) / magnitude;
  // Reject the portion of the infinite line behind the camera.
  const transverse = vec3(1) - axis;
  const a = ray.origin * transverse, b = ray.direction * transverse;
  const depth = -dot(a, b) / max(dot(b, b), 1e-20);
  return u.view3d != u32(2) || depth >= 0.101 ? distanceCoverage(distance, u.appearance.x) : 0;
}

/** Intersect the camera ray with y=0, then evaluate the world lattice as a distance field. */
function groundField(ray: ViewRay, u: PlotUniforms, xLevels: vec3, zLevels: vec3): f32 {
  const denominator = abs(ray.direction.y) < 1e-8 ? (ray.direction.y < 0 ? -1e-8 : 1e-8) : ray.direction.y;
  const depth = -ray.origin.y / denominator;
  const ground = (ray.origin + ray.direction * depth).xz;
  const gradient = max(vec2(length(vec2(dpdx(ground.x), dpdy(ground.x))), length(vec2(dpdx(ground.y), dpdy(ground.y)))), vec2(1e-20));
  let field = 0;
  for (let level = 0; level < 2; level++) {
    const spacing = level == 0 ? vec2(xLevels.x, zLevels.x) : vec2(xLevels.y, zLevels.y);
    const distance = abs(fract(ground / spacing + 0.5) - 0.5) * spacing / gradient * pixelWidth();
    const separation = spacing / gradient * pixelWidth();
    const density = clamp(u.labelStyle.x,0.5,2);
    const fade = smoothstep(vec2(12/density),vec2(28/density),separation);
    const nearest = floor(ground / spacing + 0.5) * spacing;
    const weights = level == 0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels));
    field = max(field, max(distanceCoverage(distance.x, u.appearance.y) * fade.x * weights.x, distanceCoverage(distance.y, u.appearance.y) * fade.y * weights.y));
  }
  return (u.view3d != u32(2) || depth >= 0.101) && abs(ray.direction.y) >= 1e-8 && (u.decorations & u32(1)) != u32(0) ? field * u.decorationOpacity.x : 0;
}

/** Invert the projected infinite axis at the perpendicular screen foot.
 * This queries visible world ticks directly, without a camera-sized tick domain. */
function axisParameter(pixel: vec2, axis: vec3, u: PlotUniforms): f32 {
  const origin = homogeneous(vec3(0), u, false);
  const direction = homogeneous(axis, u, true);
  const line = cross(origin, direction);
  const foot = pixel - line.xy * dot(line, vec3(pixel, 1)) / max(dot(line.xy, line.xy), 1e-20);
  const slope = direction.xy - foot * direction.z;
  return dot(foot * origin.z - origin.xy, slope) / max(dot(slope, slope), 1e-20);
}

function spatialLevels(axis: vec3, u: PlotUniforms): vec3 {
  const center = axisParameter(plotSize(u.resolution) * 0.5, axis, u);
  const span = max(u.plotSpan.x, u.plotSpan.y);
  const h = span * 0.001;
  const tangent = (project(axis * (center + h), u) - project(axis * (center - h), u)) / (2 * h);
  const pixels = max(length(tangent) * span, 1);
  const horizontal = abs(tangent.x) >= abs(tangent.y) * 0.7;
  return axisLevels(center, span, pixels, horizontal, u);
}

/** Label fill and halo plus tick stroke. Adjacent projected boxes determine
 * collision fading; candidates are world anchored and remain camera independent. */
function spatialTicks(pixel: vec2, axis: vec3, levels: vec3, priority: f32, u: PlotUniforms): vec4 {
  const size = plotSize(u.resolution);
  const fontSize = u.appearance.w;
  const originH = homogeneous(vec3(0), u, false);
  const directionH = homogeneous(axis, u, true);
  const axisLine = cross(originH, directionH);
  const magnitude = length(axisLine.xy);
  if (magnitude <= 1e-12 || abs(dot(axisLine, vec3(pixel, 1))) / magnitude > fontSize * 6 + 12) return vec4(0);
  const normal = axisLine.xy / magnitude;
  const tangent = vec2(normal.y, -normal.x);
  const sign = axis.y > 0 ? (normal.x > 0 ? -1 : 1) : (normal.y > 0 ? -1 : 1);
  const outward = normal * sign;
  const value = axisParameter(pixel, axis, u);
  let labels = vec3(0);
  let ticks = 0;
  for (let index = 0; index < 6; index++) {
    const stride = index < 3 ? levels.x : levels.y;
    const nearest = floor(value / stride + 0.5) * stride;
    const t = nearest + f32(index % 3 - 1) * stride;
    const world = axis * t;
    if (inFront(world, u)) {
      const at = project(world, u);
      const anchor = at + outward * (fontSize * 0.95 + 6) + vec2(0, fontSize * 0.65);
      const delta = pixel - anchor;
      const nearLabel = (u.decorations & u32(2)) != u32(0) && abs(delta.x) <= fontSize * 9 && delta.y >= -fontSize * 1.5 - 3 && delta.y <= 3;
      const nearTick = u.appearance.x > 0 && all(abs(pixel - at) <= vec2(u.appearance.x * 0.5 + 4 + pixelWidth()));
      if (!nearLabel && !nearTick) continue;
      const before = project(axis * (t - stride), u);
      const after = project(axis * (t + stride), u);
      const width = numberWidth(t, levels.x, fontSize);
      const room = min(min(anchor.x - width * 0.5 - 3, size.x - anchor.x - width * 0.5 - 3), min(anchor.y - fontSize * 1.5, size.y - anchor.y));
      const separation = min(abs(at - before), abs(after - at));
      const box = vec2(width + fontSize, fontSize * 1.8 + 6);
      const fit = smoothstep(0.85, 1.15, max(separation.x / box.x, separation.y / box.y));
      const visibility = (index < 3 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit;
      ticks = max(ticks, tickMark(pixel, at, tangent, 3, u.appearance.x) * visibility);
      const zero = abs(t) <= levels.x * 0.001;
      const originDistance = length(at - project(vec3(0), u));
      const crossing = zero ? (axis.x > 0 ? 1 : 0) : smoothstep(fontSize * 2, fontSize * 4, originDistance);
      if ((u.decorations & u32(2)) != u32(0)) {
        labels = max(labels, numberAt(pixel, anchor, t, levels.x, 0.5, fontSize, u.labelStyle.y, u.labelStyle.z) * u.decorationOpacity.y * visibility * smoothstep(0, 6, room) * crossing * priority);
      }
    }
  }
  return vec4(ticks, labels);
}

class SpatialDecor { color: vec3; labels: vec3; }

/** Shared projection, nested grid and labels. No finite tick list or path mesh. */
function spatialBackground(uv: vec2, u: PlotUniforms): SpatialDecor {
  const size = plotSize(u.resolution);
  const pixel = uv * size;
  const xLevels = spatialLevels(vec3(1, 0, 0), u);
  const yLevels = spatialLevels(vec3(0, 1, 0), u);
  const zLevels = spatialLevels(vec3(0, 0, 1), u);
  const ray = viewRay(uv, u);
  const grid = groundField(ray, u, xLevels, zLevels);
  const xTicks = spatialTicks(pixel, vec3(1, 0, 0), xLevels, 1, u);
  const yTicks = spatialTicks(pixel, vec3(0, 1, 0), yLevels, 1, u);
  const origin = project(vec3(0), u);
  const xDirection = homogeneous(vec3(1, 0, 0), u, true);
  const zDirection = homogeneous(vec3(0, 0, 1), u, true);
  const xTangent = normalize(xDirection.xy - origin * xDirection.z + vec2(1e-12));
  const zTangent = normalize(zDirection.xy - origin * zDirection.z + vec2(1e-12));
  const angle = abs(xTangent.x * zTangent.y - xTangent.y * zTangent.x);
  const zTicks = spatialTicks(pixel, vec3(0, 0, 1), zLevels, smoothstep(0.08, 0.25, angle), u);
  let labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.8, 0.82, 0.85), grid * 0.65);
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, vec3(1, 0, 0), ray, u));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, vec3(0, 1, 0), ray, u));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, vec3(0, 0, 1), ray, u));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if ((u.decorations & u32(4)) != u32(0)) {
    for (let index = 0; index < 3; index++) {
      const axis = index == 0 ? vec3(1, 0, 0) : index == 1 ? vec3(0, 1, 0) : vec3(0, 0, 1);
      const edge = index == 1 ? vec2(size.x * 0.5, size.y - 30) : vec2(size.x - 30, size.y * 0.5);
      const world = axis * axisParameter(edge, axis, u);
      if (inFront(world, u)) {
        const at = clamp(project(world, u) + vec2(10, 18), vec2(18), size - vec2(18));
        labels = max(labels, axisLabel(pixel, at, 120 + index, u) * u.decorationOpacity.z);
      }
    }
  }
  return { color: mix(vec3(0.965, 0.973, 0.985), color, u.sceneOpacity.x), labels: labels * u.sceneOpacity.x };
}

/** Parameter coordinate of a ray/graph-plane intersection, with visibility. */
function scalarParameter(pixel: vec2, u: PlotUniforms): vec2 {
  const ray = viewRay(pixel / plotSize(u.resolution), u);
  if (abs(ray.direction.z) < 1e-12) return vec2(0);
  const depth = -ray.origin.z / ray.direction.z;
  return vec2((ray.origin + ray.direction * depth).x, u.view3d != u32(2) || depth >= 0.101 ? 1 : 0);
}

/** Bracket within the pixel's inverse-projected interval. This resolves dense
 * crossings without trusting a single tangent, and accepts only actual projected
 * callback points. No chord supplies coverage, including at the horizon. */
function scalarFootprintDistance(sample: ScalarCurve, pixel: vec2, seed: f32, u: PlotUniforms): f32 {
  const h = max(abs(seed) * 1e-6, 0.0001);
  const direction = project(vec3(seed + h, 0, 0), u) - project(vec3(seed - h, 0, 0), u);
  const along = normalize(direction + vec2(1e-20));
  const normal = vec2(-along.y, along.x);
  const radius = u.appearance.z * 0.5 + pixelWidth();
  const first = scalarParameter(pixel - along * radius, u);
  const last = scalarParameter(pixel + along * radius, u);
  if (first.y <= 0 || last.y <= 0) return 1e20;
  const low = min(first.x, last.x), high = max(first.x, last.x);
  // Well-resolved areas already have an accurate local closest-point query.
  if (high - low < u.plotSpan.x / max(u.resolution.x, 1) * 4) return 1e20;
  let best = 1e20;
  let previous = low;
  let previousValue = sample(previous);
  let previousWorld = vec3(previous, previousValue, 0);
  let previousSide = dot(project(previousWorld, u) - pixel, normal);
  for (let i = 1; i <= 8; i++) {
    const next = mix(low, high, f32(i) / 8);
    const nextValue = sample(next);
    const nextWorld = vec3(next, nextValue, 0);
    const nextSide = dot(project(nextWorld, u) - pixel, normal);
    if (abs(previousValue) < 1e18 && abs(nextValue) < 1e18 && inFront(previousWorld, u) && inFront(nextWorld, u) && previousSide * nextSide <= 0) {
      let a = previous, b = next, side = previousSide;
      for (let step = 0; step < 8; step++) {
        const t = (a + b) * 0.5;
        const at = vec3(t, sample(t), 0);
        const signed = dot(project(at, u) - pixel, normal);
        if (side * signed <= 0) b = t;
        else { a = t; side = signed; }
      }
      const t = (a + b) * 0.5;
      const value = sample(t), at = vec3(t, value, 0);
      if (abs(value) < 1e18 && inFront(at, u)) {
        const before = project(vec3(t - h, sample(t - h), 0), u);
        const after = project(vec3(t + h, sample(t + h), 0), u);
        const rate = pixelWidth() * 2 * h / max(length(after - before), 1e-20);
        const gap = patternDistance(t, rate, u);
        best = min(best, length(vec2(length(project(at, u) - pixel), gap)));
      }
    }
    previous = next; previousValue = nextValue; previousWorld = nextWorld; previousSide = nextSide;
  }
  return best;
}

/** A projected scalar query measures an actual point on the callback. Dividing
 * a world-space residual by an unbounded inverse-projection derivative invents
 * coverage near the projective pole, even far outside the projected graph. */
function projectedScalarDistance(sample: ScalarCurve, pixel: vec2, u: PlotUniforms, jumps: bool): f32 {
  const ray = viewRay(pixel / plotSize(u.resolution), u);
  if (abs(ray.direction.z) < 1e-12) return 1e20;
  const depth = -ray.origin.z / ray.direction.z;
  if (u.view3d == u32(2) && depth < 0.101) return 1e20;
  const world = ray.origin + ray.direction * depth;
  let t = world.x;
  let best = 1e20;
  for (let iteration = 0; iteration < 5; iteration++) {
    const value = sample(t);
    const point = vec3(t, value, 0);
    const h = max(abs(t) * 1e-6, 0.0001);
    const before = sample(t - h), after = sample(t + h);
    const at = project(point, u);
    const validBefore = abs(before) < 1e18 && inFront(vec3(t - h, before, 0), u);
    const validAfter = abs(after) < 1e18 && inFront(vec3(t + h, after, 0), u);
    const a = validBefore ? project(vec3(t - h, before, 0), u) : at;
    const b = validAfter ? project(vec3(t + h, after, 0), u) : at;
    const tangent = (b - a) / (validBefore && validAfter ? 2 * h : h);
    const norm = dot(tangent, tangent);
    const continuous = !jumps || abs(value - (before + after) * 0.5) <= max(u.plotSpan.y * 1e-4, abs(after - before) * 0.2);
    if (abs(value) < 1e18 && inFront(point, u) && continuous) {
      const gap = patternDistance(t, pixelWidth() / max(sqrt(norm), 1e-20), u);
      best = min(best, length(vec2(length(pixel - at), gap)));
    }
    if (!(norm > 1e-20 && norm < 1e30)) break;
    const correction = dot(at - pixel, tangent) / norm;
    const limit = max(u.plotSpan.x, abs(t) * 0.5);
    t -= clamp(correction, -limit, limit);
  }
  if (best > u.appearance.z * 0.25) best = min(best, scalarFootprintDistance(sample, pixel, world.x, u));
  return best;
}

/** Invert each physical subpixel separately. The projective plane has a pole;
 * linearizing one center ray across that pole is not a valid pixel footprint. */
export function plotScalar3D(sample: ScalarCurve, trajectory: SpaceCurve, uv: vec2, u: PlotUniforms, jumps: bool): vec4 {
  const size = plotSize(u.resolution);
  const pixel = uv * size;
  const background = spatialBackground(uv, axesUniforms(u));
  let curve = 0;
  const edgeOn = abs(inverseCamera(vec3(0, 0, -1), u).z) < max(u.plotSpan.x, u.plotSpan.y) * 0.003;
  if (edgeOn) {
    const extent = max(u.plotSpan.x, u.plotSpan.y) * 32;
    curve = distanceCoverage(trajectoryDistance(trajectory, pixel, u, vec2(u.plotCenter.x - extent, u.plotCenter.x + extent), jumps), u.appearance.z);
  } else {
    for (let i = 0; i < 4; i++) {
      const offset = vec2((i & 1) == 0 ? -0.25 : 0.25, (i & 2) == 0 ? -0.25 : 0.25) * pixelWidth();
      curve += distanceCoverage(projectedScalarDistance(sample, pixel + offset, u, jumps), u.appearance.z) * 0.25;
    }
  }
  let color = mix(background.color, vec3(0.09, 0.42, 0.92), curve);
  color = labelColor(color, background.labels);
  const selected = vec3(u.probe, sample(u.probe), 0);
  return vec4(mix(labelColor(background.color, background.labels), abs(selected.y) < 1e18 && inFront(selected, u) ? pointColor(color, pixel, project(selected, u)) : color, u.sceneOpacity.y), 1);
}

/** Refine a candidate against the actual projected callback, never a chord SDF. */
function refineTrajectoryHit(trajectory: SpaceCurve, pixel: vec2, candidate: vec4, u: PlotUniforms, jumps: bool): vec2 {
  let t = candidate.y;
  const low = candidate.z, high = candidate.w;
  const epsilon = max(max((high - low) * 0.001, abs(t) * 1e-6), 1e-7);
  for (let iteration = 0; iteration < i32(u.curveQuality.y); iteration++) {
    const before = max(low, t - epsilon), after = min(high, t + epsilon);
    const a = project(trajectory(before), u), b = project(trajectory(after), u);
    const tangent = (b - a) / max(after - before, 1e-20);
    const atWorld = trajectory(t);
    const at = project(atWorld, u);
    const delta = dot(at - pixel, tangent) / max(dot(tangent, tangent), 1e-20);
    let next = clamp(t - delta, low, high);
    let world = trajectory(next);
    let projected = project(world, u);
    const error = dot(at - pixel, at - pixel);
    if (!jumps && all(abs(atWorld) < vec3(1e18)) && inFront(atWorld, u) && error <= pow(max(0, u.appearance.z * 0.5 - pixelWidth() * 0.5), 2)) return vec2(sqrt(error), t);
    if (!(all(abs(world) < vec3(1e18)) && inFront(world, u) && dot(projected - pixel, projected - pixel) <= error)) {
      next = (t + next) * 0.5;
      world = trajectory(next);
      projected = project(world, u);
    }
    // Safeguard the numerical step: refinement may not make a valid seed worse.
    if (all(abs(world) < vec3(1e18)) && inFront(world, u) && dot(projected - pixel, projected - pixel) <= error) {
      if (next == t) break;
      t = next;
    } else break;
  }
  const world = trajectory(t);
  const middle = trajectory((low + high) * 0.5);
  const continuous = !jumps || length(middle - (trajectory(low) + trajectory(high)) * 0.5) <= max(1e-6, length(trajectory(high) - trajectory(low)) * 0.2);
  return vec2(all(abs(world) < vec3(1e18)) && continuous && inFront(world, u) ? length(pixel - project(world, u)) : 1e20, t);
}

function refineTrajectory(trajectory: SpaceCurve, pixel: vec2, candidate: vec4, u: PlotUniforms, jumps: bool): f32 {
  return refineTrajectoryHit(trajectory, pixel, candidate, u, jumps).x;
}

/** Projected chord distance is a search bound only; it never supplies coverage. */
function intervalChordDistance(pixel: vec2, a: vec2, b: vec2): f32 {
  const delta = b - a;
  const along = clamp(dot(pixel - a, delta) / max(dot(delta, delta), 1e-20), 0, 1);
  return length(pixel - a - along * delta);
}

/** Query one actual callback interval, keeping its boundary points in the result. */
function intervalHit(trajectory: SpaceCurve, pixel: vec2, low: f32, high: f32, u: PlotUniforms, jumps: bool): vec2 {
  let start = low, end = high;
  let a = trajectory(start), b = trajectory(end);
  const frontA = inFront(a, u), frontB = inFront(b, u);
  if (!(all(abs(a) < vec3(1e18)) && all(abs(b) < vec3(1e18))) || (!frontA && !frontB)) return vec2(1e20, low);
  if (frontA != frontB) {
    // Clip the parameter against actual callback evaluations, rather than a
    // world-space chord which can put the seed behind the near plane.
    let left = start, right = end;
    for (let i = 0; i < 12; i++) {
      const middle = (left + right) * 0.5;
      if (inFront(trajectory(middle), u) == frontA) left = middle;
      else right = middle;
    }
    if (frontA) end = left;
    else start = right;
    a = trajectory(start);
    b = trajectory(end);
  }
  const ha = homogeneous(a, u, false), hb = homogeneous(b, u, false);
  const pa = ha.xy / ha.z, pb = hb.xy / hb.z;
  const delta = pb - pa;
  const screenFraction = clamp(dot(pixel - pa, delta) / max(dot(delta, delta), 1e-20), 0, 1);
  // Undo perspective interpolation. A screen midpoint is not generally the
  // midpoint of the callback's parameter interval.
  const fraction = screenFraction * ha.z / max(mix(hb.z, ha.z, screenFraction), 1e-20);
  const seed = mix(start, end, fraction);
  const candidate = vec4(0, seed, start, end);
  let refined = refineTrajectoryHit(trajectory, pixel, candidate, u, jumps);
  // Shared interval endpoints make changing the search partition continuous.
  // Apply the same jump rejection as refinement to avoid inventing connections.
  const middle = trajectory((start + end) * 0.5);
  const continuous = !jumps || length(middle - (a + b) * 0.5) <= max(1e-6, length(b - a) * 0.2);
  const first = length(pixel - pa), last = length(pixel - pb);
  if (first < refined.x) refined = vec2(first, start);
  if (last < refined.x) refined = vec2(last, end);
  return continuous ? refined : vec2(1e20, start);
}

function intervalDistance(trajectory: SpaceCurve, pixel: vec2, low: f32, high: f32, u: PlotUniforms, jumps: bool): f32 {
  return intervalHit(trajectory, pixel, low, high, u, jumps).x;
}

/** Compactify unbounded parameter space instead of clipping to a finite domain.
 * The mathematical tails approach infinity; f32 precision and numerical quality
 * still bound the detail any finite GPU invocation can resolve. */
function parameterAt(q: f32, scale: f32, center: f32, u: PlotUniforms): f32 {
  const safe = clamp(q, -0.99999, 0.99999);
  if (u.parameterMode == u32(3)) return center + scale * safe / (1 - abs(safe));
  const positive = (safe + 1) * 0.5;
  if (u.parameterMode == u32(2)) return u.parameterBounds.x + scale * positive / max(1 - positive, 0.00001);
  return u.parameterBounds.y - scale * (1 - positive) / max(positive, 0.00001);
}

/** Local world-space focus controls where the compactified search spends detail.
 * This seed is numerical; an arbitrary callback has no guaranteed global inverse. */
function parameterFocus(trajectory: SpaceCurve, u: PlotUniforms): vec2 {
  const pixel = plotSize(u.resolution) * 0.5;
  let center = u.parameterFocusSeed;
  const initial = trajectory(center);
  let error = all(abs(initial) < vec3(1e18)) && inFront(initial,u) ? dot(project(initial,u)-pixel,project(initial,u)-pixel) : 1e30;
  // Search long-baseline trends before a local tangent. Periodic transverse
  // motion must not trap the visible window near the original parameter zero.
  for (let level = 0; level < 8; level++) {
    const radius = pow(4,f32(level));
    const a = trajectory(u.parameterFocusSeed-radius), b = trajectory(u.parameterFocusSeed+radius);
    if (all(abs(a) < vec3(1e18)) && all(abs(b) < vec3(1e18))) {
      const middle = (a+b)*0.5, direction = (b-a)/(2*radius);
      const originH = homogeneous(middle,u,false), directionH = homogeneous(direction,u,true);
      const slope = directionH.xy - pixel*directionH.z;
      const norm = dot(slope,slope);
      if (norm > 1e-20) {
        const candidate = u.parameterFocusSeed + dot(pixel*originH.z-originH.xy,slope)/norm;
        const point = trajectory(candidate);
        if (abs(candidate) < 1e18 && all(abs(point) < vec3(1e18)) && inFront(point,u)) {
          const delta = project(point,u)-pixel, nextError = dot(delta,delta);
          if (nextError < error) {center=candidate;error=nextError;}
        }
      }
    }
  }
  let speed = 1;
  for (let i = 0; i < 4; i++) {
    const h = max(abs(center)*1e-5,0.001);
    const at = trajectory(center), left = trajectory(center-h), right = trajectory(center+h);
    const normalized = cameraVector((right-left)/(2*h),u);
    speed = max(length(normalized),1e-10);
    const tangent = (project(right,u)-project(left,u))/(2*h);
    const correction = clamp(dot(pixel-project(at,u),tangent)/max(dot(tangent,tangent),1e-20),-32/speed,32/speed);
    let candidate = center+correction;
    for (let backtrack=0;backtrack<4;backtrack++) {
      const point = trajectory(candidate), delta=project(point,u)-pixel;
      const nextError=dot(delta,delta);
      if(all(abs(point)<vec3(1e18))&&inFront(point,u)&&nextError<=error){center=candidate;error=nextError;break;}
      candidate=(candidate+center)*0.5;
    }
  }
  let scale = clamp(2/speed,0.00001,1e10);
  if(u.parameterMode == u32(1)) scale=max(scale,abs(center-u.parameterBounds.y));
  if(u.parameterMode == u32(2)) scale=max(scale,abs(center-u.parameterBounds.x));
  return vec2(center,scale);
}

/** Inspect every projected interval that can cover this fragment. Ranking a
 * fixed number of midpoint samples drops valid branches at folds/crossings.
 * Bounds use sampled bending as a numerical guard, not a proof for an arbitrary
 * callback; quality still determines how much detail the search can resolve. */
function trajectoryDistance(trajectory: SpaceCurve, pixel: vec2, u: PlotUniforms, bounds: vec2, jumps: bool): f32 {
  const requested = f32(u.curveQuality.x);
  const range = bounds.y - bounds.x;
  const unbounded = u.parameterMode != u32(0);
  const focus = unbounded ? parameterFocus(trajectory, u) : vec2(0, 1);
  const count = i32(min(512, unbounded || u.curvePattern.x == 0 ? requested : max(requested, ceil(range / u.curvePattern.y * 4))));
  const stepSize = range / f32(count);
  let distance = 1e20;
  for (let i = 0; i < count; i++) {
    let low = bounds.x + f32(i) * stepSize;
    let high = min(bounds.y, low + stepSize);
    if (unbounded) {
      low = parameterAt(-1 + 2 * f32(i) / f32(count), focus.y, focus.x, u);
      high = parameterAt(-1 + 2 * f32(i + 1) / f32(count), focus.y, focus.x, u);
    }
    let t = (low + high) * 0.5;
    if (u.curvePattern.x != 0) {
      const period = u.curvePattern.y;
      const center = (floor((t + u.curvePattern.z) / period) + 0.5) * period - u.curvePattern.z;
      low = max(low, center - period * u.curvePattern.w * 0.5);
      high = min(high, center + period * u.curvePattern.w * 0.5);
      t = (low + high) * 0.5;
    }
    if (high >= low) {
      const a = trajectory(low), middle = trajectory(t), b = trajectory(high);
      const finite = all(abs(a) < vec3(1e18)) && all(abs(middle) < vec3(1e18)) && all(abs(b) < vec3(1e18));
      if (finite) {
        let possible = true;
        if (inFront(a, u) && inFront(middle, u) && inFront(b, u)) {
          const pa = project(a, u), pm = project(middle, u), pb = project(b, u);
          const bending = intervalChordDistance(pm, pa, pb);
          const guard = bending * 4 + u.appearance.z * 0.5 + pixelWidth() * 2;
          possible = min(intervalChordDistance(pixel, pa, pm), intervalChordDistance(pixel, pm, pb)) <= guard;
        }
        if (possible) {
          distance = min(distance, intervalDistance(trajectory, pixel, low, t, u, jumps));
          distance = min(distance, intervalDistance(trajectory, pixel, t, high, u, jumps));
        }
      }
    }
  }
  return distance;
}

function spatialProbe(trajectory: SpaceCurve, u: PlotUniforms): vec3 {
  const selected = trajectory(u.probe);
  const visible = ((u.parameterMode & u32(1)) != u32(0) || u.probe >= u.parameterBounds.x) && ((u.parameterMode & u32(2)) != u32(0) || u.probe <= u.parameterBounds.y) && all(abs(selected) < vec3(1e18)) && inFront(selected, u);
  return vec3(project(selected, u), visible ? 1 : 0);
}

function spatialCurveColor(uv: vec2, u: PlotUniforms, distance: f32, background: SpatialDecor, probe: vec3): vec4 {
  const pixel = uv * plotSize(u.resolution);
  let color = mix(background.color, vec3(0.09, 0.42, 0.92), distanceCoverage(distance, u.appearance.z));
  color = labelColor(color, background.labels);
  return vec4(mix(labelColor(background.color, background.labels), probe.z > 0 ? pointColor(color, pixel, probe.xy) : color, u.sceneOpacity.y), 1);
}

export function plot3D(trajectory: SpaceCurve, uv: vec2, u: PlotUniforms, jumps: bool): vec4 {
  const distance = u.appearance.z > 0 ? trajectoryDistance(trajectory, uv * plotSize(u.resolution), u, u.parameterBounds, jumps) : 1e20;
  return spatialCurveColor(uv, u, distance, spatialBackground(uv, axesUniforms(u)), spatialProbe(trajectory, u));
}

export function plot3DAccelerated(trajectory: SpaceCurve, uv: vec2, u: PlotUniforms): vec4 {
  const distance = u.appearance.z > 0 ? cachedTrajectoryDistance(trajectory, uv * plotSize(u.resolution), u) : 1e20;
  return spatialCurveColor(uv, u, distance, cachedSpatialBackground(uv, axesUniforms(u)), textureLoad(curveIntervals, vec2i(0, 5), 0).xyz);
}


function curveIntervalCount(u: PlotUniforms): i32 {
  const requested = f32(u.curveQuality.x);
  const range = u.parameterBounds.y - u.parameterBounds.x;
  return i32(min(512, u.parameterMode != u32(0) || u.curvePattern.x == 0 ? requested : max(requested, ceil(range / u.curvePattern.y * 4))));
}

/** A resident search record, never a renderable segment. Each original search
 * interval has two independently clipped parts, matching the uncached query. */
export function prepareCurveIntervals(trajectory: SpaceCurve, position: vec4, u: PlotUniforms, jumps: bool): vec4 {
  const part = i32(position.x), row = i32(position.y);
  if (row == 5) return part == 0 ? vec4(spatialProbe(trajectory, u), 0) : vec4(0);
  const index = part / 2, half = part % 2;
  const count = curveIntervalCount(u);
  const empty = row == 4 ? vec4(1e20, 1e20, -1e20, -1e20) : vec4(0);
  if (index >= count) return empty;
  const range = u.parameterBounds.y - u.parameterBounds.x;
  const stepSize = range / f32(count);
  let low = u.parameterBounds.x + f32(index) * stepSize;
  let high = min(u.parameterBounds.y, low + stepSize);
  if (u.parameterMode != u32(0)) {
    const focus = parameterFocus(trajectory, u);
    low = parameterAt(-1 + 2 * f32(index) / f32(count), focus.y, focus.x, u);
    high = parameterAt(-1 + 2 * f32(index + 1) / f32(count), focus.y, focus.x, u);
  }
  if (u.curvePattern.x != 0) {
    const period = u.curvePattern.y;
    const center = (floor(((low + high) * 0.5 + u.curvePattern.z) / period) + 0.5) * period - u.curvePattern.z;
    low = max(low, center - period * u.curvePattern.w * 0.5);
    high = min(high, center + period * u.curvePattern.w * 0.5);
  }
  if (high < low) return empty;
  const middle = (low + high) * 0.5;
  let start = half == 0 ? low : middle;
  let end = half == 0 ? middle : high;
  let a = trajectory(start), b = trajectory(end);
  const frontA = inFront(a, u), frontB = inFront(b, u);
  if (!(all(abs(a) < vec3(1e18)) && all(abs(b) < vec3(1e18))) || (!frontA && !frontB)) return empty;
  if (frontA != frontB) {
    let left = start, right = end;
    for (let i = 0; i < 12; i++) {
      const at = (left + right) * 0.5;
      if (inFront(trajectory(at), u) == frontA) left = at;
      else right = at;
    }
    if (frontA) end = left;
    else start = right;
    a = trajectory(start); b = trajectory(end);
  }
  const m = trajectory((start + end) * 0.5);
  if (!all(abs(m) < vec3(1e18))) return empty;
  const continuous = !jumps || length(m - (a + b) * 0.5) <= max(1e-6, length(b - a) * 0.2);
  if (!continuous) return empty;
  const ha = homogeneous(a, u, false), hb = homogeneous(b, u, false);
  const pa = ha.xy / ha.z, pb = hb.xy / hb.z, pm = project(m, u);
  const guard = intervalChordDistance(pm, pa, pb) * 4 + u.appearance.z * 0.5 + pixelWidth() * 2;
  if (row == 0) return vec4(start, end, 1, 0);
  if (row == 1) return vec4(pa, ha.z, 0);
  if (row == 2) return vec4(pb, hb.z, 0);
  if (row == 3) return vec4(pm, guard, 0);
  if (!inFront(m, u)) return vec4(vec2(0), u.resolution);
  return vec4(min(min(pa, pb), pm) - vec2(guard), max(max(pa, pb), pm) + vec2(guard));
}

/** Every part gets a bit. There is no top-k list, atomic race or overflow drop. */
export function prepareCurveCandidates(position: vec4, u: PlotUniforms): vec4u {
  const column = u32(position.x), row = u32(position.y);
  const group = column % u32(8), tileX = column / u32(8);
  const count = curveIntervalCount(u) * 2;
  const start = i32(group) * 128;
  if (start >= count) return vec4u(0);
  const lo = vec2(f32(tileX), f32(row)) * f32(u.curveTiles.z);
  const hi = lo + vec2(f32(u.curveTiles.z));
  let bits = vec4u(0);
  for (let i = 0; i < 128; i++) {
    const part = start + i;
    if (part >= count) break;
    const bounds = textureLoad(curveIntervals, vec2i(part, 4), 0);
    if (all(bounds.xy <= hi) && all(bounds.zw >= lo)) {
      const a = textureLoad(curveIntervals, vec2i(part, 1), 0).xy;
      const b = textureLoad(curveIntervals, vec2i(part, 2), 0).xy;
      const middle = textureLoad(curveIntervals, vec2i(part, 3), 0);
      const center = (lo + hi) * 0.5;
      // Segment distance is 1-Lipschitz: beyond guard + tile radius no pixel
      // in this tile can pass the same conservative fragment-side guard.
      const radius = f32(u.curveTiles.z) * 0.7071068 + 1;
      if (min(intervalChordDistance(center, a, middle.xy), intervalChordDistance(center, middle.xy, b)) > middle.z + radius) continue;
      const bit = u32(1) << u32(i % 32);
      if (i < 32) bits.x |= bit;
      else if (i < 64) bits.y |= bit;
      else if (i < 96) bits.z |= bit;
      else bits.w |= bit;
    }
  }
  return bits;
}

function cachedTrajectoryDistance(trajectory: SpaceCurve, pixel: vec2, u: PlotUniforms): f32 {
  const tile = min(vec2u(floor(pixel / f32(u.curveTiles.z))), u.curveTiles.xy - vec2u(1));
  const groups = (curveIntervalCount(u) * 2 + 127) / 128;
  let distance = 1e20;
  for (let group = 0; group < groups; group++) {
    const packed = textureLoad(curveCandidates, vec2i(i32(tile.x) * 8 + group, i32(tile.y)), 0);
    if (all(packed == vec4u(0))) continue;
    for (let lane = 0; lane < 4; lane++) {
      let bits = packed[lane];
      for (let remaining = 0; remaining < 32; remaining++) {
        if (bits == u32(0)) break;
        const bit = firstTrailingBit(bits);
        bits &= bits - u32(1);
        const index = group * 128 + lane * 32 + i32(bit);
        const bounds = textureLoad(curveIntervals, vec2i(index, 4), 0);
        if (any(pixel < bounds.xy) || any(pixel > bounds.zw)) continue;
        const parameters = textureLoad(curveIntervals, vec2i(index, 0), 0);
        const a = textureLoad(curveIntervals, vec2i(index, 1), 0);
        const b = textureLoad(curveIntervals, vec2i(index, 2), 0);
        const middle = textureLoad(curveIntervals, vec2i(index, 3), 0);
        if (min(intervalChordDistance(pixel, a.xy, middle.xy), intervalChordDistance(pixel, middle.xy, b.xy)) > middle.z) continue;
        const delta = b.xy - a.xy;
        const screenFraction = clamp(dot(pixel - a.xy, delta) / max(dot(delta, delta), 1e-20), 0, 1);
        const fraction = screenFraction * a.z / max(mix(b.z, a.z, screenFraction), 1e-20);
        const seed = mix(parameters.x, parameters.y, fraction);
        // Continuity and near-plane clipping were computed once in the first pass.
        const refined = refineTrajectory(trajectory, pixel, vec4(0, seed, parameters.xy), u, false);
        distance = min(distance, min(refined, min(length(pixel - a.xy), length(pixel - b.xy))));
        if (distance <= max(0, u.appearance.z * 0.5 - pixelWidth() * 0.5)) return distance;
      }
    }
  }
  return distance;
}


/** One-dimensional projected-axis layout. The table's column spacing is at most
 * one physical pixel; candidates retain exact world multiples and anchors. */
export function prepareSpatialLabels(position: vec4, u: PlotUniforms): vec4 {
  const row = i32(position.y), column = i32(position.x);
  const size = plotSize(u.resolution);
  if (row >= 36) {
    if (column >= 3) return vec4(0);
    const axis = column == 0 ? vec3(1, 0, 0) : column == 1 ? vec3(0, 1, 0) : vec3(0, 0, 1);
    if (row == 37) return vec4(spatialLevels(axis, u), 1);
    const edge = column == 1 ? vec2(size.x * 0.5, size.y - 30) : vec2(size.x - 30, size.y * 0.5);
    const world = axis * axisParameter(edge, axis, u);
    const at = clamp(project(world, u) + vec2(10, 18), vec2(18), size - vec2(18));
    return vec4(at, f32(120 + column), inFront(world, u) ? 1 : 0);
  }
  const axisIndex = row / 12, candidate = (row / 2) % 6;
  const axis = axisIndex == 0 ? vec3(1, 0, 0) : axisIndex == 1 ? vec3(0, 1, 0) : vec3(0, 0, 1);
  const originH = homogeneous(vec3(0), u, false);
  const axisLine = cross(originH, homogeneous(axis, u, true));
  const magnitude = length(axisLine.xy);
  if (magnitude <= 1e-12) return vec4(0);
  const normal = axisLine.xy / magnitude;
  const tangent = vec2(normal.y, -normal.x);
  const extent = dot(abs(tangent), size);
  const low = min(0, tangent.x * size.x) + min(0, tangent.y * size.y);
  const along = low + position.x / f32(u.curveTiles.w) * extent;
  const foot = tangent * along - normal * (axisLine.z / magnitude);
  const levels = spatialLevels(axis, u);
  const stride = candidate < 3 ? levels.x : levels.y;
  const nearest = floor(axisParameter(foot, axis, u) / stride + 0.5) * stride;
  const t = nearest + f32(candidate % 3 - 1) * stride;
  const world = axis * t;
  if (!inFront(world, u)) return vec4(0);
  const at = project(world, u);
  const fontSize = u.appearance.w;
  const sign = axis.y > 0 ? (normal.x > 0 ? -1 : 1) : (normal.y > 0 ? -1 : 1);
  const outward = normal * sign;
  if (row % 2 == 0) return vec4(at, outward);
  const anchor = at + outward * (fontSize * 0.95 + 6) + vec2(0, fontSize * 0.65);
  const width = numberWidth(t, levels.x, fontSize);
  const before = project(axis * (t - stride), u), after = project(axis * (t + stride), u);
  const separation = min(abs(at - before), abs(after - at));
  const box = vec2(width + fontSize, fontSize * 1.8 + 6);
  const fit = smoothstep(0.85, 1.15, max(separation.x / box.x, separation.y / box.y));
  const visibility = (candidate < 3 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit;
  const room = min(min(anchor.x - width * 0.5 - 3, size.x - anchor.x - width * 0.5 - 3), min(anchor.y - fontSize * 1.5, size.y - anchor.y));
  const zero = abs(t) <= levels.x * 0.001;
  const crossing = zero ? (axis.x > 0 ? 1 : 0) : smoothstep(fontSize * 2, fontSize * 4, length(at - project(vec3(0), u)));
  let priority = 1;
  if (axisIndex == 2) {
    const origin = project(vec3(0), u);
    const xDirection = homogeneous(vec3(1, 0, 0), u, true), zDirection = homogeneous(vec3(0, 0, 1), u, true);
    const xTangent = normalize(xDirection.xy - origin * xDirection.z + vec2(1e-12));
    const zTangent = normalize(zDirection.xy - origin * zDirection.z + vec2(1e-12));
    priority = smoothstep(0.08, 0.25, abs(xTangent.x * zTangent.y - xTangent.y * zTangent.x));
  }
  return vec4(t, levels.x, visibility, visibility * smoothstep(0, 6, room) * crossing * priority);
}

function cachedSpatialTicks(pixel: vec2, axis: vec3, index: i32, u: PlotUniforms): vec4 {
  const size = plotSize(u.resolution), fontSize = u.appearance.w;
  const axisLine = cross(homogeneous(vec3(0), u, false), homogeneous(axis, u, true));
  const magnitude = length(axisLine.xy);
  if (magnitude <= 1e-12 || abs(dot(axisLine, vec3(pixel, 1))) / magnitude > fontSize * 6 + 12 + pixelWidth()) return vec4(0);
  const normal = axisLine.xy / magnitude;
  const tangent = vec2(normal.y, -normal.x);
  const low = min(0, tangent.x * size.x) + min(0, tangent.y * size.y);
  const coordinate = (dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20);
  const column = clamp(i32(floor(coordinate * f32(u.curveTiles.w))), 0, i32(u.curveTiles.w) - 1);
  let labels = vec3(0);
  let ticks = 0;
  for (let candidate = 0; candidate < 6; candidate++) {
    const row = index * 12 + candidate * 2;
    const location = textureLoad(spatialLabels, vec2i(column, row), 0);
    const at = location.xy, outward = location.zw;
    const anchor = at + outward * (fontSize * 0.95 + 6) + vec2(0, fontSize * 0.65);
    const delta = pixel - anchor;
    const nearLabel = (u.decorations & u32(2)) != u32(0) && abs(delta.x) <= fontSize * 9 && delta.y >= -fontSize * 1.5 - 3 - pixelWidth() && delta.y <= 3 + pixelWidth();
    const nearTick = u.appearance.x > 0 && all(abs(pixel - at) <= vec2(u.appearance.x * 0.5 + 4 + pixelWidth()));
    if (!nearLabel && !nearTick) continue;
    const style = textureLoad(spatialLabels, vec2i(column, row + 1), 0);
    if (nearTick && style.z > 0) ticks = max(ticks, tickMark(pixel, at, tangent, 3, u.appearance.x) * style.z);
    if (nearLabel && style.w > 0) labels = max(labels, numberAt(pixel, anchor, style.x, style.y, 0.5, fontSize, u.labelStyle.y, u.labelStyle.z) * style.w * u.decorationOpacity.y);
  }
  return vec4(ticks, labels);
}

function cachedSpatialBackground(uv: vec2, u: PlotUniforms): SpatialDecor {
  const size = plotSize(u.resolution), pixel = uv * size;
  const ray = viewRay(uv, u);
  const xLevels = textureLoad(spatialLabels, vec2i(0, 37), 0).xyz;
  const zLevels = textureLoad(spatialLabels, vec2i(2, 37), 0).xyz;
  const grid = groundField(ray, u, xLevels, zLevels);
  const xTicks = cachedSpatialTicks(pixel, vec3(1, 0, 0), 0, u);
  const yTicks = cachedSpatialTicks(pixel, vec3(0, 1, 0), 1, u);
  const zTicks = cachedSpatialTicks(pixel, vec3(0, 0, 1), 2, u);
  let labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.8, 0.82, 0.85), grid * 0.65);
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, vec3(1, 0, 0), ray, u));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, vec3(0, 1, 0), ray, u));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, vec3(0, 0, 1), ray, u));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if ((u.decorations & u32(4)) != u32(0)) {
    for (let index = 0; index < 3; index++) {
      const name = textureLoad(spatialLabels, vec2i(index, 36), 0);
      if (name.w > 0) labels = max(labels, axisLabel(pixel, name.xy, i32(name.z), u) * u.decorationOpacity.z);
    }
  }
  return { color: mix(vec3(0.965, 0.973, 0.985), color, u.sceneOpacity.x), labels: labels * u.sceneOpacity.x };
}

class SurfaceHit { point: vec3; depth: f32; valid: bool; }

function surfaceInside(p: vec2, u: PlotUniforms): bool {
  return ((u.surfaceDomainMode & u32(1)) == u32(0) || p.x >= u.surfaceBounds.x) && ((u.surfaceDomainMode & u32(2)) == u32(0) || p.x <= u.surfaceBounds.z) && ((u.surfaceDomainMode & u32(4)) == u32(0) || p.y >= u.surfaceBounds.y) && ((u.surfaceDomainMode & u32(8)) == u32(0) || p.y <= u.surfaceBounds.w);
}

/** Intersect the height field itself; no host samples or triangle surface mesh. */
function surfaceHit(field: HeightField, uv: vec2, u: PlotUniforms): SurfaceHit {
  const ray = viewRay(uv, u);
  let near = u.surfaceDepth.x, far = u.surfaceDepth.y;
  for (let axis = 0; axis < 2; axis++) {
    const origin = axis == 0 ? ray.origin.x : ray.origin.z;
    const direction = axis == 0 ? ray.direction.x : ray.direction.z;
    const lower = axis == 0 ? u.surfaceBounds.x : u.surfaceBounds.y;
    const upper = axis == 0 ? u.surfaceBounds.z : u.surfaceBounds.w;
    const lowerFlag = axis == 0 ? u32(1) : u32(4), upperFlag = lowerFlag * u32(2);
    if (abs(direction) < 1e-20) {
      if (((u.surfaceDomainMode & lowerFlag) != u32(0) && origin < lower) || ((u.surfaceDomainMode & upperFlag) != u32(0) && origin > upper)) return {point: vec3(0), depth: 0, valid: false};
    } else {
      if ((u.surfaceDomainMode & lowerFlag) != u32(0)) {
        const at = (lower - origin) / direction;
        if (direction > 0) near = max(near, at); else far = min(far, at);
      }
      if ((u.surfaceDomainMode & upperFlag) != u32(0)) {
        const at = (upper - origin) / direction;
        if (direction > 0) far = min(far, at); else near = max(near, at);
      }
    }
  }
  if (far < near) return {point: vec3(0), depth: 0, valid: false};
  let previous = near;
  const first = ray.origin + ray.direction * near;
  let before = first.y - field(first.x, first.z);
  const count = max(u32(16), u.curveQuality.x);
  for (let i: u32 = 1; i <= count; i++) {
    const at = mix(near, far, f32(i) / f32(count));
    const p = ray.origin + ray.direction * at;
    const value = p.y - field(p.x, p.z);
    if (abs(value) < 1e18 && abs(before) < 1e18 && ((value >= 0) != (before >= 0) || value == 0 || before == 0)) {
      let low = previous, high = at, residual = before;
      for (let iteration: u32 = 0; iteration < u.curveQuality.y * u32(2) + u32(8); iteration++) {
        const middle = (low + high) * 0.5;
        const point = ray.origin + ray.direction * middle;
        const sample = point.y - field(point.x, point.z);
        if (!(abs(sample) < 1e18)) break;
        if ((sample >= 0) == (residual >= 0)) {low = middle; residual = sample;} else high = middle;
      }
      const depth = (low + high) * 0.5;
      const point = ray.origin + ray.direction * depth;
      const sample = field(point.x, point.z);
      const tolerance = max(1e-5, max(u.plotSpan.x, u.plotSpan.y) * 1e-4);
      if (abs(sample) < 1e18 && abs(point.y - sample) <= tolerance && surfaceInside(point.xz, u)) return {point: vec3(point.x, sample, point.z), depth, valid: true};
    }
    before = value; previous = at;
  }
  return {point: vec3(0), depth: 0, valid: false};
}

export function surfaceColorBar(color: vec3, uv: vec2, u: PlotUniforms): vec3 {
  if ((u.surfaceFlags & u32(8)) == u32(0)) return color;
  const size = plotSize(u.resolution), pixel = uv * size;
  const height = min(160, size.y * 0.36);
  const lower = vec2(size.x - 25, size.y - 70 - height), upper = lower + vec2(10, height);
  const q = max(lower - pixel, pixel - upper);
  const distance = max(q.x, q.y);
  const coverage = distanceCoverage(max(0, distance), 1.2);
  const t = clamp((pixel.y - lower.y) / height, 0, 1);
  let result = mix(color, colorMap(t, u32(u.surfaceRender.x)), coverage);
  const border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3), border);
  let labels = vec3(0);
  for (let index = 0; index < 3; index++) {
    const fraction = f32(index) * 0.5;
    const value = mix(u.surfaceRange.x, u.surfaceRange.y, fraction);
    const at = vec2(lower.x - 5, mix(lower.y, upper.y, fraction) + u.appearance.w * 0.7);
    labels = max(labels, numberAt(pixel, at, value, (u.surfaceRange.y - u.surfaceRange.x) * 0.5, 1, u.appearance.w, u.labelStyle.y, 0));
  }
  return labelColor(result, labels);
}

function surfaceMaterial(field: HeightField, hit: SurfaceHit, u: PlotUniforms): vec4 {
  // Derivatives execute uniformly, including miss pixels. They filter contour and
  // wire fields at physical-pixel scale instead of tessellating their geometry.
  const footprint = max(vec2(length(vec2(dpdx(hit.point.x), dpdy(hit.point.x))), length(vec2(dpdx(hit.point.z), dpdy(hit.point.z)))), vec2(1e-20));
  const valueRate = max(length(vec2(dpdx(hit.point.y), dpdy(hit.point.y))), 1e-20);
  const xLevels = axisLevels(u.plotCenter.x, u.plotSpan.x, u.resolution.x, true, u);
  const zLevels = axisLevels(0, max(u.plotSpan.x, u.plotSpan.y), u.resolution.y, false, u);
  const spacing = vec2(xLevels.x, zLevels.x);
  const wireDistance = abs(fract(hit.point.xz / spacing + vec2(0.5)) - vec2(0.5)) * spacing / footprint * pixelWidth();
  const separation = spacing / footprint * pixelWidth();
  const wire = max(distanceCoverage(wireDistance.x, u.appearance.z) * smoothstep(2, 6, separation.x), distanceCoverage(wireDistance.y, u.appearance.z) * smoothstep(2, 6, separation.y));
  const contourDistance = abs(fract(hit.point.y / u.surfaceRender.z + 0.5) - 0.5) * u.surfaceRender.z / valueRate * pixelWidth();
  const contours = distanceCoverage(contourDistance, u.appearance.z) * smoothstep(2, 6, u.surfaceRender.z / valueRate * pixelWidth());
  let result = vec4(0);
  if (hit.valid) {
    const t = (hit.point.y - u.surfaceRange.x) / (u.surfaceRange.y - u.surfaceRange.x);
    let ink = colorMap(t, u32(u.surfaceRender.x));
    if (u.view3d != u32(0) && (u.surfaceFlags & u32(1)) != u32(0)) {
      const h = max(1e-5, max(footprint.x, footprint.y) * 0.25);
      const left = field(hit.point.x - h, hit.point.z), right = field(hit.point.x + h, hit.point.z);
      const before = field(hit.point.x, hit.point.z - h), after = field(hit.point.x, hit.point.z + h);
      // Observation-grid edges and missing neighbors use one-sided derivatives.
      // Undefined sentinel values must never enter the lighting normal.
      const dx = abs(left) < 1e18 && abs(right) < 1e18 ? (right - left) / (2 * h) : abs(right) < 1e18 ? (right - hit.point.y) / h : abs(left) < 1e18 ? (hit.point.y - left) / h : 0;
      const dz = abs(before) < 1e18 && abs(after) < 1e18 ? (after - before) / (2 * h) : abs(after) < 1e18 ? (after - hit.point.y) / h : abs(before) < 1e18 ? (hit.point.y - before) / h : 0;
      const tx = cameraVector(vec3(1, dx, 0), u), tz = cameraVector(vec3(0, dz, 1), u);
      const crossNormal = cross(tz / max(max(max(abs(tz.x), abs(tz.y)), abs(tz.z)), 1e-20), tx / max(max(max(abs(tx.x), abs(tx.y)), abs(tx.z)), 1e-20));
      const normalLength = length(crossNormal);
      let normal = normalLength > 1e-12 ? crossNormal / normalLength : vec3(0, 0, 1);
      if (normal.z < 0) normal = -normal;
      const diffuse = max(0, dot(normal, normalize(vec3(-0.4, 0.7, 1))));
      const specular = pow(max(0, dot(normal, normalize(vec3(-0.2, 0.35, 1)))), 32) * 0.16;
      ink = ink * (0.4 + diffuse * 0.6) + vec3(specular);
    }
    const lines = max((u.surfaceFlags & u32(2)) != u32(0) ? wire : 0, (u.surfaceFlags & u32(4)) != u32(0) ? contours : 0);
    const filled = (u.surfaceFlags & u32(16)) != u32(0);
    if (filled) ink = mix(ink, vec3(0.12, 0.16, 0.22), lines * 0.65);
    result = vec4(ink, u.surfaceRender.y * (filled ? 1 : lines));
  }
  return result;
}

/** Both flat scalar fields and spatial height fields share color normalization. */
export function plotSurface(field: HeightField, uv: vec2, u: PlotUniforms, cached: bool): vec4 {
  const flat = u.plotCenter + (uv - vec2(0.5)) * u.plotSpan;
  let hit: SurfaceHit = {point: vec3(flat.x, field(flat.x, flat.y), flat.y), depth: 0, valid: false};
  if (u.view3d != u32(0)) hit = surfaceHit(field, uv, u);
  else hit.valid = abs(hit.point.y) < 1e18 && surfaceInside(flat, u);
  const material = surfaceMaterial(field, hit, u);
  let color = vec3(0.965, 0.973, 0.985), labels = vec3(0);
  let decor = vec4(0);
  if (u.view3d != u32(0)) {
    const background = cached ? cachedSpatialBackground(uv, axesUniforms(u)) : spatialBackground(uv, axesUniforms(u));
    color = background.color; labels = background.labels;
  } else decor = axes2D(uv, u, 122) * u.sceneOpacity.x;
  color = mix(color, material.xyz, material.w * u.sceneOpacity.y);
  if (u.view3d == u32(0)) {color = mix(color, vec3(0.39, 0.43, 0.49), decor.x); labels = decor.yzw;}
  const decorated = labelColor(color, labels);
  return vec4(mix(decorated, surfaceColorBar(decorated, uv, u), u.sceneOpacity.y), 1);
}

/** Integer targets preserve exact f32 point bits on both backends, without float targets. */
export function pickSurface(field: HeightField, position: vec4, u: PlotUniforms): vec4u {
  const uv = query.pixel / plotSize(u.resolution);
  const p = u.plotCenter + (uv - vec2(0.5)) * u.plotSpan;
  let hit: SurfaceHit = {point: vec3(p.x, field(p.x, p.y), p.y), depth: 0, valid: false};
  if (u.view3d != u32(0)) hit = surfaceHit(field, uv, u);
  else hit.valid = abs(hit.point.y) < 1e18 && surfaceInside(p, u);
  if (!hit.valid) return vec4u(0);
  return position.x < 1 ? vec4u(bitcast<vec3u>(hit.point), 1) : vec4u(bitcast<u32>(hit.point.y), 0, 0, 1);
}

function queryProjection(point: vec3, u: PlotUniforms): vec2 {
  return u.view3d == u32(0) ? ((point.xy-u.plotCenter)/u.plotSpan+vec2(0.5))*u.resolution : project(point,u);
}
function queryVisible(point: vec3, u: PlotUniforms): bool {return all(abs(point)<vec3(1e18))&&(u.view3d==u32(0)||inFront(point,u));}
/** One-pixel query: use the same domains, clipped dash bands and half intervals as rendering. */
export function pickTrajectory(trajectory: SpaceCurve, position: vec4, u: PlotUniforms, scalar: bool, jumps: bool): vec4u {
  const pixel=query.pixel,focus=parameterFocus(trajectory,u);
  let lower=u.parameterBounds.x,upper=u.parameterBounds.y,unbounded=u.parameterMode!=u32(0);
  if(scalar) {
    unbounded=false;
    if(u.view3d==u32(0)) {
      const x=u.plotCenter.x+(pixel.x/u.resolution.x-0.5)*u.plotSpan.x;
      const span=u.plotSpan.x*(query.radius+u.appearance.z+2)/u.resolution.x;
      lower=x-span;upper=x+span;
    } else {
      const at=scalarParameter(pixel,u);
      const before=scalarParameter(pixel-vec2(query.radius,0),u),after=scalarParameter(pixel+vec2(query.radius,0),u);
      const span=max(abs(after.x-before.x),u.plotSpan.x*0.01);
      lower=at.x-span;upper=at.x+span;
      if(at.y==0){lower=focus.x-focus.y*32;upper=focus.x+focus.y*32;}
    }
  }
  const count=scalar?i32(u.curveQuality.x):curveIntervalCount(u);
  let best=1e20,parameter=u.probe;
  for(let index=0;index<count;index++) {
    let low=unbounded?parameterAt(-1+2*f32(index)/f32(count),focus.y,focus.x,u):mix(lower,upper,f32(index)/f32(count));
    let high=unbounded?parameterAt(-1+2*f32(index+1)/f32(count),focus.y,focus.x,u):mix(lower,upper,f32(index+1)/f32(count));
    if(u.curvePattern.x!=0) {
      const period=u.curvePattern.y;
      const center=(floor(((low+high)*0.5+u.curvePattern.z)/period)+0.5)*period-u.curvePattern.z;
      low=max(low,center-period*u.curvePattern.w*0.5);high=min(high,center+period*u.curvePattern.w*0.5);
    }
    if(high<low)continue;
    const middle=(low+high)*0.5;
    for(let half=0;half<2;half++) {
      let start=half==0?low:middle,end=half==0?middle:high;
      let a=trajectory(start),b=trajectory(end);
      if(!(all(abs(a)<vec3(1e18))&&all(abs(b)<vec3(1e18))))continue;
      const frontA=u.view3d!=u32(2)||inFront(a,u),frontB=u.view3d!=u32(2)||inFront(b,u);
      if(!frontA&&!frontB)continue;
      if(frontA!=frontB) {
        let left=start,right=end;
        for(let iteration=0;iteration<12;iteration++) {
          const t=(left+right)*0.5;
          if(inFront(trajectory(t),u)==frontA)left=t;else right=t;
        }
        if(frontA)end=left;else start=right;
        a=trajectory(start);b=trajectory(end);
      }
      const m=trajectory((start+end)*0.5);
      if(!(all(abs(m)<vec3(1e18)))||(jumps&&length(m-(a+b)*0.5)>max(1e-6,length(b-a)*0.2)))continue;
      const pa=queryProjection(a,u),pb=queryProjection(b,u),delta=pb-pa;
      const fraction=clamp(dot(pixel-pa,delta)/max(dot(delta,delta),1e-20),0,1);
      const wa=u.view3d==u32(0)?1:homogeneous(a,u,false).z,wb=u.view3d==u32(0)?1:homogeneous(b,u,false).z;
      let t=mix(start,end,fraction*wa/max(mix(wb,wa,fraction),1e-20));
      const epsilon=max(max((end-start)*0.001,abs(t)*1e-6),1e-7);
      for(let iteration:u32=0;iteration<u.curveQuality.y;iteration++) {
        const left=max(start,t-epsilon),right=min(end,t+epsilon);
        const tangent=(queryProjection(trajectory(right),u)-queryProjection(trajectory(left),u))/max(right-left,1e-20);
        const at=queryProjection(trajectory(t),u),error=dot(at-pixel,at-pixel);
        let next=clamp(t-dot(at-pixel,tangent)/max(dot(tangent,tangent),1e-20),start,end);
        let world=trajectory(next),projected=queryProjection(world,u);
        if(!queryVisible(world,u)||dot(projected-pixel,projected-pixel)>error){next=(next+t)*0.5;world=trajectory(next);projected=queryProjection(world,u);}
        if(!queryVisible(world,u)||dot(projected-pixel,projected-pixel)>error||next==t)break;
        t=next;
      }
      const point=trajectory(t),distance=length(queryProjection(point,u)-pixel);
      if(queryVisible(point,u)&&distance<best){best=distance;parameter=t;}
      const first=length(pa-pixel),last=length(pb-pixel);
      if(first<best){best=first;parameter=start;}
      if(last<best){best=last;parameter=end;}
    }
  }
  if(best>query.radius+u.appearance.z*0.5||u.appearance.z<=0)return vec4u(0);
  const point=trajectory(parameter);
  return position.x<1?vec4u(bitcast<vec3u>(point),1):vec4u(bitcast<u32>(parameter),bitcast<u32>(best),0,1);
}

/** Straight color and exact f32 camera distance for one mathematical object. */
export class SceneLayer {
  @location(0) color: vec4;
  @location(1) depth: vec4;
}
class SceneMaterial { ink: vec4; bias: f32; }
declare const sceneMaterial: uniform<SceneMaterial>;

function packedDepth(depth: f32): vec4 {
  const bits = bitcast<u32>(depth);
  return vec4(f32(bits & u32(255)), f32((bits >> u32(8)) & u32(255)), f32((bits >> u32(16)) & u32(255)), f32(bits >> u32(24))) / 255;
}
function sceneLayer(color: vec4, depth: f32): SceneLayer {
  return { color, depth: packedDepth(depth + sceneMaterial.bias) };
}

/** Union SDF coverage before resolving depth. Adjacent interval endpoint caps must
 * not replace a continuous stroke's opaque center with partial AA coverage.
 * Equally covered branches resolve front to back, including at curve folds. */
function chooseSceneHit(trajectory: SpaceCurve, hit: vec2, current: vec4, u: PlotUniforms): vec4 {
  const coverage = distanceCoverage(hit.x, u.appearance.z);
  if (coverage <= 0) return current;
  const depth = cameraDistance(trajectory(hit.y), u);
  if (!(depth >= 0.101 && depth < 1e30)) return current;
  return coverage > current.w || (coverage == current.w && (depth < current.z || (depth == current.z && hit.x < current.x))) ? vec4(hit, depth, coverage) : current;
}

function cachedSceneHit(trajectory: SpaceCurve, pixel: vec2, u: PlotUniforms): vec4 {
  const tile = min(vec2u(floor(pixel / f32(u.curveTiles.z))), u.curveTiles.xy - vec2u(1));
  const groups = (curveIntervalCount(u) * 2 + 127) / 128;
  let best = vec4(1e20, 0, 1e20, 0);
  for (let group = 0; group < groups; group++) {
    const packed = textureLoad(curveCandidates, vec2i(i32(tile.x) * 8 + group, i32(tile.y)), 0);
    for (let lane = 0; lane < 4; lane++) {
      let bits = packed[lane];
      for (let remaining = 0; remaining < 32; remaining++) {
        if (bits == u32(0)) break;
        const bit = firstTrailingBit(bits);
        bits &= bits - u32(1);
        const index = group * 128 + lane * 32 + i32(bit);
        const bounds = textureLoad(curveIntervals, vec2i(index, 4), 0);
        if (any(pixel < bounds.xy) || any(pixel > bounds.zw)) continue;
        const parameters = textureLoad(curveIntervals, vec2i(index, 0), 0);
        const a = textureLoad(curveIntervals, vec2i(index, 1), 0), b = textureLoad(curveIntervals, vec2i(index, 2), 0);
        const middle = textureLoad(curveIntervals, vec2i(index, 3), 0);
        if (min(intervalChordDistance(pixel, a.xy, middle.xy), intervalChordDistance(pixel, middle.xy, b.xy)) > middle.z) continue;
        const delta = b.xy - a.xy;
        const fraction = clamp(dot(pixel - a.xy, delta) / max(dot(delta, delta), 1e-20), 0, 1);
        const seed = mix(parameters.x, parameters.y, fraction * a.z / max(mix(b.z, a.z, fraction), 1e-20));
        let hit = refineTrajectoryHit(trajectory, pixel, vec4(0, seed, parameters.xy), u, false);
        const first = length(pixel - a.xy), last = length(pixel - b.xy);
        if (first < hit.x) hit = vec2(first, parameters.x);
        if (last < hit.x) hit = vec2(last, parameters.y);
        best = chooseSceneHit(trajectory, hit, best, u);
      }
    }
  }
  return best;
}

function referenceSceneHit(trajectory: SpaceCurve, pixel: vec2, u: PlotUniforms, bounds: vec2, jumps: bool): vec4 {
  const requested = f32(u.curveQuality.x);
  const range = bounds.y - bounds.x;
  const unbounded = u.parameterMode != u32(0);
  const focus = unbounded ? parameterFocus(trajectory, u) : vec2(0, 1);
  const count = i32(min(512, unbounded || u.curvePattern.x == 0 ? requested : max(requested, ceil(range / u.curvePattern.y * 4))));
  const stepSize = range / f32(count);
  let best = vec4(1e20, 0, 1e20, 0);
  for (let i = 0; i < count; i++) {
    let low = bounds.x + f32(i) * stepSize;
    let high = min(bounds.y, low + stepSize);
    if (unbounded) {
      low = parameterAt(-1 + 2 * f32(i) / f32(count), focus.y, focus.x, u);
      high = parameterAt(-1 + 2 * f32(i + 1) / f32(count), focus.y, focus.x, u);
    }
    let t = (low + high) * 0.5;
    if (u.curvePattern.x != 0) {
      const period = u.curvePattern.y;
      const center = (floor((t + u.curvePattern.z) / period) + 0.5) * period - u.curvePattern.z;
      low = max(low, center - period * u.curvePattern.w * 0.5);
      high = min(high, center + period * u.curvePattern.w * 0.5);
      t = (low + high) * 0.5;
    }
    if (high >= low) {
      const a = trajectory(low), middle = trajectory(t), b = trajectory(high);
      const finite = all(abs(a) < vec3(1e18)) && all(abs(middle) < vec3(1e18)) && all(abs(b) < vec3(1e18));
      if (finite) {
        let possible = true;
        if (inFront(a, u) && inFront(middle, u) && inFront(b, u)) {
          const pa = project(a, u), pm = project(middle, u), pb = project(b, u);
          const bending = intervalChordDistance(pm, pa, pb);
          const guard = bending * 4 + u.appearance.z * 0.5 + pixelWidth() * 2;
          possible = min(intervalChordDistance(pixel, pa, pm), intervalChordDistance(pixel, pm, pb)) <= guard;
        }
        if (possible) {
          best = chooseSceneHit(trajectory, intervalHit(trajectory, pixel, low, t, u, jumps), best, u);
          best = chooseSceneHit(trajectory, intervalHit(trajectory, pixel, t, high, u, jumps), best, u);
        }
      }
    }
  }
  return best;
}

export function sceneCurve(trajectory: SpaceCurve, uv: vec2, u: PlotUniforms): SceneLayer {
  if (u.sceneOpacity.y <= 0 || u.appearance.z <= 0) return sceneLayer(vec4(0), 0);
  const hit = cachedSceneHit(trajectory, uv * plotSize(u.resolution), u);
  return sceneLayer(vec4(sceneMaterial.ink.xyz, hit.w * u.sceneOpacity.y * sceneMaterial.ink.w), hit.z);
}
export function sceneCurveReference(trajectory: SpaceCurve, uv: vec2, u: PlotUniforms, jumps: bool): SceneLayer {
  if (u.sceneOpacity.y <= 0 || u.appearance.z <= 0) return sceneLayer(vec4(0), 0);
  const hit = referenceSceneHit(trajectory, uv * plotSize(u.resolution), u, u.parameterBounds, jumps);
  return sceneLayer(vec4(sceneMaterial.ink.xyz, hit.w * u.sceneOpacity.y * sceneMaterial.ink.w), hit.z);
}
export function sceneSurface(field: HeightField, uv: vec2, u: PlotUniforms): SceneLayer {
  if (u.sceneOpacity.y <= 0) return sceneLayer(vec4(0), 0);
  const hit = surfaceHit(field, uv, u);
  const ink = surfaceMaterial(field, hit, u);
  return sceneLayer(vec4(ink.xyz, ink.w * u.sceneOpacity.y), hit.valid ? cameraDistance(hit.point, u) : 0);
}
export function sceneBackdrop(uv: vec2, u: PlotUniforms): vec4 {
  return vec4(cachedSpatialBackground(uv, axesUniforms(u)).color, 1);
}
export function sceneBackdropReference(uv: vec2, u: PlotUniforms): vec4 {
  return vec4(spatialBackground(uv, axesUniforms(u)).color, 1);
}
/** Isolate the affine label/halo/color-bar overlay without sampling scene objects. */
function sceneDecorLabels(uv: vec2, u: PlotUniforms, decor: SpatialDecor, surface: bool): vec4 {
  let black = labelColor(vec3(0), decor.labels), white = labelColor(vec3(1), decor.labels);
  if (surface) {
    black = mix(black, surfaceColorBar(black, uv, u), u.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, u), u.sceneOpacity.y);
  }
  const alpha = clamp(1 - (white.x - black.x), 0, 1);
  return vec4(alpha > 0 ? black / alpha : vec3(0), alpha);
}
export function sceneLabels(uv: vec2, u: PlotUniforms, surface: bool): vec4 {
  return sceneDecorLabels(uv, u, cachedSpatialBackground(uv, axesUniforms(u)), surface);
}
export function sceneLabelsReference(uv: vec2, u: PlotUniforms, surface: bool): vec4 {
  return sceneDecorLabels(uv, u, spatialBackground(uv, axesUniforms(u)), surface);
}
export function querySceneCurve(trajectory: SpaceCurve, position: vec4, u: PlotUniforms): vec4u {
  const hit = cachedSceneHit(trajectory, query.pixel, u);
  if (hit.w <= 0 || u.sceneOpacity.y <= 0) return vec4u(0);
  const point = trajectory(hit.y);
  return position.x < 1 ? vec4u(bitcast<vec3u>(point), 1) : vec4u(bitcast<u32>(hit.y), bitcast<u32>(hit.x), 0, 1);
}
export function querySceneCurveReference(trajectory: SpaceCurve, position: vec4, u: PlotUniforms, jumps: bool): vec4u {
  const hit = referenceSceneHit(trajectory, query.pixel, u, u.parameterBounds, jumps);
  if (hit.w <= 0 || u.sceneOpacity.y <= 0) return vec4u(0);
  return position.x < 1 ? vec4u(bitcast<vec3u>(trajectory(hit.y)), 1) : vec4u(bitcast<u32>(hit.y), bitcast<u32>(hit.x), 0, 1);
}
`;var d=Object.freeze({"function-plot.shade.ts":a,"font.shade.ts":e,"palette.shade.ts":t});export{d as plotShaderFiles};
