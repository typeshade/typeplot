"use typeshade";

/** A spatial curve just above the height field; lift also moves it behind the surface. */
export function sample(t: f32, phase: f32, lift: f32): vec3 {
  const x = t;
  const z = sin(t * 0.8) * 2;
  return vec3(x, sin(x + phase) * cos(z - phase * 0.35) + lift, z);
}
