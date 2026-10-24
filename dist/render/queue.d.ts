/** Coalesce host render requests. TypeShade retains its own command/kernel queues. */
export declare class RenderQueue {
    private readonly draw;
    private dirty;
    private stopped;
    private running?;
    constructor(draw: () => void | Promise<void>);
    get pending(): boolean;
    get busy(): boolean;
    invalidate(): void;
    idle(): Promise<void>;
    flush(invalidate?: boolean): Promise<void>;
    stop(): Promise<void>;
}
/** A canvas host's invalidation policy, separate from animation time and GPU execution. */
export declare class FrameScheduler {
    private readonly win;
    private readonly report;
    private readonly continuing?;
    private readonly queue;
    private frame;
    private stopped;
    constructor(win: Window, draw: () => void | Promise<void>, report: (error: unknown) => void, continuing?: (() => boolean) | undefined);
    get pending(): boolean;
    get busy(): boolean;
    readonly request: () => void;
    private drain;
    private cancelScheduled;
    flush(): Promise<void>;
    current(): Promise<void>;
    stop(): Promise<void>;
}
