/** Protect prepared resources and readbacks until their asynchronous work settles. */
export declare class WorkScope {
    private stopped;
    private readonly pending;
    private closing?;
    assertOpen(): void;
    run<T>(work: () => T | Promise<T>): Promise<T>;
    close(): Promise<void>;
}
