"use typeshade";

class CompositeUniforms {
  size: vec2u;
  columns: u32;
  count: u32;
  css: vec2;
}
declare const composite: uniform<CompositeUniforms>;
declare const layerColor: texture_2d<f32>;
declare const layerDepth: texture_2d<f32>;
declare const backdrop: texture_2d<f32>;
class Query { pixel: vec2; radius: f32; }
declare const query: uniform<Query>;
class Vertex { @builtin("position") position: vec4; @location(0) uv: vec2; }
@vertex
export function fullscreen(@builtin("vertex_index") i: u32): Vertex {
  const x = i == 1 ? 3. : -1., y = i == 2 ? 3. : -1.;
  return {position: vec4(x, y, 0, 1), uv: vec2(x * 0.5 + 0.5, y * 0.5 + 0.5)};
}
function atlasPixel(pixel: vec2i, index: u32): vec2i {
  return pixel + vec2i(i32(index % composite.columns), i32(index / composite.columns)) * vec2i(composite.size);
}
function decodedDepth(value: vec4): f32 {
  const bytes = vec4u(round(value * 255));
  return bitcast<f32>(bytes.x | (bytes.y << u32(8)) | (bytes.z << u32(16)) | (bytes.w << u32(24)));
}
function physicalPixel(uv: vec2): vec2i {
  let pixel = clamp(vec2i(floor(uv * vec2(composite.size))), vec2i(0), vec2i(composite.size) - vec2i(1));
  // Runtime normalizes texture row order across WebGPU and WebGL2. Plot UVs
  // grow upward; rendered texture coordinates grow downward on both tiers.
  pixel.y = i32(composite.size.y) - 1 - pixel.y;
  return pixel;
}
/** Exact front-to-back compositing of the nearest hit of each mathematical field. */
@fragment
export function compose(@location(0) uv: vec2): vec4 {
  const pixel = physicalPixel(uv);
  let result = vec4(0), previous = -1e30;
  let previousIndex = i32(-1);
  for (let layer: u32 = 0; layer < composite.count; layer++) {
    let nearest = 1e30, chosen = i32(-1), ink = vec4(0);
    for (let index: u32 = 0; index < composite.count; index++) {
      const at = atlasPixel(pixel, index);
      const color = textureLoad(layerColor, at, 0);
      if (color.w <= 0) continue;
      const depth = decodedDepth(textureLoad(layerDepth, at, 0));
      const after = depth > previous || (depth == previous && i32(index) > previousIndex);
      if (after && depth < nearest) { nearest = depth; chosen = i32(index); ink = color; }
    }
    if (chosen < 0) break;
    const alpha = (1 - result.w) * ink.w;
    result = vec4(result.xyz + ink.xyz * alpha, result.w + alpha);
    if (result.w >= 1) break;
    previous = nearest;
    previousIndex = chosen;
  }
  const ground = textureLoad(backdrop, pixel, 0);
  return vec4(result.xyz + ground.xyz * (1 - result.w), 1);
}
function front(pixel: vec2i): u32 {
  let nearest = 1e30, chosen = u32(0);
  for (let index: u32 = 0; index < composite.count; index++) {
    const at = atlasPixel(pixel, index);
    if (textureLoad(layerColor, at, 0).w <= 0) continue;
    const depth = decodedDepth(textureLoad(layerDepth, at, 0));
    if (depth < nearest) { nearest = depth; chosen = index + u32(1); }
  }
  return chosen;
}
/** Select a displayed pixel first, preserving per-pixel occlusion for radius queries. */
@fragment
export function pick(): vec4u {
  const scale = vec2(composite.size) / composite.css;
  const center = query.pixel * scale;
  const at = physicalPixel(query.pixel / composite.css);
  const immediate = front(at);
  if (immediate != u32(0)) {
    const uv = vec2((f32(at.x) + 0.5) / f32(composite.size.x), 1 - (f32(at.y) + 0.5) / f32(composite.size.y));
    return vec4u(immediate, bitcast<vec2u>(uv * composite.css), 0);
  }
  const radius = vec2i(ceil(vec2(query.radius) * scale));
  let distance = query.radius + 1, chosen = u32(0), point = query.pixel;
  for (let y = -radius.y; y <= radius.y; y++) {
    for (let x = -radius.x; x <= radius.x; x++) {
      const local = (floor(center) + vec2(f32(x) + 0.5, f32(y) + 0.5)) / scale;
      const delta = length(local - query.pixel);
      if (delta > query.radius || delta >= distance || any(local < vec2(0)) || any(local >= composite.css)) continue;
      const hit = front(physicalPixel(local / composite.css));
      if (hit != u32(0)) { distance = delta; chosen = hit; point = local; }
    }
  }
  return chosen == u32(0) ? vec4u(0) : vec4u(chosen, bitcast<vec2u>(point), bitcast<u32>(distance));
}
