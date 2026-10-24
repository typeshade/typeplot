import type {
  AxesOptions,
  SeriesOptions,
  SeriesKind,
  SeriesData,
} from "../data.js";
import type { FieldStyle, FieldKind } from "../field.js";
import type { Annotation } from "../annotation.js";

/** Small values describe one frame; numeric arrays retain their data-version identity. */
export interface SeriesSnapshot {
  /** Stable logical identity; descriptors themselves are new for each frame. */
  readonly key: object;
  readonly kind: SeriesKind;
  readonly data: SeriesData;
  readonly style: Required<SeriesOptions> & { width: number };
  readonly edges?: readonly number[];
}
export interface AxesSnapshot {
  readonly bounds: {
    x: readonly [number, number];
    y: readonly [number, number];
  };
  readonly settings: AxesOptions;
  readonly gridOpacity: number;
  readonly series: readonly SeriesSnapshot[];
  readonly fields: readonly FieldSnapshot[];
  readonly annotations: readonly Pick<
    Annotation,
    "value" | "position" | "target" | "options"
  >[];
  readonly focused: boolean;
}
export interface FieldSnapshot {
  readonly key: object;
  readonly values: readonly number[];
  readonly options: FieldStyle;
  readonly mode: FieldKind;
}
export interface FigureSnapshot {
  readonly width: number;
  readonly height: number;
  readonly rows: number;
  readonly cols: number;
  readonly title?: string;
  readonly titleHeight?: number;
  readonly background?: string;
  readonly axes: readonly AxesSnapshot[];
}
