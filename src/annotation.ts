import type { Axes } from "./data.js";
export interface AnnotationOptions {
  readonly color?: string;
  readonly fontSize?: number;
  readonly alpha?: number;
  readonly align?: "left" | "center" | "right";
  /** Counterclockwise rotation, in radians. */
  readonly rotation?: number;
  readonly offset?: readonly [number, number];
  readonly arrow?: boolean;
  readonly lineWidth?: number;
  readonly headSize?: number;
}
export interface AnnotateOptions extends AnnotationOptions {
  readonly xyText?: readonly [number, number];
}
function point(value: readonly [number, number]): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((v) => !Number.isFinite(v) || Math.abs(v) > 3.402823466e38)
  )
    throw new RangeError("Annotation coordinates must be finite f32 pairs.");
  return [value[0], value[1]];
}
function style(value: AnnotationOptions): Required<AnnotationOptions> {
  const result = {
    color: "#334155",
    fontSize: 12,
    alpha: 1,
    align: "left" as const,
    rotation: 0,
    offset: [0, 0] as [number, number],
    arrow: false,
    lineWidth: 1,
    headSize: 6,
    ...value,
  };
  if (
    typeof result.color !== "string" ||
    !result.color.trim() ||
    !["left", "center", "right"].includes(result.align) ||
    typeof result.arrow !== "boolean"
  )
    throw new TypeError("Invalid annotation appearance.");
  for (const [key, lo, hi] of [
    ["fontSize", 6, 96],
    ["alpha", 0, 1],
    ["lineWidth", 0, 32],
    ["headSize", 0, 64],
  ] as const)
    if (!Number.isFinite(result[key]) || result[key] < lo || result[key] > hi)
      throw new RangeError(
        `Annotation ${key} must be between ${lo} and ${hi}.`,
      );
  if (!Number.isFinite(result.rotation))
    throw new RangeError("Annotation rotation must be finite.");
  result.offset = point(result.offset);
  return result;
}
/** Text and arrows are shader-generated; anchors stay in data coordinates. */
export class Annotation {
  /** @internal */
  position: [number, number];
  /** @internal */
  readonly target: [number, number];
  /** @internal */
  value: string;
  /** @internal */
  options: Required<AnnotationOptions>;
  private removed = false;
  /** @internal */
  constructor(
    readonly axes: Axes,
    value: string,
    at: readonly [number, number],
    options: AnnotationOptions = {},
    target = at,
  ) {
    this.position = point(at);
    this.target = point(target);
    this.value = label(value);
    this.options = style(options);
  }
  private alive(): void {
    this.axes.assertAlive();
    if (this.removed) throw new Error("This annotation has been removed.");
  }
  setText(value: string): this {
    this.alive();
    this.value = label(value);
    this.axes.redraw();
    return this;
  }
  setPosition(position: readonly [number, number]): this {
    this.alive();
    this.position = point(position);
    this.axes.redraw();
    return this;
  }
  set(options: AnnotationOptions): this {
    this.alive();
    this.options = style({ ...this.options, ...options });
    this.axes.redraw();
    return this;
  }
  remove(): void {
    this.alive();
    this.removed = true;
    this.axes.removeAnnotation(this);
  }
  /** @internal */
  detach(): void {
    this.removed = true;
  }
}
function label(value: string): string {
  if (typeof value !== "string" || value.length > 4096)
    throw new TypeError(
      "Annotation text must be a string of at most 4096 characters.",
    );
  return value;
}
