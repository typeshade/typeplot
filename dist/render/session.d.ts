import { type Frame, type Resident, type Runtime } from "typeshade/runtime";
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
    array<T>(value: T): Resident<T>;
    release(handle: Resident<unknown>): void;
    present(frame: Frame): Promise<void>;
    retire(releasePlotResources: () => void): Promise<void>;
}
