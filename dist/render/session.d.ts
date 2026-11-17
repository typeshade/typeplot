import { type Buffer, type f32, type Frame, type Runtime } from "typeshade/runtime";
/** Own TypePlot's handles; delegate storage, pooling and execution to TypeShade. */
export declare class RenderSession {
    readonly runtime: Runtime;
    private readonly scope;
    private readonly completion;
    private readonly arrays;
    private device?;
    private preparing?;
    private retirement?;
    constructor(runtime: Runtime, win: Window);
    run<T>(work: () => T | Promise<T>): Promise<T>;
    prepareData(): Promise<void>;
    array(value: Float32Array): Buffer<f32>;
    release(handle: Buffer<f32>): void;
    present(frame: Frame): Promise<void>;
    retire(releasePlotResources: () => void | Promise<void>): Promise<void>;
}
