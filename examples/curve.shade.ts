"use typeshade";

export function sample(x: f32, exponent: f32): f32 {
  if (x < 0) {
    return 1e20;
  }
  return pow(x, exponent);
}
