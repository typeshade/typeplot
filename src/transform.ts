/** Column-major affine matrix, matching TypeShade's mat4 uniforms. */
export type Matrix4 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
export const identityMatrix = (): Matrix4 => [
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
];

export function multiplyMatrices(a: Matrix4, b: Matrix4): Matrix4 {
  const result = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column++)
    for (let row = 0; row < 4; row++)
      for (let k = 0; k < 4; k++)
        result[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
  return result as unknown as Matrix4;
}
export function translationMatrix(x: number, y = 0, z = 0): Matrix4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}
export function scaleMatrix(x: number, y = x, z = x): Matrix4 {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
}
/** Axis-angle rotation in radians; the axis need not be normalized. */
export function rotationMatrix(
  angle: number,
  axis: readonly [number, number, number] = [0, 1, 0],
): Matrix4 {
  const length = Math.hypot(...axis);
  if (!(length > 0) || !Number.isFinite(length) || !Number.isFinite(angle))
    throw new RangeError(
      "Rotation needs a finite angle and a nonzero finite axis.",
    );
  const [x, y, z] = axis.map((value) => value / length);
  const c = Math.cos(angle),
    s = Math.sin(angle),
    d = 1 - c;
  return [
    c + x * x * d,
    y * x * d + z * s,
    z * x * d - y * s,
    0,
    x * y * d - z * s,
    c + y * y * d,
    z * y * d + x * s,
    0,
    x * z * d + y * s,
    y * z * d - x * s,
    c + z * z * d,
    0,
    0,
    0,
    0,
    1,
  ];
}
/** Validate before changing state, including the inverse supplied to GPU rays. */
export function invertAffineMatrix(value: Matrix4): Matrix4 {
  if (
    !value ||
    value.length !== 16 ||
    Array.from(value).some(
      (v) => !Number.isFinite(v) || Math.abs(v) > 3.402823466e38,
    )
  )
    throw new RangeError("transform needs sixteen finite f32 values.");
  if (value[3] !== 0 || value[7] !== 0 || value[11] !== 0 || value[15] !== 1)
    throw new TypeError(
      "transform must be affine, with last row [0, 0, 0, 1].",
    );
  const rows = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) =>
      c < 4 ? value[c * 4 + r] : +(c - 4 === r),
    ),
  );
  for (let col = 0; col < 4; col++) {
    let pivot = col;
    for (let row = col + 1; row < 4; row++)
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
    if (rows[pivot][col] === 0)
      throw new RangeError("transform must be invertible.");
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const divisor = rows[col][col];
    rows[col] = rows[col].map((v) => v / divisor);
    for (let row = 0; row < 4; row++)
      if (row !== col) {
        const factor = rows[row][col];
        rows[row] = rows[row].map((v, k) => v - factor * rows[col][k]);
      }
  }
  const result = Array.from(
    { length: 16 },
    (_, i) => rows[i % 4][4 + Math.floor(i / 4)],
  );
  if (result.some((v) => !Number.isFinite(v) || Math.abs(v) > 3.402823466e38))
    throw new RangeError("transform inverse exceeds finite f32 precision.");
  return result as unknown as Matrix4;
}

/** QR factors preserve shear; quaternion interpolation keeps rotations invertible. */
export function matrixInterpolator(
  from: Matrix4,
  to: Matrix4,
): (progress: number) => Matrix4 {
  from = [...from];
  to = [...to];
  const dot = (a: number[], b: number[]) =>
    a.reduce((n, v, i) => n + v * b[i], 0);
  const decompose = (m: Matrix4) => {
    invertAffineMatrix(m);
    const x = [m[0], m[1], m[2]],
      y = [m[4], m[5], m[6]],
      z = [m[8], m[9], m[10]];
    const sx = Math.hypot(...x),
      a = x.map((v) => v / sx);
    const xy = dot(a, y),
      rest = y.map((v, i) => v - a[i] * xy),
      sy = Math.hypot(...rest),
      b = rest.map((v) => v / sy);
    const c = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    const sz = dot(c, z),
      xz = dot(a, z),
      yz = dot(b, z);
    const trace = a[0] + b[1] + c[2];
    let q: number[];
    if (trace > 0) {
      const s = Math.sqrt(trace + 1) * 2;
      q = [(b[2] - c[1]) / s, (c[0] - a[2]) / s, (a[1] - b[0]) / s, s / 4];
    } else if (a[0] > b[1] && a[0] > c[2]) {
      const s = Math.sqrt(1 + a[0] - b[1] - c[2]) * 2;
      q = [s / 4, (b[0] + a[1]) / s, (c[0] + a[2]) / s, (b[2] - c[1]) / s];
    } else if (b[1] > c[2]) {
      const s = Math.sqrt(1 + b[1] - a[0] - c[2]) * 2;
      q = [(b[0] + a[1]) / s, s / 4, (c[1] + b[2]) / s, (c[0] - a[2]) / s];
    } else {
      const s = Math.sqrt(1 + c[2] - a[0] - b[1]) * 2;
      q = [(c[0] + a[2]) / s, (c[1] + b[2]) / s, s / 4, (a[1] - b[0]) / s];
    }
    return { q, coefficients: [sx, sy, sz, xy, xz, yz, m[12], m[13], m[14]] };
  };
  const a = decompose(from),
    b = decompose(to);
  if (Math.sign(a.coefficients[2]) !== Math.sign(b.coefficients[2]))
    throw new RangeError(
      "A transform animation cannot cross a singular reflection; keep determinant signs equal.",
    );
  let cosine = dot(a.q, b.q);
  if (cosine < 0) {
    b.q = b.q.map((v) => -v);
    cosine = -cosine;
  }
  cosine = Math.min(1, cosine);
  return (progress) => {
    if (progress === 0) return [...from];
    if (progress === 1) return [...to];
    const theta = Math.acos(cosine),
      sine = Math.sin(theta);
    const wa =
      cosine > 0.9995 ? 1 - progress : Math.sin((1 - progress) * theta) / sine;
    const wb = cosine > 0.9995 ? progress : Math.sin(progress * theta) / sine;
    const values = a.q.map((v, i) => v * wa + b.q[i] * wb),
      norm = Math.hypot(...values);
    const [x, y, z, w] = values.map((v) => v / norm);
    const r0 = [
      1 - 2 * (y * y + z * z),
      2 * (x * y + z * w),
      2 * (x * z - y * w),
    ];
    const r1 = [
      2 * (x * y - z * w),
      1 - 2 * (x * x + z * z),
      2 * (y * z + x * w),
    ];
    const r2 = [
      2 * (x * z + y * w),
      2 * (y * z - x * w),
      1 - 2 * (x * x + y * y),
    ];
    const [sx, sy, sz, xy, xz, yz, tx, ty, tz] = a.coefficients.map(
      (v, i) => v + (b.coefficients[i] - v) * progress,
    );
    return [
      r0[0] * sx,
      r0[1] * sx,
      r0[2] * sx,
      0,
      r0[0] * xy + r1[0] * sy,
      r0[1] * xy + r1[1] * sy,
      r0[2] * xy + r1[2] * sy,
      0,
      r0[0] * xz + r1[0] * yz + r2[0] * sz,
      r0[1] * xz + r1[1] * yz + r2[1] * sz,
      r0[2] * xz + r1[2] * yz + r2[2] * sz,
      0,
      tx,
      ty,
      tz,
      1,
    ];
  };
}
