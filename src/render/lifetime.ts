/** Protect prepared resources and readbacks until their asynchronous work settles. */
export class WorkScope {
  private stopped = false;
  private readonly pending = new Set<Promise<unknown>>();
  private closing?: Promise<void>;
  assertOpen(): void {
    if (this.stopped)
      throw new Error("This rendering session has been destroyed.");
  }
  run<T>(work: () => T | Promise<T>): Promise<T> {
    let task: Promise<T>;
    try {
      this.assertOpen();
      task = Promise.resolve(work());
    } catch (error) {
      return Promise.reject(error);
    }
    this.pending.add(task);
    const release = () => {
      this.pending.delete(task);
    };
    void task.then(release, release);
    return task;
  }
  close(): Promise<void> {
    if (!this.closing) {
      this.stopped = true;
      this.closing = Promise.allSettled([...this.pending]).then(() => {});
    }
    return this.closing;
  }
}
