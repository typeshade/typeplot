/** Keep at most one display frame in flight on WebGL2. Runtime's WebGPU submit
 * already waits for device completion; its WebGL submit records commands only. */
export declare class GpuCompletion {
    private readonly win;
    private readonly gl?;
    private stopped;
    private readonly pending;
    constructor(win: Window, gl?: WebGL2RenderingContext | undefined);
    wait(): Promise<void>;
    destroy(): void;
}
