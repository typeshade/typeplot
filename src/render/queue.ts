/** Coalesce host render requests. TypeShade retains its own command/kernel queues. */
export class RenderQueue {
  private dirty = false;
  private stopped = false;
  private running?: Promise<void>;
  constructor(private readonly draw: () => void | Promise<void>) {}
  get pending(): boolean {
    return this.dirty;
  }
  get busy(): boolean {
    return this.running !== undefined;
  }
  invalidate(): void {
    if (!this.stopped) this.dirty = true;
  }
  idle(): Promise<void> {
    return this.running ?? Promise.resolve();
  }
  flush(invalidate = true): Promise<void> {
    if (this.stopped) return this.idle();
    if (invalidate) this.dirty = true;
    if (this.running || !this.dirty) return this.idle();
    let resolve!: () => void, reject!: (error: unknown) => void;
    const pending = new Promise<void>((done, fail) => {
      resolve = done;
      reject = fail;
    });
    this.running = pending;
    // Install the in-flight handle before calling host code, including reentrant code.
    void Promise.resolve().then(async () => {
      try {
        while (this.dirty && !this.stopped) {
          this.dirty = false;
          await this.draw();
        }
        this.running = undefined;
        resolve();
      } catch (error) {
        this.running = undefined;
        reject(error);
      }
    });
    return pending;
  }
  stop(): Promise<void> {
    this.stopped = true;
    this.dirty = false;
    return this.idle();
  }
}

/** A canvas host's invalidation policy, separate from animation time and GPU execution. */
export class FrameScheduler {
  private readonly queue: RenderQueue;
  private frame = 0;
  private stopped = false;
  constructor(
    private readonly win: Window,
    draw: () => void | Promise<void>,
    private readonly report: (error: unknown) => void,
    private readonly continuing?: () => boolean,
  ) {
    this.queue = new RenderQueue(draw);
  }
  get pending(): boolean {
    return this.queue.pending;
  }
  get busy(): boolean {
    return this.queue.busy;
  }
  readonly request = (): void => {
    if (this.stopped) return;
    this.queue.invalidate();
    if (!this.frame && !this.queue.busy)
      this.frame = this.win.requestAnimationFrame(() => {
        this.frame = 0;
        void this.drain(false).catch(this.report);
      });
  };
  private drain(invalidate: boolean): Promise<void> {
    return this.queue.flush(invalidate).then(() => {
      if (this.continuing?.()) this.request();
    });
  }
  private cancelScheduled(): void {
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  flush(): Promise<void> {
    this.cancelScheduled();
    return this.drain(true);
  }
  current(): Promise<void> {
    this.cancelScheduled();
    return this.drain(false);
  }
  stop(): Promise<void> {
    this.stopped = true;
    this.cancelScheduled();
    return this.queue.stop();
  }
}
