"use typeshade";

/** Resolve the large phase once, before narrowing to the local SDF frame. */
export function prepare(origin: f64): vec4 {
  return vec4(f32(cos(origin)), f32(sin(origin)), 0, 0);
}
export function sample(t: f32, origin: vec4): vec3 {
  const c = cos(t),
    s = sin(t);
  return vec3(
    (c * origin.x - s * origin.y) * 2,
    s * origin.x + c * origin.y,
    t * 0.4,
  );
}
