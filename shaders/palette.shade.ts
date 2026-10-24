"use typeshade";

/** Compact linear color-map anchors, evaluated on the GPU. */
export function colorMap(value: f32, palette: u32): vec3 {
  const t = clamp(value, 0, 1);
  if (palette == u32(3)) return vec3(t);
  if (palette == u32(2)) return t < 0.5 ? mix(vec3(0.23, 0.30, 0.75), vec3(0.87), t * 2) : mix(vec3(0.87), vec3(0.71, 0.02, 0.15), t * 2 - 1);
  let a = vec3(0.267, 0.005, 0.329), b = vec3(0.230, 0.322, 0.546), c = vec3(0.128, 0.567, 0.551), d = vec3(0.369, 0.789, 0.383), e = vec3(0.993, 0.906, 0.144);
  if (palette == u32(1)) {a = vec3(0.050, 0.030, 0.528); b = vec3(0.495, 0.012, 0.658); c = vec3(0.798, 0.280, 0.470); d = vec3(0.973, 0.586, 0.252); e = vec3(0.940, 0.975, 0.131);}
  if (t < 0.25) return mix(a, b, t * 4);
  if (t < 0.5) return mix(b, c, t * 4 - 1);
  if (t < 0.75) return mix(c, d, t * 4 - 2);
  return mix(d, e, t * 4 - 3);
}
