"use typeshade";
import { glyphCoverage, glyphLayers, tickNumberLayers, numberPlate, numberWidth, tickLevels, tickOpacity, pixelWidth } from "./font.shade.ts";

/** Host-controlled viewport, in data units; rotation is yaw/pitch in radians. */
export class PlotViewport {
  resolution: vec2;
  plotCenter: vec2;
  plotSpan: vec2;
  plotRotation: vec2;
  plotPan: vec2;
  plotBlend: f32;
  appearance: vec4;
  decorations: u32;
  labelStyle: vec4;
  decorationOpacity: vec3;
}

export class PlotUniforms extends PlotViewport {
  probe: f32;
  view3d: u32;
  parameterBounds: vec2;
  parameterMode: u32;
  curveQuality: vec2u;
  curvePattern: vec4;
}

type ScalarCurve = (x: f32) => f32;
type SpaceCurve = (t: f32) => vec3;

/** Axis names use the same compact plate as single-character numeric labels. */
function axisLabel(pixel: vec2, at: vec2, code: i32, u: PlotViewport): vec3 {
  const local = vec2(pixel.x - at.x, at.y - pixel.y + u.appearance.w * 0.75);
  return vec3(glyphLayers(local + vec2(u.appearance.w * 0.42, 0), code, u.appearance.w, u.labelStyle.y), numberPlate(local, 0, 1, 0.5, u.appearance.w) * u.labelStyle.z);
}

/** CSS-pixel layout keeps line widths and text stable across sizes and display density. */
function plotSize(resolution: vec2): vec2 {
  return max(resolution, vec2(1));
}

function distanceCoverage(distance: f32, width: f32): f32 {
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
  const radius = length(p - selected);
  const halo = 1 - smoothstep(5, 7, radius);
  const dot = 1 - smoothstep(3, 4.5, radius);
  return mix(mix(color, vec3(1), halo), vec3(0.89, 0.29, 0.04), dot);
}

/** Shared spines, data ticks and axis glyphs for all two-dimensional plot styles. */
function axes2D(uv: vec2, u: PlotViewport): vec4 {
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
    const weights = level == 0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)) : vec2(1);
    const grid = abs(p - nearest) / span * size;
    axes = max(axes, max(
      distanceCoverage(grid.x, u.appearance.x) * weights.x * (1 - step(4, abs(pixel.y - origin.y))),
      distanceCoverage(grid.y, u.appearance.x) * weights.y * (1 - step(4, abs(pixel.x - origin.x)))
    ));
    backgroundGrid = max(backgroundGrid, max(distanceCoverage(grid.x, u.appearance.y) * weights.x, distanceCoverage(grid.y, u.appearance.y) * weights.y));
    const at = (nearest - lo) / span * size;
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
  if ((u.decorations & u32(4)) != u32(0)) labels = max(labels, axisLabel(pixel, vec2(clamp(origin.x + 14, 28, size.x - 28), size.y - 40), 121, u) * u.decorationOpacity.z);
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
  const decor = axes2D(uv, u);
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
  const decor = axes2D(uv, u);
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
  const decor = axes2D(uv, u);
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.39, 0.43, 0.49), decor.x);
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
  color = labelColor(color, decor.yzw);
  const selected = ((vec2(u.probe, sample(u.probe)) - u.plotCenter) / span + 0.5) * size;
  return vec4(abs(sample(u.probe)) < 1e18 ? pointColor(color, uv * size, selected) : color, 1);
}

/** Camera coordinates in normalized world units, shared by projection and inverse rays. */
function cameraVector(p: vec3, u: PlotUniforms): vec3 {
  const span = max(u.plotSpan, vec2(0.00001));
  const q = p / vec3(span, max(span.x, span.y));
  const yaw = u.plotRotation.x, pitch = u.plotRotation.y;
  const horizontal = q.x * cos(yaw) + q.z * sin(yaw);
  const depth = -q.x * sin(yaw) + q.z * cos(yaw);
  return vec3(horizontal, q.y * cos(pitch) - depth * sin(pitch), q.y * sin(pitch) + depth * cos(pitch));
}

function cameraPoint(p: vec3, u: PlotUniforms): vec3 {
  return cameraVector(p - vec3(u.plotCenter, 0), u);
}

function inverseCamera(p: vec3, u: PlotUniforms): vec3 {
  const yaw = u.plotRotation.x, pitch = u.plotRotation.y;
  const y = p.y * cos(pitch) + p.z * sin(pitch);
  const depth = -p.y * sin(pitch) + p.z * cos(pitch);
  const q = vec3(p.x * cos(yaw) - depth * sin(yaw), y, p.x * sin(yaw) + depth * cos(yaw));
  return q * vec3(u.plotSpan, max(u.plotSpan.x, u.plotSpan.y));
}

/** Project without division so implicit line fields also work at vanishing points. */
function homogeneous(p: vec3, u: PlotUniforms, direction: bool): vec3 {
  const size = plotSize(u.resolution);
  const camera = direction ? cameraVector(p, u) : cameraPoint(p, u);
  const w = u.view3d == u32(2) ? (direction ? -camera.z : 3 - camera.z) : (direction ? 0 : 3);
  const focal = 1 / tan(0.3926990817);
  return vec3((vec2(camera.x / (size.x / size.y), camera.y) * focal + (vec2(0.5) + u.plotPan) * w) * size, w);
}

function project(p: vec3, u: PlotUniforms): vec2 {
  const h = homogeneous(p, u, false);
  return h.xy / max(h.z, 0.101);
}

function cameraDistance(p: vec3, u: PlotUniforms): f32 { return 3 - cameraPoint(p, u).z; }
function inFront(p: vec3, u: PlotUniforms): bool { return u.view3d != u32(2) || cameraDistance(p, u) >= 0.101; }

class ViewRay { origin: vec3; direction: vec3; }

function viewRay(uv: vec2, u: PlotUniforms): ViewRay {
  const screen = uv - vec2(0.5) - u.plotPan;
  const size = plotSize(u.resolution);
  const cameraXY = vec2(screen.x * (size.x / size.y), screen.y) * tan(0.3926990817);
  const origin = u.view3d == u32(2) ? vec3(0, 0, 3) : vec3(cameraXY * 3, 3);
  const direction = u.view3d == u32(2) ? vec3(cameraXY, -1) : vec3(0, 0, -1);
  return { origin: inverseCamera(origin, u) + vec3(u.plotCenter, 0), direction: inverseCamera(direction, u) };
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
  const spacing = vec2(xLevels.x, zLevels.x);
  const denominator = abs(ray.direction.y) < 1e-8 ? (ray.direction.y < 0 ? -1e-8 : 1e-8) : ray.direction.y;
  const depth = -ray.origin.y / denominator;
  const ground = (ray.origin + ray.direction * depth).xz;
  const gradient = max(vec2(length(vec2(dpdx(ground.x), dpdy(ground.x))), length(vec2(dpdx(ground.y), dpdy(ground.y)))), vec2(1e-20));
  const distance = abs(fract(ground / spacing + 0.5) - 0.5) * spacing / gradient * pixelWidth();
  const separation = spacing / gradient * pixelWidth();
  const fade = smoothstep(vec2(2), vec2(6), separation);
  const nearest = floor(ground / spacing + 0.5) * spacing;
  const field = max(distanceCoverage(distance.x, u.appearance.y) * fade.x * tickOpacity(nearest.x, xLevels), distanceCoverage(distance.y, u.appearance.y) * fade.y * tickOpacity(nearest.y, zLevels));
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
      const before = project(axis * (t - stride), u);
      const after = project(axis * (t + stride), u);
      const tangent = after - before;
      const normal = normalize(vec2(-tangent.y, tangent.x) + vec2(1e-12));
      const sign = axis.y > 0 ? (normal.x > 0 ? -1 : 1) : (normal.y > 0 ? -1 : 1);
      const outward = normal * sign;
      const anchor = at + outward * (fontSize * 0.95 + 6) + vec2(0, fontSize * 0.65);
      const width = numberWidth(t, levels.x, fontSize);
      const room = min(min(anchor.x - width * 0.5 - 3, size.x - anchor.x - width * 0.5 - 3), min(anchor.y - fontSize * 1.5, size.y - anchor.y));
      const separation = min(abs(at - before), abs(after - at));
      const box = vec2(width + fontSize, fontSize * 1.8 + 6);
      const fit = smoothstep(0.85, 1.15, max(separation.x / box.x, separation.y / box.y));
      const visibility = (index < 3 ? tickOpacity(t, levels) : 1) * fit;
      ticks = max(ticks, stroke(pixel, at - normal * 3, at + normal * 3, u.appearance.x) * visibility);
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
  return { color, labels };
}

/** The graph y=f(x), z=0 is an implicit mathematical field on an infinite plane.
 * Inverse projection evaluates that field per fragment, just like the grid. */
export function plotScalar3D(sample: ScalarCurve, trajectory: SpaceCurve, uv: vec2, u: PlotUniforms, jumps: bool): vec4 {
  const ray = viewRay(uv, u);
  const denominator = abs(ray.direction.z) < 1e-8 ? (ray.direction.z < 0 ? -1e-8 : 1e-8) : ray.direction.z;
  const depth = -ray.origin.z / denominator;
  const p = (ray.origin + ray.direction * depth).xy;
  const dx = dpdx(p), dy = dpdy(p);
  const background = spatialBackground(uv, u);
  let curve = 0;
  for (let i = 0; i < 4; i++) {
    const offset = vec2((i & 1) == 0 ? -0.25 : 0.25, (i & 2) == 0 ? -0.25 : 0.25);
    curve += scalarField(sample, p + dx * offset.x + dy * offset.y, dx, dy, u, jumps) * 0.25;
  }
  // An exactly edge-on plane has no unique inverse-plane coordinate. Use the
  // same callback-distance search as spatial curves in this narrow singular view;
  // this is still a procedural curve query, never a line mesh.
  const edgeOn = abs(inverseCamera(vec3(0, 0, -1), u).z) < max(u.plotSpan.x, u.plotSpan.y) * 0.003;
  if (edgeOn) {
    const extent = max(u.plotSpan.x, u.plotSpan.y) * 32;
    curve = distanceCoverage(trajectoryDistance(trajectory, uv * plotSize(u.resolution), u, vec2(u.plotCenter.x - extent, u.plotCenter.x + extent), jumps), u.appearance.z);
  }
  const visible = edgeOn || (abs(ray.direction.z) >= 1e-8 && (u.view3d != u32(2) || depth >= 0.101));
  let color = mix(background.color, vec3(0.09, 0.42, 0.92), visible ? curve : 0);
  color = labelColor(color, background.labels);
  const selected = vec3(u.probe, sample(u.probe), 0);
  return vec4(abs(selected.y) < 1e18 && inFront(selected, u) ? pointColor(color, uv * plotSize(u.resolution), project(selected, u)) : color, 1);
}

/** Refine a candidate against the actual projected callback, never a chord SDF. */
function refineTrajectory(trajectory: SpaceCurve, pixel: vec2, candidate: vec4, u: PlotUniforms, jumps: bool): f32 {
  let t = candidate.y;
  const low = candidate.z, high = candidate.w;
  const epsilon = max(max((high - low) * 0.001, abs(t) * 1e-6), 1e-7);
  for (let iteration = 0; iteration < i32(u.curveQuality.y); iteration++) {
    const before = max(low, t - epsilon), after = min(high, t + epsilon);
    const a = project(trajectory(before), u), b = project(trajectory(after), u);
    const tangent = (b - a) / max(after - before, 1e-20);
    const at = project(trajectory(t), u);
    const delta = dot(at - pixel, tangent) / max(dot(tangent, tangent), 1e-20);
    let next = clamp(t - delta, low, high);
    let world = trajectory(next);
    let projected = project(world, u);
    const error = dot(at - pixel, at - pixel);
    if (!(all(abs(world) < vec3(1e18)) && inFront(world, u) && dot(projected - pixel, projected - pixel) <= error)) {
      next = (t + next) * 0.5;
      world = trajectory(next);
      projected = project(world, u);
    }
    // Safeguard the numerical step: refinement may not make a valid seed worse.
    if (all(abs(world) < vec3(1e18)) && inFront(world, u) && dot(projected - pixel, projected - pixel) <= error) t = next;
  }
  const world = trajectory(t);
  const middle = trajectory((low + high) * 0.5);
  const continuous = !jumps || length(middle - (trajectory(low) + trajectory(high)) * 0.5) <= max(1e-6, length(trajectory(high) - trajectory(low)) * 0.2);
  return all(abs(world) < vec3(1e18)) && continuous && inFront(world, u) ? length(pixel - project(world, u)) : 1e20;
}

/** Projected chord distance is a search bound only; it never supplies coverage. */
function intervalChordDistance(pixel: vec2, a: vec2, b: vec2): f32 {
  const delta = b - a;
  const along = clamp(dot(pixel - a, delta) / max(dot(delta, delta), 1e-20), 0, 1);
  return length(pixel - a - along * delta);
}

/** Query one actual callback interval, keeping its boundary points in the result. */
function intervalDistance(trajectory: SpaceCurve, pixel: vec2, low: f32, high: f32, u: PlotUniforms, jumps: bool): f32 {
  let start = low, end = high;
  let a = trajectory(start), b = trajectory(end);
  const frontA = inFront(a, u), frontB = inFront(b, u);
  if (!(all(abs(a) < vec3(1e18)) && all(abs(b) < vec3(1e18))) || (!frontA && !frontB)) return 1e20;
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
  const refined = refineTrajectory(trajectory, pixel, candidate, u, jumps);
  // Shared interval endpoints make changing the search partition continuous.
  // Apply the same jump rejection as refinement to avoid inventing connections.
  const middle = trajectory((start + end) * 0.5);
  const continuous = !jumps || length(middle - (a + b) * 0.5) <= max(1e-6, length(b - a) * 0.2);
  return continuous ? min(refined, min(length(pixel - pa), length(pixel - pb))) : 1e20;
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
  const size = plotSize(u.resolution);
  const screen = -u.plotPan * vec2(size.x / size.y, 1) * (3 * tan(0.3926990817));
  const focus = inverseCamera(vec3(screen, 0), u) + vec3(u.plotCenter, 0);
  const span = vec3(u.plotSpan, max(u.plotSpan.x, u.plotSpan.y));
  let center = u.probe;
  let speed = 1;
  for (let i = 0; i < 4; i++) {
    const h = max(abs(center) * 1e-5, 0.001);
    const at = trajectory(center);
    const tangent = (trajectory(center + h) - trajectory(center - h)) / (2 * h);
    const normalized = tangent / span;
    const norm = dot(normalized, normalized);
    if (all(abs(at) < vec3(1e18)) && norm > 1e-16 && norm < 1e30) {
      speed = sqrt(norm);
      const correction = dot((focus - at) / span, normalized) / norm;
      center += clamp(correction, -32 / speed, 32 / speed);
    }
  }
  return vec2(center, clamp(2 / max(speed, 1e-10), 0.00001, 1e10));
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

export function plot3D(trajectory: SpaceCurve, uv: vec2, u: PlotUniforms, jumps: bool): vec4 {
  const background = spatialBackground(uv, u);
  const pixel = uv * plotSize(u.resolution);
  const distance = trajectoryDistance(trajectory, pixel, u, u.parameterBounds, jumps);
  let color = mix(background.color, vec3(0.09, 0.42, 0.92), distanceCoverage(distance, u.appearance.z));
  color = labelColor(color, background.labels);
  const selected = trajectory(u.probe);
  const visible = ((u.parameterMode & u32(1)) != u32(0) || u.probe >= u.parameterBounds.x) && ((u.parameterMode & u32(2)) != u32(0) || u.probe <= u.parameterBounds.y) && all(abs(selected) < vec3(1e18)) && inFront(selected, u);
  return vec4(visible ? pointColor(color, pixel, project(selected, u)) : color, 1);
}
