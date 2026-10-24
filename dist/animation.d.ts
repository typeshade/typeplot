export type Easing = "linear" | "smooth" | "easeIn" | "easeOut" | "thereAndBack" | ((progress: number) => number);
export interface AnimationClip {
    readonly duration: number;
    /** Absolute normalized time; implementations must not accumulate frame deltas. */
    sample(progress: number): void;
}
export interface TweenOptions {
    readonly duration?: number;
    readonly easing?: Easing;
}
export interface AnimationOptions extends TweenOptions {
    /** Extra cycles after the first. Infinity is supported. */
    readonly repeat?: number;
    readonly yoyo?: boolean;
    readonly reducedMotion?: boolean;
}
export interface TimelineOptions extends Omit<AnimationOptions, "duration" | "easing"> {
    readonly render?: () => void | Promise<void>;
    readonly onError?: (error: Error) => void;
    readonly window?: Window;
    readonly onStateChange?: (state: AnimationState) => void;
}
export type AnimationState = "idle" | "playing" | "paused" | "finished" | "cancelled";
export declare function ease(progress: number, easing?: Easing): number;
/** Interpolate a scalar tracker from captured endpoints, independent of frame rate. */
export declare function tween(from: number, to: number, update: (value: number) => void, options?: TweenOptions): AnimationClip;
export declare function wait(seconds: number): AnimationClip;
export declare const sequence: (...clips: readonly AnimationClip[]) => AnimationClip;
export declare const parallel: (...clips: readonly AnimationClip[]) => AnimationClip;
/** Seekable clips, shared wall-clock time and at most one awaited render in flight. */
export declare class Timeline {
    private readonly options;
    private readonly tracks;
    private readonly win?;
    private frame;
    private elapsed;
    private epoch;
    private started;
    private status;
    private renderDirty;
    private rendering;
    private complete;
    private completion;
    private completionPending;
    constructor(options?: TimelineOptions);
    private newCompletion;
    get finished(): Promise<"finished" | "cancelled">;
    get state(): AnimationState;
    private setState;
    get time(): number;
    get duration(): number;
    private get total();
    add(clip: AnimationClip, at?: number): this;
    private sample;
    private render;
    seek(seconds: number): Promise<void>;
    play(): this;
    pause(): this;
    cancel(): void;
}
/** A scalar updater shared by function parameters, camera clips or application state. */
export declare class ValueTracker {
    private value;
    private readonly listeners;
    constructor(value?: number);
    get(): number;
    set(value: number): this;
    onChange(listener: (value: number) => void): () => void;
    transition(to: number, options?: TweenOptions): AnimationClip;
}
