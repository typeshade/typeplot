import type { Plot } from "./types.js";

export type ControlPosition =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface PlotControl {
  onAdd(plot: Plot): HTMLElement;
  onRemove(plot: Plot): void;
  /** Called after the view or layout changes. */
  onUpdate?(plot: Plot): void;
}

/** HTML controls are interaction UI; chart fields and export remain GPU-rendered. */
export class PlotControlHost {
  private root?: HTMLDivElement;
  private readonly entries = new Map<PlotControl, HTMLElement>();
  private observer?: ResizeObserver;
  private originalPosition?: string;
  private parent?: HTMLElement;
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly plot: Plot,
  ) {}
  container(): HTMLElement {
    return this.canvas.parentElement ?? this.canvas;
  }
  add(control: PlotControl, position: ControlPosition = "top-right"): void {
    if (this.entries.has(control))
      throw new Error("Control is already attached.");
    if (
      !["top-left", "top-right", "bottom-left", "bottom-right"].includes(
        position,
      )
    )
      throw new TypeError("Unknown control position.");
    if (!this.root) {
      const parent = this.canvas.parentElement;
      if (!parent)
        throw new Error("Attach the plot canvas before adding controls.");
      this.parent = parent;
      if (
        parent.ownerDocument.defaultView!.getComputedStyle(parent).position ===
        "static"
      ) {
        this.originalPosition = parent.style.position;
        parent.style.position = "relative";
      }
      this.root = parent.ownerDocument.createElement("div");
      this.root.className = "typeplot-controls";
      this.root.style.cssText =
        "position:absolute;pointer-events:none;z-index:2;overflow:hidden";
      parent.appendChild(this.root);
      const Resize = parent.ownerDocument.defaultView!.ResizeObserver;
      if (Resize) {
        this.observer = new Resize(() => this.update());
        this.observer.observe(this.canvas);
        this.observer.observe(parent);
      }
    }
    let element: HTMLElement;
    try {
      element = control.onAdd(this.plot);
    } catch (error) {
      if (!this.entries.size) this.clear();
      throw error;
    }
    const group = this.canvas.ownerDocument.createElement("div");
    group.dataset.position = position;
    let corner = this.root!.querySelector<HTMLElement>(
      `[data-corner="${position}"]`,
    );
    if (!corner) {
      corner = this.canvas.ownerDocument.createElement("div");
      corner.dataset.corner = position;
      corner.style.cssText = `position:absolute;display:flex;flex-direction:column;gap:6px;align-items:${position.endsWith("left") ? "flex-start" : "flex-end"};${position.startsWith("top") ? "top" : "bottom"}:10px;${position.endsWith("left") ? "left" : "right"}:10px`;
      this.root!.appendChild(corner);
    }
    group.style.cssText = "pointer-events:auto;max-width:100%";
    group.addEventListener("pointerdown", (event) => event.stopPropagation());
    group.addEventListener("dblclick", (event) => event.stopPropagation());
    group.addEventListener("wheel", (event) => event.stopPropagation());
    group.appendChild(element);
    corner.appendChild(group);
    this.entries.set(control, group);
    this.update();
  }
  remove(control: PlotControl): void {
    const element = this.entries.get(control);
    if (!element) return;
    this.entries.delete(control);
    try {
      control.onRemove(this.plot);
    } finally {
      const corner = element.parentElement;
      element.remove();
      if (!corner?.childElementCount) corner?.remove();
      if (!this.entries.size) this.clear();
    }
  }
  update(): void {
    if (!this.root || !this.parent) return;
    const rect = this.canvas.getBoundingClientRect(),
      parent = this.parent.getBoundingClientRect();
    Object.assign(this.root.style, {
      left: `${rect.left - parent.left - this.parent.clientLeft + this.parent.scrollLeft}px`,
      top: `${rect.top - parent.top - this.parent.clientTop + this.parent.scrollTop}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    for (const control of this.entries.keys()) control.onUpdate?.(this.plot);
  }
  private clear(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.root?.remove();
    this.root = undefined;
    if (this.parent && this.originalPosition !== undefined)
      this.parent.style.position = this.originalPosition;
    this.parent = undefined;
    this.originalPosition = undefined;
  }
  destroy(): void {
    for (const control of [...this.entries.keys()]) {
      try {
        this.remove(control);
      } catch (error) {
        console.error("[typeplot] control cleanup failed", error);
      }
    }
    this.clear();
  }
}

/** Map-style camera controls. Attach with plot.addControl(new ViewControl()). */
export class ViewControl implements PlotControl {
  private element?: HTMLDivElement;
  private buttons: HTMLButtonElement[] = [];
  private projection?: HTMLSelectElement;
  constructor(
    private readonly options: {
      language?: "en" | "ko";
      onChange?: (view: {
        mode: "2d" | "3d";
        projection: "perspective" | "orthographic";
      }) => void;
    } = {},
  ) {}
  onAdd(plot: Plot): HTMLElement {
    if (this.element) throw new Error("ViewControl is already attached.");
    const doc = plot.getContainer().ownerDocument,
      ko = this.options.language === "ko";
    const element = doc.createElement("div");
    this.element = element;
    element.setAttribute("role", "group");
    element.setAttribute("aria-label", ko ? "카메라 조작" : "Camera controls");
    element.style.cssText =
      "display:flex;gap:2px;align-items:center;padding:3px;border:1px solid #d5dce5;border-radius:6px;background:#fff;color:#334155;box-shadow:0 1px 3px #0f172a12;font:12px system-ui,sans-serif";
    for (const mode of ["2d", "3d"] as const) {
      const button = doc.createElement("button");
      button.type = "button";
      button.textContent = mode.toUpperCase();
      button.disabled = !plot.supportsMode(mode);
      button.style.cssText =
        "border:0;border-radius:3px;padding:5px 7px;background:transparent;color:inherit;cursor:pointer;font:inherit";
      button.onclick = () => {
        plot.setMode(mode);
        this.options.onChange?.({
          mode: plot.getMode(),
          projection: plot.getProjection(),
        });
      };
      element.appendChild(button);
      this.buttons.push(button);
    }
    const projection = doc.createElement("select");
    this.projection = projection;
    projection.setAttribute("aria-label", ko ? "투영" : "Projection");
    projection.style.cssText =
      "border:0;border-left:1px solid #e2e8f0;background:#fff;color:inherit;font:inherit;padding:4px";
    for (const [value, label] of [
      ["perspective", ko ? "원근" : "Perspective"],
      ["orthographic", ko ? "직교" : "Orthographic"],
    ]) {
      const option = doc.createElement("option");
      option.value = value;
      option.textContent = label;
      projection.appendChild(option);
    }
    projection.onchange = () => {
      plot.setProjection(projection.value as "perspective" | "orthographic");
      this.options.onChange?.({
        mode: plot.getMode(),
        projection: plot.getProjection(),
      });
    };
    element.appendChild(projection);
    const reset = doc.createElement("button");
    reset.type = "button";
    reset.textContent = "↺";
    reset.title = ko ? "뷰 초기화" : "Reset view";
    reset.setAttribute("aria-label", reset.title);
    reset.style.cssText =
      "border:0;border-radius:3px;padding:5px 8px;background:transparent;color:inherit;cursor:pointer;font:inherit";
    reset.onclick = () => plot.resetView();
    element.appendChild(reset);
    this.onUpdate(plot);
    return element;
  }
  onUpdate(plot: Plot): void {
    this.buttons.forEach((button, index) => {
      const mode = index === 0 ? "2d" : "3d";
      const active = plot.getMode() === mode;
      button.disabled = !plot.supportsMode(mode);
      button.setAttribute("aria-pressed", String(active));
      button.style.background = active ? "#e6f4ff" : "transparent";
      button.style.color = active ? "#1677ff" : "inherit";
    });
    if (this.projection) {
      this.projection.value = plot.getProjection();
      this.projection.disabled = plot.getMode() !== "3d";
    }
  }
  onRemove(): void {
    this.element?.remove();
    this.element = undefined;
    this.buttons = [];
    this.projection = undefined;
  }
}
