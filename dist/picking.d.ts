import type { PickEvent } from "./types.js";
type Listener<T> = (event: PickEvent<T>) => void;
/** Read back only on demand. Hover queries coalesce and stale results never emit. */
export declare class PointerPicker<T> {
    private readonly canvas;
    private readonly query;
    private readonly report;
    private readonly listeners;
    private readonly win;
    private frame;
    private busy;
    private disposed;
    private generation;
    private pending?;
    private pressed?;
    private dragged;
    constructor(canvas: HTMLCanvasElement, query: (position: readonly [number, number]) => Promise<T | null>, report: (error: unknown) => void);
    on(type: "hover" | "click", listener: Listener<T>): void;
    off(type: "hover" | "click", listener: Listener<T>): void;
    private position;
    private emit;
    private down;
    private cancel;
    private move;
    private schedule;
    private flush;
    private leave;
    private click;
    invalidate(): void;
    destroy(): void;
}
export {};
