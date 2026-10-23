"use typeshade";
import { glyphCoverage, tickNumber } from "./font.shade.ts";

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
}
declare const s: uniform<SeriesUniforms>;
declare const points: storage<array<f32>>;
class TextUniforms { color: vec4; }
declare const text: uniform<TextUniforms>;

class Surface { @builtin("position") position: vec4; @location(0) uv: vec2; }
class Primitive { @builtin("position") position: vec4; @location(0) pixel: vec2; @location(1) a: vec2; @location(2) b: vec2; }
class Letter { @builtin("position") position: vec4; @location(0) local: vec2; @location(1) code: u32; @location(2) size: f32; }

function corner(i: u32): vec2 {
  return vec2(i == u32(1) || i == u32(2) || i == u32(4) ? 1 : 0, i == u32(2) || i == u32(4) || i == u32(5) ? 1 : 0);
}
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
  return 1 - smoothstep(max(0, radius - 0.6), radius + 0.6, length(p - a - t * d));
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

/** Per-instance segments/markers/bars are expanded in the vertex shader. */
@vertex export function seriesVertex(@builtin("vertex_index") vertex: u32, @builtin("instance_index") instance: u32): Primitive {
  const offset = instance * u32(5);
  const a = pixelPoint(vec2(points[offset], points[offset + u32(1)]));
  const b = pixelPoint(vec2(points[offset + u32(2)], points[offset + u32(3)]));
  const q = corner(vertex);
  let p = vec2(0);
  if (s.kind < 0.5) {
    const delta = b - a;
    const direction = delta / max(length(delta), 0.00001);
    const normal = vec2(-direction.y, direction.x);
    const radius = s.width * 0.5 + 1;
    p = mix(a, b, q.x) + direction * ((q.x * 2 - 1) * radius) + normal * ((q.y * 2 - 1) * radius);
  } else if (s.kind < 1.5) p = a + (q * 2 - 1) * (s.width + 1);
  else p = mix(min(a, b) - vec2(1), max(a, b) + vec2(1), q);
  const position = points[offset + u32(4)] > 0 ? clipPosition(p) : vec4(2, 2, 0, 1);
  return { position, pixel: p, a, b };
}
@fragment export function seriesFragment(v: Primitive): vec4 {
  const lo = vec2(76, 42), hi = lo + extent();
  if (v.pixel.x < lo.x || v.pixel.x > hi.x || v.pixel.y < lo.y || v.pixel.y > hi.y) return vec4(0);
  let coverage = 1;
  if (s.kind < 0.5) {
    coverage = line(v.pixel, v.a, v.b, s.width * 0.5);
    if (s.dash > 0) {
      const direction = (v.b - v.a) / max(length(v.b - v.a), 0.00001);
      const distance = dot(v.pixel, direction);
      const period = s.dash > 1.5 ? 5 : 11;
      coverage = coverage * (fract(distance / period) < (s.dash > 1.5 ? 0.4 : 0.64) ? 1 : 0);
    }
  } else if (s.kind < 1.5) {
    const d = abs(v.pixel - v.a);
    const radius = s.marker > 0.5 ? max(d.x, d.y) : length(d);
    coverage = 1 - smoothstep(s.width - 0.6, s.width + 0.6, radius);
  } else {
    const d = max(min(v.a, v.b) - v.pixel, v.pixel - max(v.a, v.b));
    coverage = 1 - smoothstep(-0.5, 0.5, max(d.x, d.y));
  }
  return vec4(s.color.rgb, s.color.a * coverage);
}

@vertex export function textVertex(@location(0) origin: vec2, @location(1) info: vec3, @location(2) unit: vec2): Letter {
  const size = info.y;
  const local = unit * vec2(20, 24) * (size / 16);
  const p = origin + (info.z > 0 ? vec2(local.y, -local.x) : local);
  return { position: clipPosition(p), local, code: u32(info.x), size };
}
@fragment export function textFragment(v: Letter): vec4 { return vec4(text.color.rgb, text.color.a * glyphCoverage(v.local, i32(v.code), v.size)); }
