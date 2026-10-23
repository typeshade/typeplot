"use typeshade";
import { glyphCoverage, tickNumber, pixelWidth } from "./font.shade.ts";

class DataUniforms {
  resolution: vec2;
  lower: vec2;
  span: vec2;
  logarithmic: vec2;
  grid: f32;
  layer: f32;
  background: vec4;
  legend: vec4;
  focus: f32;
}
declare const u: uniform<DataUniforms>;
class SeriesUniforms {
  color: vec4;
  kind: f32;
  width: f32;
  dash: f32;
  marker: f32;
  count: u32;
  ordered: u32;
  period: f32;
  offset: f32;
  automatic: u32;
  xParameter: u32;
  parameterRange: f32;
  dataBounds: vec4;
}
declare const s: uniform<SeriesUniforms>;
declare const points: storage<array<f32>>;
class TextUniforms { color: vec4; }
declare const text: uniform<TextUniforms>;

class Surface { @builtin("position") position: vec4; @location(0) uv: vec2; }
class Letter { @builtin("position") position: vec4; @location(0) local: vec2; @location(1) code: u32; @location(2) size: f32; }

function clipPosition(p: vec2): vec4 { return vec4(p.x / u.resolution.x * 2 - 1, 1 - p.y / u.resolution.y * 2, 0, 1); }
function extent(): vec2 { return max(u.resolution - vec2(100, 104), vec2(1)); }
function pixelPoint(p: vec2): vec2 {
  const q = vec2(u.logarithmic.x > 0 ? log2(max(p.x, 1e-30)) / log2(10) : p.x, u.logarithmic.y > 0 ? log2(max(p.y, 1e-30)) / log2(10) : p.y);
  const position = (q - u.lower) / u.span;
  return vec2(76, 42) + vec2(position.x, 1 - position.y) * extent();
}
function line(p: vec2, a: vec2, b: vec2, radius: f32): f32 {
  const d = b - a;
  const t = clamp(dot(p - a, d) / max(dot(d, d), 0.00001), 0, 1);
  const aa = pixelWidth() * 0.5;
  return 1 - smoothstep(max(0, radius - aa), radius + aa, length(p - a - t * d));
}
function tickSpacing(span: f32, size: f32, logarithmic: f32): f32 {
  const raw = span / max(4, floor(size / 80));
  if (logarithmic > 0 && span >= 1) return max(1, ceil(raw));
  const unit = pow(10, floor(log2(max(raw, 1e-30)) / log2(10)));
  const fraction = raw / unit;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * unit;
}

@vertex export function surfaceVertex(@builtin("vertex_index") i: u32): Surface {
  const x = i == u32(1) ? 3 : -1;
  const y = i == u32(2) ? 3 : -1;
  return { position: vec4(x, y, 0, 1), uv: vec2(x * 0.5 + 0.5, y * 0.5 + 0.5) };
}

/** Spines, tick spacing, grid locations, tick formatting and glyphs are shader-generated. */
@fragment export function axesFragment(v: Surface): vec4 {
  const p = vec2(v.uv.x, 1 - v.uv.y) * u.resolution;
  const size = extent();
  const lo = vec2(76, 42);
  const hi = lo + size;
  const inside = p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y;
  const value = u.lower + vec2((p.x - lo.x) / size.x, 1 - (p.y - lo.y) / size.y) * u.span;
  const spacing = vec2(tickSpacing(u.span.x, size.x, u.logarithmic.x), tickSpacing(u.span.y, size.y, u.logarithmic.y));
  const nearest = floor(value / spacing + 0.5) * spacing;
  const tick = lo + vec2((nearest.x - u.lower.x) / u.span.x, 1 - (nearest.y - u.lower.y) / u.span.y) * size;
  const grid = max(1 - smoothstep(0.25, 1, abs(p.x - tick.x)), 1 - smoothstep(0.25, 1, abs(p.y - tick.y)));
  if (u.layer < 0.5) {
    const color = inside && u.grid > 0 ? mix(u.background.rgb, vec3(0.89, 0.91, 0.93), grid) : u.background.rgb;
    return vec4(color, u.background.a);
  }
  let coverage = max(max(line(p, lo, vec2(hi.x, lo.y), 0.5), line(p, lo, vec2(lo.x, hi.y), 0.5)), max(line(p, hi, vec2(lo.x, hi.y), 0.5), line(p, hi, vec2(hi.x, lo.y), 0.5)));
  if (tick.x >= lo.x - 0.01 && tick.x <= hi.x + 0.01) {
    coverage = max(coverage, line(p, vec2(tick.x, hi.y), vec2(tick.x, hi.y + 5), 0.5));
    const n = u.logarithmic.x > 0 ? pow(10, nearest.x) : nearest.x;
    const step = u.logarithmic.x > 0 ? max(n, 1e-30) : spacing.x;
    coverage = max(coverage, tickNumber(p - vec2(tick.x, hi.y + 6), n, step, 0.5));
  }
  if (tick.y >= lo.y - 0.01 && tick.y <= hi.y + 0.01) {
    coverage = max(coverage, line(p, vec2(lo.x - 5, tick.y), vec2(lo.x, tick.y), 0.5));
    const n = u.logarithmic.y > 0 ? pow(10, nearest.y) : nearest.y;
    const step = u.logarithmic.y > 0 ? max(n, 1e-30) : spacing.y;
    coverage = max(coverage, tickNumber(p - vec2(lo.x - 9, tick.y - 8), n, step, 1));
  }
  let color = vec4(0.2, 0.26, 0.34, coverage);
  if (u.legend.z > 0 && p.x >= u.legend.x && p.y >= u.legend.y && p.x <= u.legend.x + u.legend.z && p.y <= u.legend.y + u.legend.w) color = vec4(1, 1, 1, 0.96);
  if (u.focus > 0 && min(min(p.x, p.y), min(u.resolution.x - p.x, u.resolution.y - p.y)) < 2) color = vec4(0.09, 0.42, 0.92, 1);
  return color;
}

/** The path is a field, evaluated once per pixel; no line vertex/index geometry. */
function sampleAt(index: u32): vec4 {
  const i = index * u32(4);
  const p = vec4(points[i], points[i + u32(1)], points[i + u32(2)], points[i + u32(3)]);
  const valid = p.w > 0 && abs(p.x) <= 3.4028234e38 && abs(p.y) <= 3.4028234e38 && (u.logarithmic.x <= 0 || p.x > 0) && (u.logarithmic.y <= 0 || p.y > 0);
  return vec4(p.xyz, valid ? 1 : 0);
}

function segmentDistance(p: vec2, a: vec2, b: vec2): f32 {
  const delta = b - a;
  const t = clamp(dot(p - a, delta) / max(dot(delta, delta), 1e-20), 0, 1);
  return length(p - a - t * delta);
}

function boxDistance(p: vec2, a: vec2, b: vec2): f32 {
  const q = abs(p - (a + b) * 0.5) - abs(b - a) * 0.5;
  return length(max(q, vec2(0))) + min(max(q.x, q.y), 0);
}

/** Automatic parameter-space LOD keeps patterns legible while zooming in or out.
 * The coordinate and phase origin remain mathematical parameters; no arc lengths
 * are accumulated. Explicit periods preserve their fixed parameter spacing. */
function visibleDashPeriod(): f32 {
  if (s.dash <= 0 || s.automatic == u32(0)) return s.period;
  let rate = 0;
  if (s.xParameter != u32(0)) {
    rate = u.span.x / extent().x;
    if (u.logarithmic.x > 0) {
      // Use the visible data interval, not a distant full-dataset maximum.
      const visibleMaximum = min(s.dataBounds.z, pow(10, u.lower.x + u.span.x));
      rate *= max(visibleMaximum, 1e-30) * log(10);
      if (s.ordered != u32(0) && s.count >= u32(2)) {
        // Measure the actual projected source interval. Sparse samples interpolate
        // their parameter across the log-projected chord, not the analytic x field.
        const right = min(s.count - u32(1), max(u32(1), lowerBound(visibleMaximum)));
        const a = sampleAt(right - u32(1)), b = sampleAt(right);
        const logSpan = (log2(b.x) - log2(a.x)) / log2(10);
        if (a.w > 0 && b.w > 0 && logSpan > 1e-20)
          rate = abs(b.z - a.z) / logSpan * u.span.x / extent().x;
      }
    }
  } else {
    const projected = abs(pixelPoint(s.dataBounds.zw) - pixelPoint(s.dataBounds.xy));
    rate = s.parameterRange / max(max(projected.x, projected.y), 1e-20);
  }
  const pixelPeriod = s.dash > 1.5 ? max(5, s.width * 2.5) : max(8, s.width * 4);
  if (!(rate > 0)) return s.period;
  // Signed levels refine as well as coarsen. A zero floor would let one
  // magnified on-band fill the viewport and make a dashed line appear solid.
  const level = ceil(log2(max(rate * pixelPeriod / s.period, 1e-20)));
  return max(s.period * pow(2, level), 1e-30);
}

function pathDistance(p: vec2, a: vec2, b: vec2, parameters: vec2, period: f32): f32 {
  if (s.dash <= 0) return segmentDistance(p, a, b);
  const delta = b - a;
  const along = clamp(dot(p - a, delta) / max(dot(delta, delta), 1e-20), 0, 1);
  const parameter = mix(parameters.x, parameters.y, along);
  const on = s.dash > 1.5 ? 0 : 0.6;
  const phase = (parameter - s.offset) / period;
  const cycle = floor(phase - on * 0.5 + 0.5);
  const difference = parameters.y - parameters.x;
  if (abs(difference) < 1e-20) return fract(phase) <= on ? segmentDistance(p, a, b) : 1e20;
  let distance = 1e20;
  for (let neighbor = -1; neighbor <= 1; neighbor++) {
    const start = s.offset + (cycle + f32(neighbor)) * period;
    const first = (start - parameters.x) / difference;
    const second = (start + on * period - parameters.x) / difference;
    const lo = max(0, min(first, second));
    const hi = min(1, max(first, second));
    if (hi >= lo) distance = min(distance, segmentDistance(p, mix(a, b, lo), mix(a, b, hi)));
  }
  return distance;
}

/** Increasing-x data restricts field evaluation to the samples overlapping this pixel. */
function lowerBound(value: f32): u32 {
  let lo = u32(0), hi = s.count;
  for (let iteration = 0; iteration < 32; iteration++) {
    if (lo >= hi) break;
    const middle = lo + (hi - lo) / u32(2);
    if (points[middle * u32(4)] < value) lo = middle + u32(1);
    else hi = middle;
  }
  return lo;
}

@fragment export function seriesFragment(v: Surface): vec4 {
  const p = vec2(v.uv.x, 1 - v.uv.y) * u.resolution;
  const lo = vec2(76, 42), hi = lo + extent();
  if (p.x < lo.x || p.x > hi.x || p.y < lo.y || p.y > hi.y) return vec4(0);
  let distance = 1e20;
  if (s.kind < 0.5) {
    const period = visibleDashPeriod();
    let start = u32(0), end = s.count > u32(0) ? s.count - u32(1) : u32(0);
    const radius = s.width * 0.5 + pixelWidth();
    if (s.ordered > u32(0)) {
      const low = u.lower.x + (p.x - radius - lo.x) / extent().x * u.span.x;
      const high = u.lower.x + (p.x + radius - lo.x) / extent().x * u.span.x;
      const left = lowerBound(u.logarithmic.x > 0 ? pow(10, low) : low);
      start = left > u32(0) ? left - u32(1) : u32(0);
      end = min(end, lowerBound(u.logarithmic.x > 0 ? pow(10, high) : high));
    }
    for (let index = start; index < end; index++) {
      const a = sampleAt(index), b = sampleAt(index + u32(1));
      if (a.w > 0 && b.w > 0) {
        const first = pixelPoint(a.xy), second = pixelPoint(b.xy);
        if (all(p >= min(first, second) - vec2(radius)) && all(p <= max(first, second) + vec2(radius)))
          distance = min(distance, pathDistance(p, first, second, vec2(a.z, b.z), period) - s.width * 0.5);
      }
    }
  } else if (s.kind < 1.5) {
    for (let index: u32 = 0; index < s.count; index++) {
      const point = sampleAt(index);
      if (point.w > 0) {
        const q = abs(p - pixelPoint(point.xy));
        const d = s.marker > 0.5 ? max(q.x, q.y) : length(q);
        distance = min(distance, d - s.width);
      }
    }
  } else {
    for (let index: u32 = 0; index < s.count; index++) {
      const i = index * u32(5);
      const a = vec2(points[i], points[i + u32(1)]);
      const baseline = u.logarithmic.y > 0 ? pow(10, u.lower.y) : 0;
      const b = vec2(points[i + u32(2)], baseline);
      const valid = all(abs(a) <= vec2(3.4028234e38)) && abs(b.x) <= 3.4028234e38 && (u.logarithmic.x <= 0 || min(a.x, b.x) > 0) && (u.logarithmic.y <= 0 || a.y > 0);
      if (valid) distance = min(distance, boxDistance(p, pixelPoint(a), pixelPoint(b)));
    }
  }
  const aa = pixelWidth() * 0.5;
  return vec4(s.color.rgb, s.color.a * (1 - smoothstep(-aa, aa, distance)));
}

@vertex export function textVertex(@location(0) origin: vec2, @location(1) info: vec3, @location(2) unit: vec2): Letter {
  const size = info.y;
  const local = unit * vec2(20, 24) * (size / 16);
  const p = origin + (info.z > 0 ? vec2(local.y, -local.x) : local);
  return { position: clipPosition(p), local, code: u32(info.x), size };
}
@fragment export function textFragment(v: Letter): vec4 { return vec4(text.color.rgb, text.color.a * glyphCoverage(v.local, i32(v.code), v.size)); }
