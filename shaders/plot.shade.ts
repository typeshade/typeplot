"use typeshade";
import { glyphCoverage, tickNumberSized, pixelWidth } from "./font.shade.ts";

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
}

export class PlotUniforms extends PlotViewport {
  probe: f32;
  view3d: u32;
  parameterBounds: vec2;
  curveQuality: vec2u;
  curvePattern: vec4;
}

type ScalarCurve = (x: f32) => f32;
type SpaceCurve = (t: f32) => vec3;

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

function niceSpacing(span: f32, pixels: f32): f32 {
  const raw = span / max(4, min(12, floor(pixels / 65)));
  const unit = pow(10, floor(log2(max(raw, 1e-30)) / log2(10)));
  const fraction = raw / unit;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * unit;
}

function numberAt(pixel: vec2, anchor: vec2, value: f32, spacing: f32, align: f32, size: f32): f32 {
  const delta = vec2(pixel.x - anchor.x, anchor.y - pixel.y);
  if (delta.y < 0 || delta.y > size * 1.5 || abs(delta.x) > size * 9) return 0;
  return tickNumberSized(delta, value, spacing, align, size);
}

function pointColor(color: vec3, p: vec2, selected: vec2): vec3 {
  const radius = length(p - selected);
  const halo = 1 - smoothstep(5, 7, radius);
  const dot = 1 - smoothstep(3, 4.5, radius);
  return mix(mix(color, vec3(1), halo), vec3(0.89, 0.29, 0.04), dot);
}

/** Shared spines, data ticks and axis glyphs for all two-dimensional plot styles. */
function axes2D(uv: vec2, u: PlotViewport): f32 {
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
  const tickStep = vec2(
    niceSpacing(span.x, size.x * 11 / u.appearance.w),
    niceSpacing(span.y, size.y * 11 / u.appearance.w),
  );
  const grid = ((abs(fract(p / tickStep + 0.5) - 0.5) * tickStep) / span) * size;
  const ticks = max(
    distanceCoverage(grid.x, u.appearance.x) * (1 - step(4, abs(pixel.y - origin.y))),
    distanceCoverage(grid.y, u.appearance.x) * (1 - step(4, abs(pixel.x - origin.x))),
  );
  axes = max(axes, ticks);
  // Choose the nearest label column/row without a per-pixel loop over all ticks.
  const nearest = floor(p / tickStep + 0.5) * tickStep;
  const at = (nearest - lo) / span * size;
  if ((u.decorations & u32(2)) != u32(0) && at.x > 28 && at.x < size.x - 28)
    axes = max(axes, numberAt(pixel, vec2(at.x, origin.y < u.appearance.w * 2 ? origin.y + u.appearance.w * 2 : origin.y - u.appearance.w * 0.65), nearest.x, tickStep.x, 0.5, u.appearance.w));
  if ((u.decorations & u32(2)) != u32(0) && at.y > 25 && at.y < size.y - 25 && abs(nearest.y) > tickStep.y * 0.001)
    axes = max(axes, numberAt(pixel, vec2(origin.x < u.appearance.w * 6 ? origin.x + 8 : origin.x - 8, at.y + u.appearance.w * 0.75), nearest.y, tickStep.y, origin.x < u.appearance.w * 6 ? 0 : 1, u.appearance.w));
  if ((u.decorations & u32(4)) != u32(0)) axes = max(axes, glyph(pixel, vec2(size.x - 12, clamp(origin.y + 30, 40, size.y - 40)), 0, u.appearance.w));
  if ((u.decorations & u32(4)) != u32(0)) axes = max(axes, glyph(pixel, vec2(clamp(origin.x + 14, 28, size.x - 28), size.y - 40), 1, u.appearance.w));
  // The same data-space ticks define the grid; no host-generated line geometry.
  const backgroundGrid = max(distanceCoverage(grid.x, u.appearance.y), distanceCoverage(grid.y, u.appearance.y));
  return max(axes, ((u.decorations & u32(1)) != u32(0) ? backgroundGrid * 0.2 : 0));
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
  return vec4(mix(color, vec3(0.39, 0.43, 0.49), axes2D(uv, u)), 1);
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
  let color = mix(vec3(0.97, 0.97, 0.98), vec3(0.39, 0.43, 0.49), axes2D(uv, u));
  color = mix(color, vec3(0.09, 0.47, 1), blue);
  return vec4(mix(color, vec3(0.98, 0.42, 0.06), orange), 1);
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
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.39, 0.43, 0.49), axes2D(uv, u));
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
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
function groundField(ray: ViewRay, u: PlotUniforms, spacing: vec2): f32 {
  const denominator = abs(ray.direction.y) < 1e-8 ? (ray.direction.y < 0 ? -1e-8 : 1e-8) : ray.direction.y;
  const depth = -ray.origin.y / denominator;
  const ground = (ray.origin + ray.direction * depth).xz;
  const gradient = max(vec2(length(vec2(dpdx(ground.x), dpdy(ground.x))), length(vec2(dpdx(ground.y), dpdy(ground.y)))), vec2(1e-20));
  const distance = abs(fract(ground / spacing + 0.5) - 0.5) * spacing / gradient * pixelWidth();
  const separation = spacing / gradient * pixelWidth();
  const fade = smoothstep(vec2(2), vec2(6), separation);
  const field = max(distanceCoverage(distance.x, u.appearance.y) * fade.x, distanceCoverage(distance.y, u.appearance.y) * fade.y);
  return (u.view3d != u32(2) || depth >= 0.101) && abs(ray.direction.y) >= 1e-8 && (u.decorations & u32(1)) != u32(0) ? field : 0;
}

/** Shared projective grid, axes and labels, independent of the curve representation. */
function spatialBackground(uv: vec2, u: PlotUniforms): vec4 {
  const size = plotSize(u.resolution);
  const pixel = uv * size;
  const half = u.plotSpan * 0.5;
  const x0 = project(vec3(u.plotCenter.x - half.x, 0, 0), u);
  const x1 = project(vec3(u.plotCenter.x + half.x, 0, 0), u);
  const y0 = project(vec3(0, u.plotCenter.y - half.y, 0), u);
  const y1 = project(vec3(0, u.plotCenter.y + half.y, 0), u);
  const z0 = project(vec3(0, 0, -max(half.x, half.y)), u);
  const z1 = project(vec3(0, 0, max(half.x, half.y)), u);
  let color = vec3(0.965, 0.973, 0.985);
  // Tick multiples are anchored in world coordinates. Their projected locations move
  // with camera zoom/pan; subdividing the current span would cancel that movement.
  const xStep = niceSpacing(u.plotSpan.x, length(x1 - x0) * 11 / u.appearance.w);
  const yStep = niceSpacing(u.plotSpan.y, length(y1 - y0) * 11 / u.appearance.w);
  const depthSpan = max(u.plotSpan.x, u.plotSpan.y);
  const zStep = niceSpacing(depthSpan, length(z1 - z0) * 11 / u.appearance.w);
  const lowX = u.plotCenter.x - half.x;
  const lowY = u.plotCenter.y - half.y;
  const lowZ = -depthSpan * 0.5;
  const firstX = ceil(lowX / xStep) * xStep;
  const firstY = ceil(lowY / yStep) * yStep;
  const firstZ = ceil(lowZ / zStep) * zStep;
  const ray = viewRay(uv, u);
  const grid = groundField(ray, u, vec2(xStep, zStep));
  let labels = 0;
  let ticks = 0;
  for (let index = 0; index < 16; index++) {
    const x = firstX + f32(index) * xStep;
    const y = firstY + f32(index) * yStep;
    const z = firstZ + f32(index) * zStep;
    if (x <= lowX + u.plotSpan.x) {
      const world = vec3(x, 0, 0);
      if (inFront(world, u)) {
        const at = project(world, u);
        ticks = max(ticks, stroke(pixel, at - vec2(0, 3), at + vec2(0, 3), u.appearance.x));
        if ((u.decorations & u32(2)) != u32(0)) labels = max(labels, numberAt(pixel, at - vec2(0, u.appearance.w * 0.7), x, xStep, 0.5, u.appearance.w));
      }
    }
    if (z <= -lowZ) {
      const world = vec3(0, 0, z);
      if (inFront(world, u)) {
        const at = project(world, u);
        ticks = max(ticks, stroke(pixel, at - vec2(0, 3), at + vec2(0, 3), u.appearance.x));
        if (abs(z) > zStep * 0.001) if ((u.decorations & u32(2)) != u32(0)) labels = max(labels, numberAt(pixel, at - vec2(0, u.appearance.w * 0.7), z, zStep, 0.5, u.appearance.w));
      }
    }
    if (y <= lowY + u.plotSpan.y) {
      const world = vec3(0, y, 0);
      if (inFront(world, u)) {
        const at = project(world, u);
        ticks = max(ticks, stroke(pixel, at - vec2(3, 0), at + vec2(3, 0), u.appearance.x));
        if (abs(y) > yStep * 0.001) if ((u.decorations & u32(2)) != u32(0)) labels = max(labels, numberAt(pixel, at + vec2(-8, u.appearance.w * 0.75), y, yStep, 1, u.appearance.w));
      }
    }
  }
  color = mix(color, vec3(0.8, 0.82, 0.85), ((u.decorations & u32(1)) != u32(0) ? grid * 0.65 : 0));
  let xAxis = axisField(pixel, vec3(1, 0, 0), ray, u);
  let yAxis = axisField(pixel, vec3(0, 1, 0), ray, u);
  let zAxis = axisField(pixel, vec3(0, 0, 1), ray, u);
  if ((u.decorations & u32(4)) != u32(0)) {
    const labelX = vec3(u.plotCenter.x + half.x, 0, 0);
    const labelY = vec3(0, u.plotCenter.y + half.y, 0);
    const labelZ = vec3(0, 0, -lowZ);
    if (inFront(labelX, u)) xAxis = max(xAxis, glyph(pixel, clamp(project(labelX, u) + vec2(12, 10), vec2(14), size - vec2(14)), 0, u.appearance.w));
    if (inFront(labelY, u)) yAxis = max(yAxis, glyph(pixel, clamp(project(labelY, u) + vec2(10, 12), vec2(14), size - vec2(14)), 1, u.appearance.w));
    if (inFront(labelZ, u)) zAxis = max(zAxis, glyph(pixel, clamp(project(labelZ, u) + vec2(12, 10), vec2(14), size - vec2(14)), 2, u.appearance.w));
  }
  color = mix(color, vec3(0.67, 0.28, 0.25), xAxis);
  color = mix(color, vec3(0.23, 0.47, 0.3), yAxis);
  color = mix(color, vec3(0.4, 0.35, 0.62), zAxis);
  color = mix(color, vec3(0.25, 0.29, 0.35), max(ticks, labels));
  return vec4(color, labels);
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
  let color = mix(background.xyz, vec3(0.09, 0.42, 0.92), visible ? curve : 0);
  color = mix(color, vec3(0.25, 0.29, 0.35), background.w);
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

/** Inspect every projected interval that can cover this fragment. Ranking a
 * fixed number of midpoint samples drops valid branches at folds/crossings.
 * Bounds use sampled bending as a numerical guard, not a proof for an arbitrary
 * callback; quality still determines how much detail the search can resolve. */
function trajectoryDistance(trajectory: SpaceCurve, pixel: vec2, u: PlotUniforms, bounds: vec2, jumps: bool): f32 {
  const requested = f32(u.curveQuality.x);
  const range = bounds.y - bounds.x;
  const count = i32(min(512, u.curvePattern.x == 0 ? requested : max(requested, ceil(range / u.curvePattern.y * 4))));
  const stepSize = range / f32(count);
  let distance = 1e20;
  for (let i = 0; i < count; i++) {
    let low = bounds.x + f32(i) * stepSize;
    let high = min(bounds.y, low + stepSize);
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
  let color = mix(background.xyz, vec3(0.09, 0.42, 0.92), distanceCoverage(distance, u.appearance.z));
  color = mix(color, vec3(0.25, 0.29, 0.35), background.w);
  const selected = trajectory(u.probe);
  const visible = u.probe >= u.parameterBounds.x && u.probe <= u.parameterBounds.y && all(abs(selected) < vec3(1e18)) && inFront(selected, u);
  return vec4(visible ? pointColor(color, pixel, project(selected, u)) : color, 1);
}
