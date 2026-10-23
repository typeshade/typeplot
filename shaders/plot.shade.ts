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

/** Analytic rendering samples the scalar callback in data coordinates. */
export function plot2D(sample: ScalarCurve, uv: vec2, u: PlotUniforms, jumps: bool): vec4 {
  const size = plotSize(u.resolution);
  const span = max(u.plotSpan, vec2(0.00001));
  const lo = u.plotCenter - span * 0.5;
  const p = lo + uv * span;
  const pixel = uv * size;
  const value = sample(p.x);
  const y = clamp(value, -1e18, 1e18);
  const d = (p.y - y) / span.y;
  // Euclidean screen-space gradient gives a consistent SDF stroke at every slope.
  const gradient = length(vec2(dpdx(d), dpdy(d)));
  const denominator = jumps ? min(gradient, 2 * pixelWidth() / size.y) : gradient;
  const distance = abs(d) / max(denominator, 1e-12) * pixelWidth();
  const curve = distanceCoverage(distance, u.appearance.z) * (abs(value) < 1e18 ? 1 : 0);
  const axes = axes2D(uv, u);
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.39, 0.43, 0.49), axes);
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
  const selected = ((vec2(u.probe, sample(u.probe)) - lo) / span) * size;
  return vec4(pointColor(color, pixel, selected), 1);
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

/** Only the user trajectory is sampled; its outline is an analytic capsule distance field. */
function worldStroke(pixel: vec2, first: vec3, second: vec3, u: PlotUniforms, width: f32): f32 {
  let a = first, b = second;
  if (u.view3d == u32(2)) {
    const da = cameraDistance(a, u), db = cameraDistance(b, u);
    if (da < 0.101 && db < 0.101) return 0;
    if (da < 0.101) a = mix(first, second, (0.101 - da) / (db - da));
    if (db < 0.101) b = mix(first, second, (0.101 - da) / (db - da));
  }
  return stroke(pixel, project(a, u), project(b, u), width);
}

/** A generic spatial curve, specialized by the compiler for its named callback.
 *  The bounded 96-segment polyline avoids an unbounded raymarch per pixel. */
export function plot3D(
  trajectory: SpaceCurve,
  uv: vec2,
  u: PlotUniforms,
  bounds: vec2,
  jumps: bool,
): vec4 {
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
  let curve = 0;
  let previous = trajectory(bounds.x);
  for (let i = 1; i <= 96; i++) {
    const t = mix(bounds.x, bounds.y, f32(i) / 96);
    const next = trajectory(t);
    const valid =
      max(
        max(abs(previous.x), abs(next.x)),
        max(max(abs(previous.y), abs(next.y)), max(abs(previous.z), abs(next.z))),
      ) < 1e18;
    // A discontinuity deviates from the segment midpoint even when the viewport shrinks it.
    // Compare in data units so zooming out cannot turn a step into a connecting line.
    const middle = trajectory(t - (bounds.y - bounds.x) / 192);
    const expected = (previous + next) * 0.5;
    const continuous =
      !jumps || length(middle - expected) <= max(0.000001, length(next - previous) * 0.2);
    if (valid && continuous) {
      curve = max(curve, worldStroke(pixel, previous, next, u, u.appearance.z));
    }
    previous = next;
  }
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
  color = mix(color, vec3(0.25, 0.29, 0.35), labels);
  const selected = trajectory(u.probe);
  const visible = u.probe >= bounds.x && u.probe <= bounds.y && abs(selected.y) < 1e18 && inFront(selected, u);
  return vec4(visible ? pointColor(color, pixel, project(selected, u)) : color, 1);
}
