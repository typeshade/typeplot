"use typeshade";
/** A time-varying height field. Second coordinate is z; TypePlot uses y-up. */
export function sample(x: f32, z: f32, phase: f32, amplitude: f32): f32 {
  return amplitude * sin(x + phase) * cos(z - phase * 0.35);
}
