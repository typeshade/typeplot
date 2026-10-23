/** A reversible opacity transition; camera coordinates never pass through it. */
export declare class OpacityFade {
    private from;
    private target;
    private started;
    constructor(initial: number);
    value(now: number): number;
    set(target: number, now: number, immediate: boolean): void;
    active(now: number): boolean;
}
