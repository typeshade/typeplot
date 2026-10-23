export interface PlotBounds {
    x: readonly [number, number];
    y: readonly [number, number];
}
type Pair = [number, number];
/** Supplies plot uniforms and requests a redraw only while the view changes. */
export declare function createPlotInteraction(canvas: HTMLCanvasElement, initialBounds: PlotBounds, onChange: () => void, enabled?: boolean, viewport?: () => Pick<DOMRect, "left" | "top" | "width" | "height">): {
    value(field: string): readonly number[] | null;
    setMode(enabled: boolean): void;
    reset: () => void;
    /** Replace the home view and display it immediately. */
    setBounds(bounds: PlotBounds): void;
    bounds(): {
        x: Pair;
        y: Pair;
    };
    destroy(): void;
};
export {};
