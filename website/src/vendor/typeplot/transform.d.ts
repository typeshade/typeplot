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
    number
];
export declare const identityMatrix: () => Matrix4;
export declare function multiplyMatrices(a: Matrix4, b: Matrix4): Matrix4;
export declare function translationMatrix(x: number, y?: number, z?: number): Matrix4;
export declare function scaleMatrix(x: number, y?: number, z?: number): Matrix4;
/** Axis-angle rotation in radians; the axis need not be normalized. */
export declare function rotationMatrix(angle: number, axis?: readonly [number, number, number]): Matrix4;
/** Validate before changing state, including the inverse supplied to GPU rays. */
export declare function invertAffineMatrix(value: Matrix4): Matrix4;
/** QR factors preserve shear; quaternion interpolation keeps rotations invertible. */
export declare function matrixInterpolator(from: Matrix4, to: Matrix4): (progress: number) => Matrix4;
