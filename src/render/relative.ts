import type { Matrix4 } from "../transform.js";
import { invertAffineMatrix } from "../transform.js";
import type { PlotProgram } from "../types.js";
import type { UniformValues } from "./scene-field.js";

export interface RelativeFrame {
  model: Matrix4;
  inverse: Matrix4;
  base: number;
  shift: readonly number[];
}
/** All origin subtraction happens in host double precision before uniform packing. */
export function relativeFrame(
  transform: Matrix4,
  camera: UniformValues,
  origin: PlotProgram["parameterOrigin"],
): RelativeFrame {
  const world = (camera.worldCenter ?? [0, 0, 0]) as number[],
    span = camera.plotSpan as number[],
    size = camera.resolution as number[],
    lens = camera.cameraLens as number[],
    pan = camera.plotPan as number[],
    basis = camera.rotationBasis as number[];
  let base = 0;
  const shift = [0, 0, 0];
  if (origin) {
    const axis = origin.axis === "x" ? 0 : origin.axis === "y" ? 1 : 2;
    const point = (direction: boolean) => {
      const w = direction ? 0 : 1,
        amount = direction ? origin.scale : 0;
      const p = [0, 1, 2].map(
        (i) =>
          transform[axis * 4 + i] * amount +
          transform[12 + i] * w -
          world[i] * w,
      );
      const q = p.map(
        (value, i) => value / (i === 2 ? Math.max(...span) : span[i]),
      );
      const horizontal = q[0] * basis[1] + q[2] * basis[0],
        depth = -q[0] * basis[0] + q[2] * basis[1];
      const y = q[1] * basis[3] - depth * basis[2],
        z = q[1] * basis[2] + depth * basis[3];
      const distance =
        camera.view3d === 2
          ? direction
            ? -z
            : lens[1] - z
          : direction
            ? 0
            : lens[1];
      return [
        horizontal / (size[0] / size[1]) / lens[0] + (0.5 + pan[0]) * distance,
        y / lens[0] + (0.5 + pan[1]) * distance,
        distance,
      ];
    };
    const at = point(false),
      direction = point(true),
      slope = [
        direction[0] - 0.5 * direction[2],
        direction[1] - 0.5 * direction[2],
      ],
      norm = slope[0] ** 2 + slope[1] ** 2;
    const parameter =
      norm > 1e-30
        ? ((0.5 * at[2] - at[0]) * slope[0] +
            (0.5 * at[2] - at[1]) * slope[1]) /
          norm
        : 0;
    const w = at[2] + direction[2] * parameter;
    const speed =
      Math.hypot(
        (direction[0] * w - (at[0] + direction[0] * parameter) * direction[2]) *
          size[0],
        (direction[1] * w - (at[1] + direction[1] * parameter) * direction[2]) *
          size[1],
      ) / Math.max(w * w, 1e-30);
    const visible =
      speed > 1e-12
        ? Math.hypot(...size) / speed
        : Math.max(...span) / Math.abs(origin.scale);
    const bucket = 2 ** Math.floor(Math.log2(Math.max(visible / 8, 1e-12)));
    if (
      Number.isFinite(parameter) &&
      Number.isFinite(bucket) &&
      Math.abs(parameter) < 1e30
    )
      base = Math.round(parameter / bucket) * bucket;
    shift[axis] = base * origin.scale;
  }
  const model = [...transform] as unknown as number[];
  for (let i = 0; i < 3; i++)
    model[12 + i] =
      transform[12 + i] -
      world[i] +
      transform[0 + i] * shift[0] +
      transform[4 + i] * shift[1] +
      transform[8 + i] * shift[2];
  const result = model as unknown as Matrix4;
  return { model: result, inverse: invertAffineMatrix(result), base, shift };
}
export function logicalPoint(
  point: readonly number[],
  origin: PlotProgram["parameterOrigin"],
  base: number,
): readonly [number, number, number] {
  const result = [...point] as [number, number, number];
  if (origin)
    result[origin.axis === "x" ? 0 : origin.axis === "y" ? 1 : 2] +=
      base * origin.scale;
  return result;
}
