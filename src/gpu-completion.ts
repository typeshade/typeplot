/** Keep at most one display frame in flight on WebGL2. Runtime's WebGPU submit
 * already waits for device completion; its WebGL submit records commands only. */
export class GpuCompletion {
  private stopped = false;
  private readonly pending = new Set<() => void>();
  constructor(
    private readonly win: Window,
    private readonly gl?: WebGL2RenderingContext,
  ) {}
  wait(): Promise<void> {
    const gl = this.gl;
    if (!gl || this.stopped || gl.isContextLost()) return Promise.resolve();
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) return Promise.resolve();
    gl.flush();
    return new Promise((resolve) => {
      let timer = 0;
      const finish = () => {
        this.win.clearTimeout(timer);
        gl.deleteSync(fence);
        this.pending.delete(finish);
        resolve();
      };
      const poll = () => {
        if (this.stopped || gl.isContextLost()) {
          finish();
          return;
        }
        if (gl.clientWaitSync(fence, 0, 0) === gl.TIMEOUT_EXPIRED)
          timer = this.win.setTimeout(poll, 4);
        else finish();
      };
      this.pending.add(finish);
      poll();
    });
  }
  destroy(): void {
    this.stopped = true;
    for (const finish of [...this.pending]) finish();
  }
}
