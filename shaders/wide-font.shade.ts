"use typeshade";
import { glyphLayers, pixelWidth, tickNumberLayers, numberWidth, numberPlate } from "./font.shade.ts";

/** Decimal scales stay in TypeShade's extended-precision type. */
function widePower(exponent: i32): f64 {
  let value = f64(1);
  for (let i = 0; i < min(abs(exponent), 32); i++) value *= 10;
  return exponent < 0 ? 1 / value : value;
}
/** Reconstruct a decimal lattice step before multiplying by a large index.
 * Widening an already-rounded f32 0.1 would preserve the wrong world phase. */
export function wideGridSpacing(step: f32): f64 {
  const exponent = i32(floor(log2(max(step,1e-30))/log2(10)));
  const multiplier = round(step/pow(10,f32(exponent)));
  return f64(multiplier)*widePower(exponent);
}
function wideDigit(value: f64, exponent: i32): i32 {
  // The mantissa is an integer. A quarter-unit guard keeps decimal division
  // away from an exact-integer floor boundary without changing any digit.
  const integer = floor((value + 0.25) / widePower(exponent));
  return i32(f32(integer - floor((integer + 0.25) / 10) * 10));
}
class WideNumberFormat {
  value: f64;
  negative: bool;
  scientific: bool;
  decimals: i32;
  digits: i32;
  exponent: i32;
  length: i32;
}

function wideNumberFormat(input: f64, spacing: f32): WideNumberFormat {
  const value = abs(input) < f64(abs(spacing) * 0.0001) ? f64(0) : input;
  let magnitude = abs(value);
  let exponent = i32(floor(log2(max(f32(magnitude), 1e-30)) / log2(10)));
  if (magnitude > 0 && magnitude < widePower(exponent)) exponent -= 1;
  if (magnitude >= widePower(exponent + 1)) exponent += 1;
  const scientific = magnitude > 0 && (exponent >= 12 || exponent < -3);
  let decimals = i32(clamp(ceil(-log2(max(abs(spacing), 1e-30)) / log2(10)), 0, 12));
  if (!scientific) decimals = min(decimals,max(0,12-exponent));
  let digits: i32 = 1;
  if (scientific) {
    decimals = i32(clamp(ceil(f32(exponent) - log2(max(abs(spacing), 1e-30)) / log2(10)), 0, 12));
    const scale = widePower(decimals);
    magnitude = floor(magnitude / widePower(exponent) * scale + 0.5);
    if (magnitude >= 10 * scale) { magnitude = scale; exponent = exponent + 1; }
  } else {
    magnitude = floor(magnitude * widePower(decimals) + 0.5);
    const integral = floor((magnitude + 0.25) / widePower(decimals));
    digits = max(1,exponent+1);
    if(integral >= widePower(digits)) digits += 1;
    if(digits>1 && integral < widePower(digits-1)) digits -= 1;
  }
  for (let i = 0; i < 13; i++) {
    if (decimals > 0 && abs(magnitude - floor((magnitude + 0.25) / 10) * 10) < 0.01) {
      magnitude = floor((magnitude + 0.25) / 10);
      decimals -= 1;
    }
  }
  const negative = value < 0;
  const length: i32 = scientific ? 5 + (decimals > 0 ? 1 + decimals : 0) + (negative ? i32(1) : i32(0)) : digits + (decimals > 0 ? 1 + decimals : 0) + (negative ? i32(1) : i32(0));
  return { value: magnitude, negative, scientific, decimals, digits, exponent, length };
}

/** Select a formatted character independently of its padded atlas cell. */
function wideNumberGlyph(n: WideNumberFormat, column: i32): i32 {
  let i = column;
  if (n.negative && i == 0) return 45;
  i = i - (n.negative ? i32(1) : i32(0));
  if (n.scientific) {
    const mantissaLength = 1 + (n.decimals > 0 ? 1 + n.decimals : 0);
    if (i < mantissaLength) {
      if (n.decimals > 0 && i == 1) return 46;
      const digit = i - (i > 1 ? i32(1) : i32(0));
      return 48 + wideDigit(n.value, n.decimals - digit);
    }
    const suffix = i - mantissaLength;
    if (suffix == 0) return 101;
    if (suffix == 1) return n.exponent < 0 ? 45 : 43;
    if (suffix == 2) return 48 + abs(n.exponent) / 10;
    return 48 + abs(n.exponent) % 10;
  }
  if (n.decimals > 0 && i == n.digits) return 46;
  const digit = i - (i > n.digits ? i32(1) : i32(0));
  return 48 + wideDigit(n.value, n.digits + n.decimals - digit - 1);
}

/** Keep full SDF padding at character boundaries, as X-GIS glyph slots do.
 * Advance locates each glyph; it must never act as a clipping rectangle. */
export function wideTickNumberLayers(p: vec2, value: f64, spacing: f32, align: f32, fontSize: f32, halo: f32): vec2 {
  if (abs(value) < f64(abs(spacing)*1024) && abs(value) < 1e5) return tickNumberLayers(p,f32(value),spacing,align,fontSize,halo);
  const n = wideNumberFormat(value, spacing);
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
      coverage = max(coverage, glyphLayers(local, wideNumberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}


export function wideNumberWidth(value: f64, spacing: f32, size: f32): f32 {
  if (abs(value) < f64(abs(spacing)*1024) && abs(value) < 1e5) return numberWidth(f32(value),spacing,size);
  return f32(wideNumberFormat(value, spacing).length) * size * 0.625;
}
export function wideNumberPlate(p: vec2, value: f64, spacing: f32, align: f32, size: f32): f32 {
  if (abs(value) < f64(abs(spacing)*1024) && abs(value) < 1e5) return numberPlate(p,f32(value),spacing,align,size);
  const width = wideNumberWidth(value, spacing, size);
  const center = vec2(width * (0.5 - align), size * 0.76);
  const half = vec2(width * 0.5 + 3.5, size * 0.55 + 2);
  const q = abs(p - center) - half + vec2(3);
  const distance = length(max(q, vec2(0))) + min(max(q.x, q.y), 0) - 3;
  const aa = pixelWidth() * 0.5;
  return 1 - smoothstep(-aa, aa, distance);
}
