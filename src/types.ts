export type PlotKind = "scalar" | "parametric";
export interface PlotBounds {
  readonly x: readonly [number, number];
  readonly y: readonly [number, number];
}
/** Serializable build output. The TypeShade manifest is opaque to callers. */
export interface PlotProgram {
  readonly version: 1;
  readonly kind: PlotKind;
  readonly manifest: unknown;
  readonly parameters: Readonly<Record<string, number>>;
}
export interface PlotOptions {
  /** Accessible canvas name. Existing aria-label/aria-labelledby are preserved unless supplied. */
  readonly label?: string;
  readonly bounds?: PlotBounds;
  readonly backend?: "auto" | "webgpu" | "webgl2";
  readonly mode?: "2d" | "3d";
  readonly probe?: number;
  readonly parameters?: Readonly<Record<string, number>>;
  readonly pixelRatio?: number;
  readonly interactive?: boolean;
  readonly onError?: (error: Error) => void;
}
export interface Plot {
  readonly backend: "webgpu" | "webgl2";
  setMode(mode: "2d" | "3d"): void;
  setProbe(value: number): void;
  setParameters(values: Readonly<Record<string, number>>): void;
  bounds(): PlotBounds;
  reset(): void;
  redraw(): Promise<void>;
  destroy(): void;
}
