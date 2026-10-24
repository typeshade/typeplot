import { RenderQueue } from "./render/queue.js";
export type Easing =
  | "linear"
  | "smooth"
  | "easeIn"
  | "easeOut"
  | "thereAndBack"
  | ((progress: number) => number);
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
export interface TimelineOptions extends Omit<
  AnimationOptions,
  "duration" | "easing"
> {
  readonly render?: () => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly window?: Window;
  readonly onStateChange?: (state: AnimationState) => void;
}
export type AnimationState =
  "idle" | "playing" | "paused" | "finished" | "cancelled";
const clamp = (value: number) => Math.min(1, Math.max(0, value));
function duration(value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError("Animation duration must be finite and nonnegative.");
  return value;
}
export function ease(progress: number, easing: Easing = "smooth"): number {
  const t = clamp(progress);
  if (typeof easing === "function") {
    const value = easing(t);
    if (!Number.isFinite(value))
      throw new RangeError("Easing must return a finite value.");
    return value;
  }
  switch (easing) {
    case "linear":
      return t;
    case "smooth":
      return t * t * (3 - 2 * t);
    case "easeIn":
      return t * t * t;
    case "easeOut":
      return 1 - (1 - t) ** 3;
    case "thereAndBack":
      return ease(t < 0.5 ? t * 2 : (1 - t) * 2, "smooth");
    default:
      throw new TypeError("Unknown easing function.");
  }
}
/** Interpolate a scalar tracker from captured endpoints, independent of frame rate. */
export function tween(
  from: number,
  to: number,
  update: (value: number) => void,
  options: TweenOptions = {},
): AnimationClip {
  if (!Number.isFinite(from) || !Number.isFinite(to))
    throw new RangeError("Tween endpoints must be finite.");
  const seconds = duration(options.duration ?? 1);
  ease(0, options.easing);
  return {
    duration: seconds,
    sample: (progress) =>
      update(from + (to - from) * ease(progress, options.easing)),
  };
}
export function wait(seconds: number): AnimationClip {
  return { duration: duration(seconds), sample() {} };
}
function group(
  clips: readonly AnimationClip[],
  sequential: boolean,
): AnimationClip {
  let end = 0;
  const tracks = clips.map((clip) => {
    duration(clip.duration);
    const at = sequential ? end : 0;
    end = sequential ? end + clip.duration : Math.max(end, clip.duration);
    return { clip, at };
  });
  return {
    duration: end,
    sample(progress) {
      const time = clamp(progress) * end;
      for (const { clip, at } of [...tracks].reverse())
        if (time < at) clip.sample(0);
      for (const { clip, at } of tracks)
        if (time >= at)
          clip.sample(clip.duration ? clamp((time - at) / clip.duration) : 1);
    },
  };
}
export const sequence = (...clips: readonly AnimationClip[]): AnimationClip =>
  group(clips, true);
export const parallel = (...clips: readonly AnimationClip[]): AnimationClip =>
  group(clips, false);

/** Seekable clips, shared wall-clock time and at most one awaited render in flight. */
export class Timeline {
  private readonly tracks: { clip: AnimationClip; at: number }[] = [];
  private readonly win?: Window;
  private frame = 0;
  private elapsed = 0;
  private epoch = 0;
  private started = 0;
  private status: AnimationState = "idle";
  private readonly renders: RenderQueue;
  private complete!: (value: "finished" | "cancelled") => void;
  private completion!: Promise<"finished" | "cancelled">;
  private completionPending = true;
  constructor(private readonly options: TimelineOptions = {}) {
    this.renders = new RenderQueue(() => this.options.render?.());
    const repeat = options.repeat ?? 0;
    if (repeat !== Infinity && (!Number.isSafeInteger(repeat) || repeat < 0))
      throw new RangeError("repeat must be a nonnegative integer or Infinity.");
    this.win =
      options.window ?? (typeof window === "undefined" ? undefined : window);
    this.newCompletion();
  }
  private newCompletion(): void {
    this.completionPending = true;
    this.completion = new Promise((resolve) => {
      this.complete = resolve;
    });
  }
  get finished(): Promise<"finished" | "cancelled"> {
    return this.completion;
  }
  get state(): AnimationState {
    return this.status;
  }
  private setState(state: AnimationState): void {
    this.status = state;
    this.options.onStateChange?.(state);
  }
  get time(): number {
    return this.elapsed;
  }
  get duration(): number {
    return this.tracks.reduce(
      (end, track) => Math.max(end, track.at + track.clip.duration),
      0,
    );
  }
  private get total(): number {
    return this.duration === 0
      ? 0
      : this.duration * ((this.options.repeat ?? 0) + 1);
  }
  add(clip: AnimationClip, at = this.duration): this {
    if (this.status === "playing")
      throw new Error("Pause before adding timeline clips.");
    duration(clip.duration);
    duration(at);
    const end = Math.max(this.duration, at + clip.duration);
    if (
      !Number.isFinite(end) ||
      ((this.options.repeat ?? 0) !== Infinity &&
        !Number.isFinite(end * ((this.options.repeat ?? 0) + 1)))
    )
      throw new RangeError("Timeline length exceeds finite time precision.");
    this.tracks.push({ clip, at });
    this.tracks.sort((a, b) => a.at - b.at);
    return this;
  }
  private sample(): void {
    const length = this.duration;
    let cycle = length ? Math.floor(this.elapsed / length) : 0;
    let local = length ? this.elapsed % length : 0;
    if (this.elapsed >= this.total && Number.isFinite(this.total) && length) {
      cycle = this.options.repeat ?? 0;
      local = length;
    }
    if (this.options.yoyo && cycle % 2) local = length - local;
    for (const { clip, at } of [...this.tracks].reverse())
      if (local < at) clip.sample(0);
    for (const { clip, at } of this.tracks)
      if (local >= at)
        clip.sample(clip.duration ? clamp((local - at) / clip.duration) : 1);
  }
  private render(): Promise<void> {
    return this.renders.flush();
  }
  async seek(seconds: number): Promise<void> {
    duration(seconds);
    if (!this.completionPending) {
      this.newCompletion();
      this.setState("paused");
    }
    this.elapsed = Math.min(seconds, this.total);
    this.sample();
    if (this.status === "playing" && this.win)
      this.started = this.win.performance.now() - this.elapsed * 1000;
    await this.render();
  }
  play(): this {
    if (this.status === "playing") return this;
    if (!this.win)
      throw new Error(
        "Timeline playback needs a browser window; seek() can run without one.",
      );
    if (!this.completionPending) {
      this.newCompletion();
      this.elapsed = 0;
    }
    this.setState("playing");
    this.started = this.win.performance.now() - this.elapsed * 1000;
    const generation = ++this.epoch;
    const tick = async () => {
      this.frame = 0;
      if (this.status !== "playing" || generation !== this.epoch) return;
      try {
        const reduced =
          this.options.reducedMotion !== false &&
          this.win!.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.elapsed = reduced
          ? Number.isFinite(this.total)
            ? this.total
            : this.duration
          : Math.min(
              this.total,
              (this.win!.performance.now() - this.started) / 1000,
            );
        this.sample();
        await this.render();
        if (this.status !== "playing" || generation !== this.epoch) return;
        if (reduced || this.elapsed >= this.total) {
          this.setState("finished");
          this.completionPending = false;
          this.complete("finished");
        } else
          this.frame = this.win!.requestAnimationFrame(() => {
            void tick();
          });
      } catch (error) {
        this.cancel();
        const value = error instanceof Error ? error : new Error(String(error));
        if (this.options.onError) this.options.onError(value);
        else console.error("[typeplot] animation", value);
      }
    };
    this.frame = this.win.requestAnimationFrame(() => {
      void tick();
    });
    return this;
  }
  pause(): this {
    if (this.frame) this.win?.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.epoch++;
    if (this.status === "playing") this.setState("paused");
    return this;
  }
  cancel(): void {
    this.pause();
    this.setState("cancelled");
    if (this.completionPending) {
      this.completionPending = false;
      this.complete("cancelled");
    }
  }
}
/** A scalar updater shared by function parameters, camera clips or application state. */
export class ValueTracker {
  private readonly listeners = new Set<(value: number) => void>();
  constructor(private value = 0) {
    if (!Number.isFinite(value))
      throw new RangeError("Tracker value must be finite.");
  }
  get(): number {
    return this.value;
  }
  set(value: number): this {
    if (!Number.isFinite(value))
      throw new RangeError("Tracker value must be finite.");
    if (value !== this.value) {
      this.value = value;
      for (const listener of this.listeners) listener(value);
    }
    return this;
  }
  onChange(listener: (value: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  transition(to: number, options: TweenOptions = {}): AnimationClip {
    return tween(
      this.value,
      to,
      (value) => {
        this.set(value);
      },
      options,
    );
  }
}
