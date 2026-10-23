"use typeshade";

declare const glyphAtlas: texture_2d<f32>;
class FontUniforms { pixelRatio: f32; }
declare const font: uniform<FontUniforms>;

export function pixelWidth(): f32 { return 1 / max(font.pixelRatio, 0.0001); }

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

/** Nested decimal lattices: shared ticks retain full opacity at every LOD boundary.
 * Intermediate ticks fade as a continuous function of scale, without camera lag. */
export function tickLevels(raw: f32): vec3 {
  const safe = max(raw, 1e-25);
  const unit = pow(10, floor(log2(safe) / log2(10)));
  const fine = safe < unit * 2 ? unit : unit * 2;
  const coarse = safe < unit * 2 ? unit * 2 : unit * 10;
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
