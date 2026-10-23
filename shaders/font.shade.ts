"use typeshade";

declare const glyphAtlas: texture_2d<f32>;
class FontUniforms { pixelRatio: f32; }
declare const font: uniform<FontUniforms>;

export function pixelWidth(): f32 { return 1 / max(font.pixelRatio, 0.0001); }

/** Signed distance IBM Plex glyphs; no host text canvas or DOM overlay. */
export function glyphIndex(code: i32): i32 {
  if (code >= 32 && code < 256) return code - 32;
  if (code >= 880 && code < 1024) return 224 + code - 880;
  if (code >= 12592 && code < 12688) return 368 + code - 12592;
  if (code >= 44032 && code <= 55203) return 464 + code - 44032;
  if (code >= 8192 && code < 8960) return 11636 + code - 8192;
  return 12404;
}

export function glyphCoverage(p: vec2, code: i32, fontSize: f32): f32 {
  // Sample at texel centers. A distance field preserves outlines under DPR and scaling.
  const q = p * (24 / fontSize) - vec2(0.5);
  if (q.x < 0 || q.y < 0 || q.x >= 29 || q.y >= 35) return 0;
  const index = glyphIndex(code);
  const origin = vec2i((index % 132) * 30, (index / 132) * 36);
  const base = vec2i(floor(q));
  const t = fract(q);
  const a = textureLoad(glyphAtlas, origin + base, 0).r;
  const b = textureLoad(glyphAtlas, origin + base + vec2i(1, 0), 0).r;
  const c = textureLoad(glyphAtlas, origin + base + vec2i(0, 1), 0).r;
  const d = textureLoad(glyphAtlas, origin + base + vec2i(1, 1), 0).r;
  const distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y) - 0.5;
  // The host supplies only layout scale; explicit footprint also works inside tick branches.
  const width = max(1.5 / (fontSize * font.pixelRatio), 0.003);
  return smoothstep(-width, width, distance);
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

/** Tick formatting and glyph selection run on the GPU with the grid spacing. */
export function tickNumberSized(p: vec2, value: f32, spacing: f32, align: f32, fontSize: f32): f32 {
  const n = numberFormat(value, spacing);
  const advance = fontSize * 0.625;
  const offset = p + vec2(f32(n.length) * advance * align, 0);
  const column = i32(floor(offset.x / advance));
  if (column < 0 || column >= n.length || offset.y < 0 || offset.y > fontSize * 1.5) return 0;
  let i = column;
  let code: i32 = 32;
  if (n.negative && i == 0) code = 45;
  else {
    i = i - (n.negative ? i32(1) : i32(0));
    if (n.scientific) {
      if (i == 0) code = 48 + i32(floor(n.value / 10));
      else if (i == 1) code = 46;
      else if (i == 2) code = 48 + i32(n.value) % 10;
      else if (i == 3) code = 101;
      else if (i == 4) code = n.exponent < 0 ? 45 : 43;
      else if (i == 5) code = 48 + abs(n.exponent) / 10;
      else code = 48 + abs(n.exponent) % 10;
    } else if (n.decimals > 0 && i == n.digits) code = 46;
    else {
      const digit = i - (i > n.digits ? i32(1) : i32(0));
      code = 48 + i32(floor(n.value / pow(10, f32(n.digits + n.decimals - digit - 1)))) % 10;
    }
  }
  return glyphCoverage(vec2(offset.x - f32(column) * advance, offset.y), code, fontSize);
}

export function tickNumber(p: vec2, value: f32, spacing: f32, align: f32): f32 {
  return tickNumberSized(p, value, spacing, align, 11);
}
