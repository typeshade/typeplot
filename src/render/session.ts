import {
  array as hostArray,
  createDevice,
  type Buffer,
  type Device,
  type f32,
  type Frame,
  type Runtime,
} from "typeshade/runtime";
import { GpuCompletion } from "../gpu-completion.js";
import { WorkScope } from "./lifetime.js";

/** Own TypePlot's handles; delegate storage, pooling and execution to TypeShade. */
export class RenderSession {
  private readonly scope = new WorkScope();
  private readonly completion: GpuCompletion;
  private readonly arrays = new Set<Buffer<f32>>();
  private device?: Device;
  private preparing?: Promise<void>;
  private retirement?: Promise<void>;
  constructor(
    readonly runtime: Runtime,
    win: Window,
  ) {
    this.completion = new GpuCompletion(
      win,
      runtime.tier === "webgl2"
        ? (runtime.device as WebGL2RenderingContext)
        : undefined,
    );
  }
  run<T>(work: () => T | Promise<T>): Promise<T> {
    return this.scope.run(work);
  }
  prepareData(): Promise<void> {
    if (!this.preparing)
      this.preparing = this.run(async () => {
        if (this.runtime.tier === "webgpu")
          this.device = await createDevice({ runtime: this.runtime });
      });
    return this.preparing;
  }
  array(value: Float32Array): Buffer<f32> {
    this.scope.assertOpen();
    if (this.runtime.tier === "webgpu" && !this.device)
      throw new Error(
        "Prepare the session's data owner before allocating resident inputs.",
      );
    const handle = this.device ? this.device.array(value) : hostArray(value);
    this.arrays.add(handle);
    return handle;
  }
  release(handle: Buffer<f32>): void {
    if (!this.arrays.delete(handle)) return;
    if (this.device) this.device.release(handle);
    else handle.dispose();
  }
  present(frame: Frame): Promise<void> {
    return this.run(async () => {
      await frame.submit();
      await this.completion.wait();
    });
  }
  retire(releasePlotResources: () => void | Promise<void>): Promise<void> {
    if (!this.retirement) {
      const drained = this.scope.close();
      this.completion.destroy();
      this.retirement = drained.then(async () => {
        const failures: unknown[] = [];
        const release = (work: () => void) => {
          try {
            work();
          } catch (error) {
            failures.push(error);
          }
        };
        try {
          await releasePlotResources();
        } catch (error) {
          failures.push(error);
        }
        for (const handle of [...this.arrays])
          release(() => this.release(handle));
        try {
          await this.device?.dispose();
        } catch (error) {
          failures.push(error);
        }
        release(() => this.runtime.destroy());
        if (failures.length)
          throw new AggregateError(
            failures,
            "Rendering resources could not all be disposed.",
          );
      });
    }
    return this.retirement;
  }
}
