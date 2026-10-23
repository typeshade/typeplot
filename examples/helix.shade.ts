"use typeshade";

export function sample(t: f32): vec3 {
  return vec3(cos(t) * 2, sin(t), t * 0.4);
}
