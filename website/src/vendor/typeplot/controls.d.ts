import type { Plot } from "./types.js";
export type ControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface PlotControl {
    onAdd(plot: Plot): HTMLElement;
    onRemove(plot: Plot): void;
    /** Called after the view or layout changes. */
    onUpdate?(plot: Plot): void;
}
/** HTML controls are interaction UI; chart fields and export remain GPU-rendered. */
export declare class PlotControlHost {
    private readonly canvas;
    private readonly plot;
    private root?;
    private readonly entries;
    private observer?;
    private originalPosition?;
    private parent?;
    constructor(canvas: HTMLCanvasElement, plot: Plot);
    container(): HTMLElement;
    add(control: PlotControl, position?: ControlPosition): void;
    remove(control: PlotControl): void;
    update(): void;
    private clear;
    destroy(): void;
}
/** Map-style camera controls. Attach with plot.addControl(new ViewControl()). */
export declare class ViewControl implements PlotControl {
    private readonly options;
    private element?;
    private buttons;
    private projection?;
    constructor(options?: {
        language?: "en" | "ko";
        onChange?: (view: {
            mode: "2d" | "3d";
            projection: "perspective" | "orthographic";
        }) => void;
    });
    onAdd(plot: Plot): HTMLElement;
    onUpdate(plot: Plot): void;
    onRemove(): void;
}
