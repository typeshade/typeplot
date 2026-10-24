import {
  createDevice,
  resident,
  type Device,
  type Frame,
  type Resident,
  type Runtime,
} from "typeshade/runtime";
import { GpuCompletion } from "../gpu-completion.js";
import { WorkScope } from "./lifetime.js";

/** Own TypePlot's handles; delegate storage, pooling and execution to TypeShade. */
export class RenderSession {
  private readonly scope = new WorkScope();
  private readonly completion: GpuCompletion;
  private readonly arrays = new Set<Resident<unknown>>();
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
  array<T>(value: T): Resident<T> {
    this.scope.assertOpen();
    if (this.runtime.tier === "webgpu" && !this.device)
      throw new Error(
        "Prepare the session's data owner before allocating resident inputs.",
      );
    const handle = this.device ? this.device.array(value) : resident(value);
    this.arrays.add(handle);
    return handle;
  }
  release(handle: Resident<unknown>): void {
    if (!this.arrays.delete(handle)) return;
    if (this.device) this.device.release(handle);
    else handle.destroy();
  }
  present(frame: Frame): Promise<void> {
    return this.run(async () => {
      await frame.submit();
      await this.completion.wait();
    });
  }
  retire(releasePlotResources: () => void): Promise<void> {
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
        release(releasePlotResources);
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
