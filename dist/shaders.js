var e=`'use typeshade';

/** Host-controlled viewport, in data units; rotation is yaw/pitch in radians. */
export class PlotViewport {
  resolution: vec2;
  plotCenter: vec2;
  plotSpan: vec2;
  plotRotation: vec2;
  plotBlend: f32;
}

export class PlotUniforms extends PlotViewport {
  probe: f32;
  view3d: u32;
}

type ScalarCurve = (x: f32) => f32;
type SpaceCurve = (t: f32) => vec3;

/** Use a logical drawing grid so axes remain legible on high-density displays. */
function plotSize(resolution: vec2): vec2 {
  const size = max(resolution, vec2(1));
  return size / max(min(size.x, size.y) / 320, 1);
}

function stroke(p: vec2, a: vec2, b: vec2): f32 {
  const ab = b - a;
  const t = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0, 1);
  return 1 - smoothstep(0.65, 1.65, length(p - a - ab * t));
}

/** Small vector glyphs keep labels sharp without a texture or a host overlay. */
function glyph(p: vec2, origin: vec2, axis: i32): f32 {
  const q = (p - origin) / 6;
  if (axis == 0) {
    return max(stroke(q * 6, vec2(-3, -4), vec2(3, 4)), stroke(q * 6, vec2(-3, 4), vec2(3, -4)));
  }
  if (axis == 1) {
    return max(
      stroke(q * 6, vec2(-3, 4), vec2(0, 0)),
      max(stroke(q * 6, vec2(3, 4), vec2(0, 0)), stroke(q * 6, vec2(0, 0), vec2(0, -4))),
    );
  }
  return max(
    stroke(q * 6, vec2(-3, 4), vec2(3, 4)),
    max(stroke(q * 6, vec2(3, 4), vec2(-3, -4)), stroke(q * 6, vec2(-3, -4), vec2(3, -4))),
  );
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
    stroke(pixel, vec2(12, origin.y), vec2(size.x - 12, origin.y)),
    stroke(pixel, vec2(origin.x, 12), vec2(origin.x, size.y - 12)),
  );
  const tickStep = vec2(
    pow(10, floor(log2(span.x / 5) / log2(10))),
    pow(10, floor(log2(span.y / 5) / log2(10))),
  );
  const grid = ((abs(fract(p / tickStep + 0.5) - 0.5) * tickStep) / span) * size;
  const ticks = max(
    (1 - smoothstep(0.6, 1.5, grid.x)) * (1 - step(4, abs(pixel.y - origin.y))),
    (1 - smoothstep(0.6, 1.5, grid.y)) * (1 - step(4, abs(pixel.x - origin.x))),
  );
  axes = max(axes, ticks);
  axes = max(axes, glyph(pixel, vec2(size.x - 12, clamp(origin.y + 30, 40, size.y - 40)), 0));
  axes = max(axes, glyph(pixel, vec2(clamp(origin.x + 14, 28, size.x - 28), size.y - 40), 1));
  // The same data-space ticks define the grid; no host-generated line geometry.
  const backgroundGrid = max(1 - smoothstep(0.35, 1.1, grid.x), 1 - smoothstep(0.35, 1.1, grid.y));
  return max(axes, backgroundGrid * 0.2);
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
  const derivative = fwidth(d);
  const width = max(1 / size.y, jumps ? min(derivative, 2 / size.y) : min(derivative, 0.025));
  const curve = (1 - smoothstep(0, width * 1.5, abs(d))) * (abs(value) < 1e18 ? 1 : 0);
  const axes = axes2D(uv, u);
  let color = mix(vec3(0.965, 0.973, 0.985), vec3(0.39, 0.43, 0.49), axes);
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
  const selected = ((vec2(u.probe, sample(u.probe)) - lo) / span) * size;
  return vec4(pointColor(color, pixel, selected), 1);
}

/** Projective camera. view3d: 0 = 2D, 1 = orthographic, 2 = perspective. */
function project(p: vec3, u: PlotUniforms): vec2 {
  const span = max(u.plotSpan, vec2(0.00001));
  const q = vec3((p.xy - u.plotCenter) / span, p.z / max(span.x, span.y));
  const yaw = u.plotRotation.x;
  const pitch = u.plotRotation.y;
  const horizontal = q.x * cos(yaw) + q.z * sin(yaw);
  const depth = -q.x * sin(yaw) + q.z * cos(yaw);
  const vertical = q.y * cos(pitch) - depth * sin(pitch);
  const cameraDepth = q.y * sin(pitch) + depth * cos(pitch);
  const size = plotSize(u.resolution);
  const distance = u.view3d == u32(2) ? max(0.1, 3 - cameraDepth) : 3;
  const focal = 1 / tan(0.3926990817);
  return (vec2(horizontal / (size.x / size.y), vertical) * (focal / distance) + 0.5) * size;
}

/** Omit segments behind the perspective near plane instead of mirroring them. */
function inFront(p: vec3, u: PlotUniforms): bool {
  if (u.view3d != u32(2)) return true;
  const q = vec3((p.xy - u.plotCenter) / max(u.plotSpan, vec2(0.00001)), p.z / max(u.plotSpan.x, u.plotSpan.y));
  const depth = -q.x * sin(u.plotRotation.x) + q.z * cos(u.plotRotation.x);
  return 3 - (q.y * sin(u.plotRotation.y) + depth * cos(u.plotRotation.y)) > 0.1;
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
  // Ground-plane grid is projected by the same camera as curves and axes.
  for (let index = 0; index <= 8; index++) {
    const t = f32(index) / 8;
    const x = mix(u.plotCenter.x - half.x, u.plotCenter.x + half.x, t);
    const z = mix(-max(half.x, half.y), max(half.x, half.y), t);
    const a = vec3(x, 0, -max(half.x, half.y)), b = vec3(x, 0, max(half.x, half.y));
    const c = vec3(u.plotCenter.x - half.x, 0, z), d = vec3(u.plotCenter.x + half.x, 0, z);
    let coverage = 0;
    if (inFront(a, u) && inFront(b, u)) coverage = stroke(pixel, project(a, u), project(b, u));
    if (inFront(c, u) && inFront(d, u)) coverage = max(coverage, stroke(pixel, project(c, u), project(d, u)));
    color = mix(color, vec3(0.8, 0.82, 0.85), coverage * 0.65);
  }
  const xAxis = max(
    stroke(pixel, x0, x1),
    glyph(pixel, clamp(x1 + vec2(10, 0), vec2(9), size - vec2(9)), 0),
  );
  const yAxis = max(
    stroke(pixel, y0, y1),
    glyph(pixel, clamp(y1 + vec2(0, 10), vec2(9), size - vec2(9)), 1),
  );
  const zAxis = max(
    stroke(pixel, z0, z1),
    glyph(pixel, clamp(z1 + vec2(10, 0), vec2(9), size - vec2(9)), 2),
  );
  color = mix(color, vec3(0.67, 0.28, 0.25), xAxis);
  color = mix(color, vec3(0.23, 0.47, 0.3), yAxis);
  color = mix(color, vec3(0.4, 0.35, 0.62), zAxis);
  // Tick spacing is in data coordinates, including the depth axis.
  for (let tick = 1; tick < 8; tick++) {
    const t = f32(tick) / 8;
    const xp = mix(x0, x1, t);
    const yp = mix(y0, y1, t);
    const zp = mix(z0, z1, t);
    const ticks = max(
      stroke(pixel, xp - vec2(0, 3), xp + vec2(0, 3)),
      max(
        stroke(pixel, yp - vec2(3, 0), yp + vec2(3, 0)),
        stroke(pixel, zp - vec2(0, 3), zp + vec2(0, 3)),
      ),
    );
    color = mix(color, vec3(0.45), ticks);
  }
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
    if (valid && continuous && inFront(previous, u) && inFront(next, u)) {
      curve = max(curve, stroke(pixel, project(previous, u), project(next, u)));
    }
    previous = next;
  }
  color = mix(color, vec3(0.09, 0.42, 0.92), curve);
  const selected = trajectory(u.probe);
  const visible = u.probe >= bounds.x && u.probe <= bounds.y && abs(selected.y) < 1e18 && inFront(selected, u);
  return vec4(visible ? pointColor(color, pixel, project(selected, u)) : color, 1);
}
`;var s=Object.freeze({"function-plot.shade.ts":e});export{s as plotShaderFiles};
