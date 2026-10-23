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

export function glyphCoverage(p: vec2, code: i32, fontSize: f32): f32 {
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
  if (q.x < 0 || q.y < 0 || q.x >= cell.x - 1 || q.y >= cell.y - 1) return 0;
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
  return smoothstep(edge - width, edge + width, distance);
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
    magnitude = floor(magnitude / pow(10, f32(exponent)) * 10 + 0.5);
    if (magnitude >= 100) { magnitude = 10; exponent = exponent + 1; }
    decimals = 1;
  } else {
    magnitude = floor(magnitude * pow(10, f32(decimals)) + 0.5);
    digits = i32(floor(log2(max(floor(magnitude / pow(10, f32(decimals))), 1)) / log2(10))) + 1;
  }
  const negative = value < 0;
  const length: i32 = scientific ? 7 + (negative ? i32(1) : i32(0)) : digits + (decimals > 0 ? 1 + decimals : 0) + (negative ? i32(1) : i32(0));
  return { value: magnitude, negative, scientific, decimals, digits, exponent, length };
}

/** Select a formatted character independently of its padded atlas cell. */
function numberGlyph(n: NumberFormat, column: i32): i32 {
  let i = column;
  if (n.negative && i == 0) return 45;
  i = i - (n.negative ? i32(1) : i32(0));
  if (n.scientific) {
    if (i == 0) return 48 + i32(floor(n.value / 10));
    if (i == 1) return 46;
    if (i == 2) return 48 + i32(n.value) % 10;
    if (i == 3) return 101;
    if (i == 4) return n.exponent < 0 ? 45 : 43;
    if (i == 5) return 48 + abs(n.exponent) / 10;
    return 48 + abs(n.exponent) % 10;
  }
  if (n.decimals > 0 && i == n.digits) return 46;
  const digit = i - (i > n.digits ? i32(1) : i32(0));
  return 48 + i32(floor(n.value / pow(10, f32(n.digits + n.decimals - digit - 1)))) % 10;
}

/** Keep full SDF padding at character boundaries, as X-GIS glyph slots do.
 * Advance locates each glyph; it must never act as a clipping rectangle. */
export function tickNumberSized(p: vec2, value: f32, spacing: f32, align: f32, fontSize: f32): f32 {
  const n = numberFormat(value, spacing);
  const advance = fontSize * 0.625;
  const offset = p + vec2(f32(n.length) * advance * align, 0);
  if (offset.y < 0 || offset.y > fontSize * 1.5) return 0;
  const column = i32(floor(offset.x / advance));
  const atlasBearing = fontSize * (3 / 24);
  let coverage = 0;
  for (let neighbor = -1; neighbor <= 1; neighbor++) {
    const index = column + neighbor;
    if (index >= 0 && index < n.length) {
      const local = vec2(offset.x - f32(index) * advance + atlasBearing, offset.y);
      coverage = max(coverage, glyphCoverage(local, numberGlyph(n, index), fontSize));
    }
  }
  return coverage;
}

export function tickNumber(p: vec2, value: f32, spacing: f32, align: f32): f32 {
  return tickNumberSized(p, value, spacing, align, 11);
}
