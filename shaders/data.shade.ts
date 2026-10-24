"use typeshade";
import { colorMap } from "./palette.shade.ts";
import { glyphCoverage, glyphLayers, tickNumberLayers, numberPlate, numberWidth, tickLevels, tickOpacity, coarseTickOpacity, pixelWidth } from "./font.shade.ts";

class DataUniforms {
  resolution: vec2;
  lower: vec2;
  span: vec2;
  logarithmic: vec2;
  grid: f32;
  labelStyle: vec4;
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
  baseline: f32;
  capSize: f32;
  where: u32;
}
declare const s: uniform<SeriesUniforms>;
declare const points: storage<array<f32>>;
class TextUniforms { color: vec4; box: vec4; anchor: vec4; offset: vec2; target: vec2; arrow: vec4; }
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
function dataTickLevels(lower: f32, span: f32, pixels: f32, logarithmic: f32, horizontal: bool): vec3 {
  const size = u.labelStyle.x;
  const rough = span * size * 4 / max(pixels, 1);
  let gap = size * 2.6;
  if (horizontal) {
    const low = logarithmic > 0 ? pow(10, lower) : lower;
    const high = logarithmic > 0 ? pow(10, lower + span) : lower + span;
    const step = logarithmic > 0 ? max(low * (pow(10, min(rough, 20)) - 1), 1e-30) : rough;
    gap = max(size * 3.5, max(numberWidth(low, step, size), numberWidth(high, step, size)) + size * 1.3);
  }
  let raw = span * gap / max(pixels * u.labelStyle.y, 1);
  // Wide log views use a nested integer-decade lattice. Sub-decade views use
  // their actual adjacent value difference when formatting labels.
  if (logarithmic > 0 && span >= 2) raw = max(raw, 1);
  return tickLevels(raw);
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
  const lo = vec2(76, 42), hi = lo + size;
  const inside = p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y;
  const value = u.lower + vec2((p.x - lo.x) / size.x, 1 - (p.y - lo.y) / size.y) * u.span;
  const xLevels = dataTickLevels(u.lower.x, u.span.x, size.x, u.logarithmic.x, true);
  const yLevels = dataTickLevels(u.lower.y, u.span.y, size.y, u.logarithmic.y, false);
  let grid = 0;
  let labels = vec3(0);
  let coverage = max(max(line(p, lo, vec2(hi.x, lo.y), 0.5), line(p, lo, vec2(lo.x, hi.y), 0.5)), max(line(p, hi, vec2(lo.x, hi.y), 0.5), line(p, hi, vec2(hi.x, lo.y), 0.5)));
  // Query coarse labels independently: their full glyphs can span several fine
  // Voronoi cells. Selecting only the nearest fine tick clips/ghosts the text.
  for (let level = 0; level < 2; level++) {
    const spacing = level == 0 ? vec2(xLevels.x, yLevels.x) : vec2(xLevels.y, yLevels.y);
    const nearest = floor(value / spacing + 0.5) * spacing;
    const tick = lo + vec2((nearest.x - u.lower.x) / u.span.x, 1 - (nearest.y - u.lower.y) / u.span.y) * size;
    const weights = level == 0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels));
    grid = max(grid, max(line(p, vec2(tick.x, lo.y), vec2(tick.x, hi.y), 0.5) * weights.x, line(p, vec2(lo.x, tick.y), vec2(hi.x, tick.y), 0.5) * weights.y));
    if (u.layer > 0.5) {
      if (tick.x >= lo.x - 0.01 && tick.x <= hi.x + 0.01) {
        coverage = max(coverage, line(p, vec2(tick.x, hi.y), vec2(tick.x, hi.y + 5), 0.5) * weights.x);
        const n = u.logarithmic.x > 0 ? pow(10, nearest.x) : nearest.x;
        const step = u.logarithmic.x > 0 ? max(n * (pow(10, xLevels.x) - 1), 1e-30) : xLevels.x;
        const width = numberWidth(n, step, u.labelStyle.x);
        const room = min(tick.x - width * 0.5 - 4, u.resolution.x - tick.x - width * 0.5 - 4);
        const fit = smoothstep(width + 6, width + 14, spacing.x / u.span.x * size.x);
        const opacity = weights.x * fit * smoothstep(0, 5, room);
        const local = p - vec2(tick.x, hi.y + 6);
        labels = max(labels, vec3(tickNumberLayers(local, n, step, 0.5, u.labelStyle.x, u.labelStyle.z), numberPlate(local, n, step, 0.5, u.labelStyle.x) * u.labelStyle.w) * opacity);
      }
      if (tick.y >= lo.y - 0.01 && tick.y <= hi.y + 0.01) {
        coverage = max(coverage, line(p, vec2(lo.x - 5, tick.y), vec2(lo.x, tick.y), 0.5) * weights.y);
        const n = u.logarithmic.y > 0 ? pow(10, nearest.y) : nearest.y;
        const step = u.logarithmic.y > 0 ? max(n * (pow(10, yLevels.x) - 1), 1e-30) : yLevels.x;
        const width = numberWidth(n, step, u.labelStyle.x);
        const fit = smoothstep(u.labelStyle.x * 1.6, u.labelStyle.x * 2.2, spacing.y / u.span.y * size.y);
        const opacity = weights.y * fit * smoothstep(0, 5, lo.x - 13 - width);
        const local = p - vec2(lo.x - 9, tick.y - u.labelStyle.x * 0.75);
        labels = max(labels, vec3(tickNumberLayers(local, n, step, 1, u.labelStyle.x, u.labelStyle.z), numberPlate(local, n, step, 1, u.labelStyle.x) * u.labelStyle.w) * opacity);
      }
    }
  }
  if (u.layer < 0.5) return vec4(inside ? mix(u.background.rgb, vec3(0.89, 0.91, 0.93), grid * u.grid) : u.background.rgb, u.background.a);
  const alpha = max(max(coverage, labels.y), labels.z * 0.94);
  const ink = max(coverage, labels.x);
  let color = vec4(mix(u.background.rgb, vec3(0.2, 0.26, 0.34), ink / max(alpha, 1e-20)), alpha);
  if (u.legend.z > 0 && p.x >= u.legend.x && p.y >= u.legend.y && p.x <= u.legend.x + u.legend.z && p.y <= u.legend.y + u.legend.w) color = vec4(1, 1, 1, 0.96);
  if (u.focus > 0 && min(min(p.x, p.y), min(u.resolution.x - p.x, u.resolution.y - p.y)) < 2) color = vec4(0.09, 0.42, 0.92, 1);
  return color;
}

/** The path is a field, evaluated once per pixel; no line vertex/index geometry. */
function sampleAt(index: u32): vec4 {
  const i = index * u32(8);
  const p = vec4(points[i], points[i + u32(1)], points[i + u32(2)], points[i + u32(3)]);
  const valid = p.w > 0 && abs(p.x) <= 3.4028234e38 && abs(p.y) <= 3.4028234e38 && (u.logarithmic.x <= 0 || p.x > 0) && (u.logarithmic.y <= 0 || p.y > 0 || s.kind == 6);
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
    if (points[middle * u32(8)] < value) lo = middle + u32(1);
    else hi = middle;
  }
  return lo;
}

class DataHit { distance: f32; index: u32; }
class DataPickUniforms { pixel: vec2; radius: f32; series: u32; }
declare const query: uniform<DataPickUniforms>;
function validData(p: vec2): bool { return all(abs(p) <= vec2(3.4028234e38)) && (u.logarithmic.x <= 0 || p.x > 0) && (u.logarithmic.y <= 0 || p.y > 0); }
function crossing(p: vec2, a: vec2, b: vec2): bool {
  return (a.y > p.y) != (b.y > p.y) && p.x < (b.x-a.x) * (p.y-a.y) / (b.y-a.y) + a.x;
}
function bandDistance(p: vec2, a: vec2, b: vec2, c: vec2, d: vec2): f32 {
  const distance = min(min(segmentDistance(p,a,b),segmentDistance(p,b,c)),min(segmentDistance(p,c,d),segmentDistance(p,d,a)));
  const inside = ((crossing(p,a,b) != crossing(p,b,c)) != crossing(p,c,d)) != crossing(p,d,a);
  return inside ? -distance : distance;
}
function stepDistance(p: vec2, a: vec4, b: vec4, period: f32): f32 {
  const first = pixelPoint(a.xy), last = pixelPoint(b.xy);
  const middle = pixelPoint(vec2((a.x+b.x)*0.5,a.y)).x;
  const t = (a.z+b.z)*0.5;
  if (s.where == u32(0)) {
    const corner = vec2(first.x,last.y);
    const parameter = s.xParameter != u32(0) ? a.z : t;
    return min(pathDistance(p,first,corner,vec2(a.z,parameter),period),pathDistance(p,corner,last,vec2(parameter,b.z),period));
  }
  if (s.where == u32(1)) {
    const corner = vec2(last.x,first.y);
    const parameter = s.xParameter != u32(0) ? b.z : t;
    return min(pathDistance(p,first,corner,vec2(a.z,parameter),period),pathDistance(p,corner,last,vec2(parameter,b.z),period));
  }
  return min(min(pathDistance(p,first,vec2(middle,first.y),vec2(a.z,t),period),pathDistance(p,vec2(middle,first.y),vec2(middle,last.y),vec2(t,t),period)),pathDistance(p,vec2(middle,last.y),last,vec2(t,b.z),period));
}
/** All families use analytic coverage from resident observations, without path meshes. */
function seriesHit(p: vec2, search: f32): DataHit {
  let distance = 1e20, selected = u32(0);
  const lineKind = s.kind < 0.5 || s.kind == 4;
  const segmentKind = lineKind || s.kind == 6;
  let start = u32(0), end = segmentKind ? (s.count > u32(0) ? s.count-u32(1) : u32(0)) : s.count;
  const radius = s.width * 0.5 + pixelWidth() + search;
  if (segmentKind && s.ordered > u32(0)) {
    const low = u.lower.x + (p.x-radius-76) / extent().x * u.span.x;
    const high = u.lower.x + (p.x+radius-76) / extent().x * u.span.x;
    const left = lowerBound(u.logarithmic.x > 0 ? pow(10,low) : low);
    start = left > u32(0) ? left-u32(1) : u32(0);
    end = min(end,lowerBound(u.logarithmic.x > 0 ? pow(10,high) : high));
  }
  const period = visibleDashPeriod();
  for (let index = start; index < end; index++) {
    const a = sampleAt(index);
    if (a.w <= 0) continue;
    const point = pixelPoint(vec2(a.x,s.kind==6&&u.logarithmic.y>0&&a.y<=0?1e-30:a.y));
    const extra = index * u32(8) + u32(4);
    let candidate = 1e20;
    if (lineKind || s.kind == 6) {
      const b = sampleAt(index+u32(1));
      if (b.w <= 0) continue;
      const other = pixelPoint(vec2(b.x,s.kind==6&&u.logarithmic.y>0&&b.y<=0?1e-30:b.y));
      if (s.kind == 6) {
        const first=points[extra],second=points[extra+u32(8)];
        const lowerA=vec2(a.x,u.logarithmic.y>0&&first<=0?1e-30:first),lowerB=vec2(b.x,u.logarithmic.y>0&&second<=0?1e-30:second);
        if (validData(lowerA) && validData(lowerB)) candidate = bandDistance(p,point,other,pixelPoint(lowerB),pixelPoint(lowerA));
      } else if (all(p >= min(point,other)-vec2(radius)) && all(p <= max(point,other)+vec2(radius)))
        candidate = (s.kind == 4 ? stepDistance(p,a,b,period) : pathDistance(p,point,other,vec2(a.z,b.z),period)) - s.width*0.5;
    } else if (s.kind == 1) {
      const q = abs(p-point);
      candidate = (s.marker > 0.5 ? max(q.x,q.y) : length(q))-s.width;
    } else if (s.kind == 2 || s.kind == 3) {
      const horizontal = s.kind == 3;
      const baseline = horizontal ? (u.logarithmic.x > 0 && s.baseline <= 0 ? pow(10,u.lower.x) : s.baseline) : (u.logarithmic.y > 0 && s.baseline <= 0 ? pow(10,u.lower.y) : s.baseline);
      const first = horizontal ? vec2(baseline,points[extra]) : vec2(points[extra],a.y);
      const last = horizontal ? vec2(a.x,points[extra+u32(1)]) : vec2(points[extra+u32(1)],baseline);
      if (validData(first) && validData(last)) candidate = boxDistance(p,pixelPoint(first),pixelPoint(last));
    } else if (s.kind == 5) {
      const baseline = vec2(a.x,u.logarithmic.y > 0 && s.baseline <= 0 ? pow(10,u.lower.y) : s.baseline);
      if (validData(baseline)) candidate = segmentDistance(p,point,pixelPoint(baseline))-s.width*0.5;
    } else if (s.kind == 7) {
      const lowX=points[extra],lowY=points[extra+u32(2)];
      const left=vec2(u.logarithmic.x>0&&lowX<=0?1e-30:lowX,a.y),right=vec2(points[extra+u32(1)],a.y);
      const bottom=vec2(a.x,u.logarithmic.y>0&&lowY<=0?1e-30:lowY),top=vec2(a.x,points[extra+u32(3)]);
      if (validData(left) && validData(right)) {
        const lo = pixelPoint(left), hi = pixelPoint(right);
        candidate = min(candidate,segmentDistance(p,lo,hi)-s.width*0.5);
        candidate = min(candidate,min(segmentDistance(p,lo-vec2(0,s.capSize),lo+vec2(0,s.capSize)),segmentDistance(p,hi-vec2(0,s.capSize),hi+vec2(0,s.capSize)))-s.width*0.5);
      }
      if (validData(bottom) && validData(top)) {
        const lo = pixelPoint(bottom), hi = pixelPoint(top);
        candidate = min(candidate,segmentDistance(p,lo,hi)-s.width*0.5);
        candidate = min(candidate,min(segmentDistance(p,lo-vec2(s.capSize,0),lo+vec2(s.capSize,0)),segmentDistance(p,hi-vec2(s.capSize,0),hi+vec2(s.capSize,0)))-s.width*0.5);
      }
    }
    if (candidate < distance) {distance = candidate; selected = index;}
  }
  return {distance,index:selected};
}
@fragment export function seriesFragment(v: Surface): vec4 {
  const p = vec2(v.uv.x,1-v.uv.y)*u.resolution;
  if (any(p < vec2(76,42)) || any(p > vec2(76,42)+extent())) return vec4(0);
  const hit = seriesHit(p,0);
  const aa = pixelWidth()*0.5;
  return vec4(s.color.rgb,s.color.a*(1-smoothstep(-aa,aa,hit.distance)));
}
@fragment export function pickFragment(v: Surface): vec4u {
  const p = query.pixel;
  if (any(p < vec2(76,42)) || any(p > vec2(76,42)+extent())) {discard;}
  const hit = seriesHit(p,query.radius);
  if (hit.distance > query.radius) {discard;}
  return vec4u(query.series+u32(1),hit.index+u32(1),bitcast<u32>(hit.distance),u32(1));
}

@vertex export function textVertex(@location(0) origin: vec2, @location(1) info: vec3, @location(2) unit: vec2): Letter {
  const size = info.y;
  const local = unit * vec2(20, 24) * (size / 16);
  const p = textPoint(origin + (info.z > 0 ? vec2(local.y, -local.x) : local));
  return { position: clipPosition(p), local, code: u32(info.x), size };
}
@fragment export function textFragment(v: Letter): vec4 {
  const layers = glyphLayers(v.local, i32(v.code), v.size, u.labelStyle.z);
  return vec4(mix(u.background.rgb, text.color.rgb, layers.x / max(layers.y, 1e-20)), text.color.a * layers.y);
}

/** Layout supplies a rectangle only; its rounded field and AA are shader evaluated. */
@fragment export function labelPlateFragment(v: Surface): vec4 {
  const p = vec2(v.uv.x, 1 - v.uv.y) * u.resolution;
  const q = abs(textLocal(p) - text.box.xy) - text.box.zw + vec2(3);
  const distance = length(max(q, vec2(0))) + min(max(q.x, q.y), 0) - 3;
  const aa = pixelWidth() * 0.5;
  const coverage = 1 - smoothstep(-aa, aa, distance);
  const border = 1 - smoothstep(-0.7 - aa, -0.7 + aa, distance);
  const fill = mix(u.background.rgb, vec3(0.995), 0.8);
  return vec4(mix(vec3(0.8, 0.84, 0.9), fill, border), coverage * 0.94);
}

class FieldUniforms {
  bounds: vec4;
  range: vec2;
  shape: vec2u;
  palette: u32;
  origin: u32;
  mode: u32;
  interpolation: u32;
  alpha: f32;
  levels: u32;
  lineWidth: f32;
}
declare const field: uniform<FieldUniforms>;
class FieldSample { value: f32; valid: bool; index: u32; gradient: vec2; }
function fieldAt(column: i32, row: i32): f32 {
  const x = u32(clamp(column,0,i32(field.shape.y)-1)), y = u32(clamp(row,0,i32(field.shape.x)-1));
  return points[y*field.shape.y+x];
}
function fieldSample(pixel: vec2): FieldSample {
  const position = (pixel-vec2(76,42))/extent();
  const scaled = u.lower+vec2(position.x,1-position.y)*u.span;
  const value = vec2(u.logarithmic.x>0?pow(10,scaled.x):scaled.x,u.logarithmic.y>0?pow(10,scaled.y):scaled.y);
  const fraction = (value-field.bounds.xy)/(field.bounds.zw-field.bounds.xy);
  let coordinate = fraction*vec2(f32(field.shape.y),f32(field.shape.x))-vec2(0.5);
  if(field.origin!=u32(0))coordinate.y=f32(field.shape.x)-1-coordinate.y;
  const nearest = vec2u(clamp(floor(coordinate+vec2(0.5)),vec2(0),vec2(f32(field.shape.y)-1,f32(field.shape.x)-1)));
  const index = nearest.y*field.shape.y+nearest.x;
  let sample = points[index],gradient=vec2(0);
  if(field.interpolation!=u32(0)) {
    const low=vec2i(floor(coordinate)),t=fract(coordinate);
    const a=fieldAt(low.x,low.y),b=fieldAt(low.x+1,low.y),c=fieldAt(low.x,low.y+1),d=fieldAt(low.x+1,low.y+1);
    sample=mix(mix(a,b,t.x),mix(c,d,t.x),t.y);
    const dataRate=u.span/extent()*vec2(u.logarithmic.x>0?value.x*log(10):1,u.logarithmic.y>0?value.y*log(10):1);
    gradient=vec2(mix(b-a,d-c,t.y),mix(c-a,d-b,t.x))*vec2(f32(field.shape.y),f32(field.shape.x))/(field.bounds.zw-field.bounds.xy)*dataRate;
  }
  return {value:sample,index,gradient,valid:all(fraction>=vec2(0))&&all(fraction<=vec2(1))&&abs(sample)<=3.4028234e38};
}
function fieldLevel(index: u32): f32 {return points[field.shape.x*field.shape.y+index];}
function fieldColors(value: f32): vec4 {
  if(field.mode!=u32(2))return vec4(colorMap((value-field.range.x)/(field.range.y-field.range.x),field.palette),1);
  let below=u32(0);
  for(let i:u32=0;i<field.levels;i++)if(value>=fieldLevel(i))below=i+u32(1);
  if(below==u32(0)||value>fieldLevel(field.levels-u32(1)))return vec4(0);
  return vec4(colorMap((f32(min(below,field.levels-u32(1)))-0.5)/f32(field.levels-u32(1)),field.palette),1);
}
function nearestLevel(value: f32): f32 {
  let distance=1e20;
  for(let i:u32=0;i<field.levels;i++)distance=min(distance,abs(value-fieldLevel(i)));
  return distance;
}
@fragment export function fieldFragment(v: Surface): vec4 {
  const p=vec2(v.uv.x,1-v.uv.y)*u.resolution;
  const sample=fieldSample(p);
  const magnitude=max(abs(sample.gradient.x),abs(sample.gradient.y));
  const rate=magnitude>0?magnitude*length(sample.gradient/max(magnitude,1e-30)):0;
  if(any(p<vec2(76,42))||any(p>vec2(76,42)+extent())||!sample.valid)return vec4(0);
  const tint=fieldColors(sample.value);
  const distance=nearestLevel(sample.value)/max(rate,1e-30);
  const aa=pixelWidth()*0.5;
  const coverage=field.mode==u32(1)?(rate>1e-30&&rate<3.4028234e38?1-smoothstep(max(0,field.lineWidth*0.5-aa),field.lineWidth*0.5+aa,distance):0):1;
  return vec4(tint.rgb,tint.a*field.alpha*coverage);
}
@fragment export function fieldPickFragment(v: Surface): vec4u {
  const p=query.pixel,sample=fieldSample(p);
  if(any(p<vec2(76,42))||any(p>vec2(76,42)+extent())||!sample.valid||fieldColors(sample.value).a==0){discard;}
  if(field.mode==u32(1)) {
    const magnitude=max(abs(sample.gradient.x),abs(sample.gradient.y));
    const rate=magnitude>0?magnitude*length(sample.gradient/max(magnitude,1e-30)):0;
    if(!(rate>1e-30&&rate<3.4028234e38)||nearestLevel(sample.value)/rate>query.radius+field.lineWidth*0.5){discard;}
  }
  return vec4u(query.series+u32(1),sample.index+u32(1),0,1);
}
@fragment export function colorBarFragment(v: Surface): vec4 {
  const p=vec2(v.uv.x,1-v.uv.y)*u.resolution;
  const height=min(140,u.resolution.y*0.4),lo=vec2(u.resolution.x-40,58),hi=lo+vec2(10,height);
  const fraction=clamp(1-(p.y-lo.y)/height,0,1);
  const value=mix(field.range.x,field.range.y,fraction),tint=fieldColors(value);
  const distance=boxDistance(p,lo,hi),aa=pixelWidth()*0.5;
  const coverage=(1-smoothstep(-aa,aa,distance))*tint.a;
  let layers=vec2(0);
  for(let i=0;i<3;i++) {
    const t=f32(i)*0.5,n=mix(field.range.x,field.range.y,t);
    const local=p-vec2(lo.x-5,lo.y+(1-t)*height-u.labelStyle.x*0.75);
    layers=max(layers,tickNumberLayers(local,n,(field.range.y-field.range.x)*0.5,1,u.labelStyle.x,u.labelStyle.z));
  }
  const alpha=max(coverage,layers.y);
  const ink=mix(u.background.rgb,vec3(0.2,0.26,0.34),layers.x/max(layers.y,1e-20));
  return vec4(mix(tint.rgb,ink,layers.y/max(alpha,1e-20)),alpha);
}

function textPoint(p: vec2): vec2 {
  if(text.anchor.z==0)return p;
  const c=cos(text.anchor.w),sine=sin(text.anchor.w);
  return pixelPoint(text.anchor.xy)+text.offset+vec2(c*p.x+sine*p.y,-sine*p.x+c*p.y);
}
function textLocal(p: vec2): vec2 {
  if(text.anchor.z==0)return p;
  const delta=p-pixelPoint(text.anchor.xy)-text.offset,c=cos(text.anchor.w),sine=sin(text.anchor.w);
  return vec2(c*delta.x-sine*delta.y,sine*delta.x+c*delta.y);
}
function triangleDistance(p:vec2,a:vec2,b:vec2,c:vec2):f32 {
  const ab=b-a,bc=c-b,ca=a-c,pa=p-a,pb=p-b,pc=p-c;
  const x=ab.x*pa.y-ab.y*pa.x,y=bc.x*pb.y-bc.y*pb.x,z=ca.x*pc.y-ca.y*pc.x;
  const inside=(x>=0&&y>=0&&z>=0)||(x<=0&&y<=0&&z<=0);
  const distance=min(segmentDistance(p,a,b),min(segmentDistance(p,b,c),segmentDistance(p,c,a)));
  return inside?-distance:distance;
}
@fragment export function annotationFragment(v:Surface):vec4 {
  const p=vec2(v.uv.x,1-v.uv.y)*u.resolution,target=pixelPoint(text.target);
  const localTarget=textLocal(target);
  const start=textPoint(clamp(localTarget,text.box.xy-text.box.zw,text.box.xy+text.box.zw));
  const lengthToTarget=length(target-start);
  if(lengthToTarget<1e-4)return vec4(0);
  const direction=(target-start)/lengthToTarget,normal=vec2(-direction.y,direction.x);
  const size=min(text.arrow.z,lengthToTarget*0.5),back=target-direction*size;
  const aa=pixelWidth()*0.5;
  const head=size>0?1-smoothstep(-aa,aa,triangleDistance(p,target,back+normal*size*0.4,back-normal*size*0.4)):0;
  const shaft=text.arrow.y>0?line(p,start,back,text.arrow.y*0.5):0;
  return vec4(text.color.rgb,text.color.a*max(shaft,head));
}
