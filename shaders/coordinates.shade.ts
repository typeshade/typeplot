"use typeshade";
import { PlotUniforms, ViewRay, axisLabel, plotSize, distanceCoverage, cameraVector, homogeneous, inverseCamera, viewRay, project, surfaceColorBar } from "./plot.shade.ts";
import { wideTickNumberLayers, wideNumberWidth, wideNumberPlate } from "./wide-font.shade.ts";
import { tickLevels, tickOpacity, coarseTickOpacity, tickMark, pixelWidth } from "./font.shade.ts";
class CoordinateUniforms extends PlotUniforms { axesOrigin: vec3f64; }
declare const u: uniform<CoordinateUniforms>;
declare const spatialLabels: texture_2d<u32>;
function loadLabels(at:vec2i):vec4{return bitcast<vec4>(textureLoad(spatialLabels,at,0));}
class SpatialDecor { color: vec3; labels: vec3; }
function axisBase(axis: vec3, u: CoordinateUniforms): f64 {
  return u.axesOrigin.x * f64(axis.x) + u.axesOrigin.y * f64(axis.y) + u.axesOrigin.z * f64(axis.z);
}

function axisOriginH(axis: vec3, u: CoordinateUniforms): vec3 {
  const local = vec3(f32(-u.axesOrigin.x) * (1 - axis.x), f32(-u.axesOrigin.y) * (1 - axis.y), f32(-u.axesOrigin.z) * (1 - axis.z));
  const camera = cameraVector(local, u), size = plotSize(u.resolution);
  const w = u.view3d == u32(2) ? u.cameraLens.y - camera.z : u.cameraLens.y;
  return vec3((vec2(camera.x / (size.x / size.y), camera.y) / u.cameraLens.x + (vec2(0.5) + u.plotPan) * w) * size, w);
}

function axisH(value: f32, axis: vec3, u: CoordinateUniforms): vec3 {
  return axisOriginH(axis, u) + homogeneous(axis, u, true) * value;
}

function projectAxis(value: f32, axis: vec3, u: CoordinateUniforms): vec2 {
  const at = axisH(value, axis, u); return at.xy / max(at.z, 0.101);
}

function axisVisible(value: f32, axis: vec3, u: CoordinateUniforms): bool {
  return u.view3d != u32(2) || axisH(value, axis, u).z >= 0.101;
}

function wideWeight(value: f64, levels: vec3, coarse: bool): f32 {
  const multiple = value / f64(coarse ? levels.x : levels.y);
  const shared = abs(multiple - floor(multiple + 0.5)) < 0.001;
  return shared ? 1 : (coarse ? 1 - levels.z : levels.z);
}

function wideNumberAt(pixel: vec2, anchor: vec2, value: f64, spacing: f32, align: f32, size: f32, halo: f32, plate: f32): vec3 {
  const delta = vec2(pixel.x - anchor.x, anchor.y - pixel.y);
  if (delta.y < 0 || delta.y > size * 1.5 || abs(delta.x) > size * 16) return vec3(0);
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), wideNumberPlate(delta, value, spacing, align, size) * plate);
}

function axisField(pixel: vec2, axis: vec3, ray: ViewRay, u: CoordinateUniforms): f32 {
  const origin = axisOriginH(axis, u);
  const direction = homogeneous(axis, u, true);
  const coefficients = cross(origin, direction);
  const magnitude = length(coefficients.xy);
  let distance = length(pixel - project(vec3(0), u));
  if (magnitude > 1e-12) distance = abs(dot(coefficients, vec3(pixel, 1))) / magnitude;
  return axisVisible(axisParameter(pixel, axis, u), axis, u) ? distanceCoverage(distance, u.appearance.x) : 0;
}

function groundFieldNarrow(ray: ViewRay, u: CoordinateUniforms, xLevels: vec3, zLevels: vec3): f32 {
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

function groundField(uv: vec2, ray: ViewRay, u: CoordinateUniforms, xLevels: vec3, zLevels: vec3): f32 {
  if (max(max(abs(u.axesOrigin.x),abs(u.axesOrigin.y)),abs(u.axesOrigin.z)) < f64(min(xLevels.x,zLevels.x)*1024)) return groundFieldNarrow(ray,u,xLevels,zLevels);
  const screen = uv - vec2(0.5) - u.plotPan, size = plotSize(u.resolution);
  const xy = vec2(screen.x * (size.x / size.y), screen.y) * u.cameraLens.x;
  const eye = u.view3d == u32(2) ? vec3(0, 0, u.cameraLens.y) : vec3(xy * u.cameraLens.y, u.cameraLens.y);
  const offset = inverseCamera(eye, u);
  const denominator = abs(ray.direction.y) < 1e-8 ? (ray.direction.y < 0 ? -1e-8 : 1e-8) : ray.direction.y;
  const depth = -(u.axesOrigin.y + f64(offset.y)) / f64(denominator);
  const gx = u.axesOrigin.x + f64(offset.x) + f64(ray.direction.x) * depth;
  const gz = u.axesOrigin.z + f64(offset.z) + f64(ray.direction.z) * depth;
  const high = vec2(f32(gx), f32(gz)), low = vec2(f32(gx - f64(high.x)), f32(gz - f64(high.y)));
  const dx = dpdx(high) + dpdx(low), dy = dpdy(high) + dpdy(low);
  const gradient = max(vec2(length(vec2(dx.x,dy.x)),length(vec2(dx.y,dy.y))),vec2(1e-20));
  let field = 0;
  for (let level = 0; level < 2; level++) {
    const spacing = level == 0 ? vec2(xLevels.x,zLevels.x) : vec2(xLevels.y,zLevels.y);
    const sx = f64(spacing.x), sz = f64(spacing.y);
    const phase = vec2(f32(fract(gx / sx + 0.5)),f32(fract(gz / sz + 0.5))) - 0.5;
    const distance = abs(phase) * spacing / gradient * pixelWidth();
    const separation = spacing / gradient * pixelWidth();
    const density = clamp(u.labelStyle.x, 0.5, 2);
    const fade = smoothstep(vec2(12 / density),vec2(28 / density),separation);
    const nx = floor(gx / sx + 0.5) * sx, nz = floor(gz / sz + 0.5) * sz;
    const weights = vec2(wideWeight(nx,xLevels,level != 0),wideWeight(nz,zLevels,level != 0));
    field = max(field,max(distanceCoverage(distance.x,u.appearance.y)*fade.x*weights.x,distanceCoverage(distance.y,u.appearance.y)*fade.y*weights.y));
  }
  return (u.view3d != u32(2) || depth >= 0.101) && abs(ray.direction.y) >= 1e-8 && (u.decorations & u32(1)) != u32(0) ? field * u.decorationOpacity.x : 0;
}

function axisParameter(pixel: vec2, axis: vec3, u: CoordinateUniforms): f32 {
  const origin = axisOriginH(axis, u);
  const direction = homogeneous(axis, u, true);
  const line = cross(origin, direction);
  const foot = pixel - line.xy * dot(line, vec3(pixel, 1)) / max(dot(line.xy, line.xy), 1e-20);
  const slope = direction.xy - foot * direction.z;
  return dot(foot * origin.z - origin.xy, slope) / max(dot(slope, slope), 1e-20);
}

function spatialLevels(axis: vec3, u: CoordinateUniforms): vec3 {
  const center = axisParameter(plotSize(u.resolution) * 0.5, axis, u);
  const span = max(u.plotSpan.x, u.plotSpan.y);
  const at = axisH(center, axis, u), direction = homogeneous(axis, u, true);
  const tangent = (direction.xy * at.z - at.xy * direction.z) / max(at.z * at.z, 1e-20);
  const pixels = max(length(tangent) * span, 1);
  const horizontal = abs(tangent.x) >= abs(tangent.y) * 0.7;
  const absolute = axisBase(axis,u) + f64(center);
  const rough = span * u.appearance.w * 4 / pixels;
  const width = max(wideNumberWidth(absolute - f64(span*0.5),rough,u.appearance.w),wideNumberWidth(absolute + f64(span*0.5),rough,u.appearance.w));
  const gap = horizontal ? max(u.appearance.w * 3.5,width + u.appearance.w * 1.3) : u.appearance.w * 2.6;
  return tickLevels(span * gap / max(pixels*u.labelStyle.x,1));
}

function prepareSpatialLabels(position: vec4, u: CoordinateUniforms): vec4 {
  const row = i32(position.y), column = i32(position.x);
  const size = plotSize(u.resolution);
  if (row >= 36) {
    if (column >= 3) return vec4(0);
    const axis = column == 0 ? vec3(1, 0, 0) : column == 1 ? vec3(0, 1, 0) : vec3(0, 0, 1);
    if (row == 37) return vec4(spatialLevels(axis, u), 1);
    const edge = column == 1 ? vec2(size.x * 0.5, size.y - 30) : vec2(size.x - 30, size.y * 0.5);
    const t = axisParameter(edge,axis,u);
    const at = clamp(projectAxis(t,axis,u) + vec2(10, 18), vec2(18), size - vec2(18));
    return vec4(at, f32(120 + column), axisVisible(t,axis,u) ? 1 : 0);
  }
  const axisIndex = row / 12, candidate = (row / 2) % 6;
  const axis = axisIndex == 0 ? vec3(1, 0, 0) : axisIndex == 1 ? vec3(0, 1, 0) : vec3(0, 0, 1);
  const originH = axisOriginH(axis, u);
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
  const absolute = axisBase(axis,u) + f64(axisParameter(foot,axis,u));
  const number = (floor(absolute / f64(stride) + 0.5) + f64(f32(candidate % 3 - 1))) * f64(stride);
  const t = f32(number - axisBase(axis,u));
  if (!axisVisible(t,axis,u)) return vec4(0);
  const at = projectAxis(t,axis,u);
  const fontSize = u.appearance.w;
  const sign = axis.y > 0 ? (normal.x > 0 ? -1 : 1) : (normal.y > 0 ? -1 : 1);
  const outward = normal * sign;
  if (row % 2 == 0) return vec4(at, outward);
  const anchor = at + outward * (fontSize * 0.95 + 6) + vec2(0, fontSize * 0.65);
  const width = wideNumberWidth(number, levels.x, fontSize);
  const before = projectAxis(t - stride,axis,u), after = projectAxis(t + stride,axis,u);
  const separation = min(abs(at - before), abs(after - at));
  const box = vec2(width + fontSize, fontSize * 1.8 + 6);
  const fit = smoothstep(0.85, 1.15, max(separation.x / box.x, separation.y / box.y));
  const visibility = (candidate < 3 ? wideWeight(number,levels,false) : wideWeight(number,levels,true)) * fit;
  const room = min(min(anchor.x - width * 0.5 - 3, size.x - anchor.x - width * 0.5 - 3), min(anchor.y - fontSize * 1.5, size.y - anchor.y));
  const zero = abs(number) <= f64(levels.x * 0.001);
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

function cachedSpatialTicks(pixel: vec2, axis: vec3, index: i32, u: CoordinateUniforms): vec4 {
  const size = plotSize(u.resolution), fontSize = u.appearance.w;
  const axisLine = cross(axisOriginH(axis, u), homogeneous(axis, u, true));
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
    const location = loadLabels(vec2i(column,row));
    const at = location.xy, outward = location.zw;
    const anchor = at + outward * (fontSize * 0.95 + 6) + vec2(0, fontSize * 0.65);
    const delta = pixel - anchor;
    const nearLabel = (u.decorations & u32(2)) != u32(0) && abs(delta.x) <= fontSize * 9 && delta.y >= -fontSize * 1.5 - 3 - pixelWidth() && delta.y <= 3 + pixelWidth();
    const nearTick = u.appearance.x > 0 && all(abs(pixel - at) <= vec2(u.appearance.x * 0.5 + 4 + pixelWidth()));
    if (!nearLabel && !nearTick) continue;
    const style = loadLabels(vec2i(column,row+1));
    if (nearTick && style.z > 0) ticks = max(ticks, tickMark(pixel, at, tangent, 3, u.appearance.x) * style.z);
    if (nearLabel && style.w > 0) labels = max(labels, wideNumberAt(pixel, anchor, axisBase(axis,u) + f64(style.x), style.y, 0.5, fontSize, u.labelStyle.y, u.labelStyle.z) * style.w * u.decorationOpacity.y);
  }
  return vec4(ticks, labels);
}

function cachedSpatialBackground(uv: vec2, u: CoordinateUniforms): SpatialDecor {
  const size = plotSize(u.resolution), pixel = uv * size;
  const ray = viewRay(uv, u);
  const xLevels = loadLabels(vec2i(0,37)).xyz;
  const zLevels = loadLabels(vec2i(2,37)).xyz;
  const grid = groundField(uv, ray, u, xLevels, zLevels);
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
      const name = loadLabels(vec2i(index,36));
      if (name.w > 0) labels = max(labels, axisLabel(pixel, name.xy, i32(name.z), u) * u.decorationOpacity.z);
    }
  }
  return { color: mix(vec3(0.965, 0.973, 0.985), color, u.sceneOpacity.x), labels: labels * u.sceneOpacity.x };
}

class VertexOutput { @builtin("position") position:vec4; @location(0) uv:vec2; }
@vertex export function fullscreen(@builtin("vertex_index") i:u32):VertexOutput {
 const x=i==1?3.:-1.,y=i==2?3.:-1.;return{position:vec4(x,y,0,1),uv:vec2(x*.5+.5,y*.5+.5)};
}
@fragment export function buildSpatialLabels(@builtin("position") position:vec4):vec4u { return bitcast<vec4u>(prepareSpatialLabels(position,u)); }
@fragment export function drawBackdrop(@location(0) uv:vec2):vec4 {return vec4(cachedSpatialBackground(uv,u).color,1);}
function labels(uv:vec2,surface:bool):vec4 {
 const decor=cachedSpatialBackground(uv,u);
 let black=labelColorWide(vec3(0),decor.labels),white=labelColorWide(vec3(1),decor.labels);
 if(surface){black=mix(black,surfaceColorBar(black,uv,u),u.sceneOpacity.y);white=mix(white,surfaceColorBar(white,uv,u),u.sceneOpacity.y);}
 const alpha=clamp(1-(white.x-black.x),0,1);return vec4(alpha>0?black/alpha:vec3(0),alpha);
}
function labelColorWide(color:vec3,layers:vec3):vec3 {
 const plated=mix(color,vec3(.995),layers.z*.94);return mix(mix(plated,vec3(.965,.973,.985),layers.y),vec3(.25,.29,.35),layers.x);
}
@fragment export function drawLabels(@location(0) uv:vec2):vec4{return labels(uv,false);}
@fragment export function drawSurfaceLabels(@location(0) uv:vec2):vec4{return labels(uv,true);}
