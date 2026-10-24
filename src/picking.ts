import type { PickEvent } from "./types.js";
type Listener<T> = (event: PickEvent<T>) => void;

/** Read back only on demand. Hover queries coalesce and stale results never emit. */
export class PointerPicker<T> {
  private readonly listeners = {
    hover: new Set<Listener<T>>(),
    click: new Set<Listener<T>>(),
  };
  private readonly win: Window;
  private frame = 0;
  private busy = false;
  private disposed = false;
  private generation = 0;
  private pending?: {
    event: PointerEvent;
    position: [number, number];
    generation: number;
  };
  private pressed?: [number, number];
  private dragged = false;
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly query: (
      position: readonly [number, number],
    ) => Promise<T | null>,
    private readonly report: (error: unknown) => void,
  ) {
    this.win = canvas.ownerDocument.defaultView!;
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerleave", this.leave);
    canvas.addEventListener("pointerdown", this.down);
    canvas.addEventListener("pointercancel", this.cancel);
    canvas.addEventListener("click", this.click);
  }
  on(type: "hover" | "click", listener: Listener<T>): void {
    if (this.disposed) throw new Error("This picker has been destroyed.");
    if (!this.listeners[type] || typeof listener !== "function")
      throw new TypeError("Picking needs a hover/click event and a listener.");
    this.listeners[type].add(listener);
  }
  off(type: "hover" | "click", listener: Listener<T>): void {
    this.listeners[type]?.delete(listener);
  }
  private position(event: MouseEvent | PointerEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }
  private emit(
    type: "hover" | "click",
    result: T | null,
    position: [number, number],
    originalEvent: MouseEvent | PointerEvent,
  ): void {
    if (this.disposed) return;
    for (const listener of this.listeners[type]) {
      try {
        listener({ type, result, position, originalEvent });
      } catch (error) {
        this.report(error);
      }
    }
  }
  private down = (event: PointerEvent): void => {
    this.pressed = [event.clientX, event.clientY];
    this.dragged = false;
    this.invalidate();
    this.emit("hover", null, this.position(event), event);
  };
  private cancel = (): void => {
    this.pressed = undefined;
    this.dragged = true;
    this.invalidate();
  };
  private move = (event: PointerEvent): void => {
    if (
      this.pressed &&
      event.buttons &&
      Math.hypot(
        event.clientX - this.pressed[0],
        event.clientY - this.pressed[1],
      ) > 4
    )
      this.dragged = true;
    if (
      event.buttons ||
      event.pointerType === "touch" ||
      !this.listeners.hover.size
    )
      return;
    this.pending = {
      event,
      position: this.position(event),
      generation: ++this.generation,
    };
    this.schedule();
  };
  private schedule(): void {
    if (!this.disposed && !this.busy && this.pending && !this.frame)
      this.frame = this.win.requestAnimationFrame(() => {
        this.frame = 0;
        void this.flush();
      });
  }
  private async flush(): Promise<void> {
    const pending = this.pending;
    this.pending = undefined;
    if (!pending || this.disposed || !this.listeners.hover.size) return;
    this.busy = true;
    try {
      const result = await this.query(pending.position);
      if (pending.generation === this.generation)
        this.emit("hover", result, pending.position, pending.event);
    } catch (error) {
      if (!this.disposed) this.report(error);
    } finally {
      this.busy = false;
      this.schedule();
    }
  }
  private leave = (event: PointerEvent): void => {
    this.invalidate();
    this.emit("hover", null, this.position(event), event);
  };
  private click = (event: MouseEvent): void => {
    if (
      event.button !== 0 ||
      (event.detail !== 0 && this.dragged) ||
      !this.listeners.click.size
    )
      return;
    const position = this.position(event);
    void this.query(position)
      .then((result) => this.emit("click", result, position, event))
      .catch((error) => {
        if (!this.disposed) this.report(error);
      });
  };
  invalidate(): void {
    this.generation++;
    this.pending = undefined;
  }
  destroy(): void {
    this.disposed = true;
    this.invalidate();
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.listeners.hover.clear();
    this.listeners.click.clear();
    this.canvas.removeEventListener("pointermove", this.move);
    this.canvas.removeEventListener("pointerleave", this.leave);
    this.canvas.removeEventListener("pointerdown", this.down);
    this.canvas.removeEventListener("pointercancel", this.cancel);
    this.canvas.removeEventListener("click", this.click);
  }
}
