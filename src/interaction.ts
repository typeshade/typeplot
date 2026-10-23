export interface PlotBounds {
  x: readonly [number, number];
  y: readonly [number, number];
}

type Pair = [number, number];
type View = {
  center: Pair;
  span: Pair;
  rotation: Pair;
  pan: Pair;
  blend: [number];
};

const ROTATION: Pair = [0.65, 0.45];
const DURATION = 140;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const copy = (view: View): View => ({
  center: [...view.center],
  span: [...view.span],
  rotation: [...view.rotation],
  pan: [...view.pan],
  blend: [...view.blend],
});

/** Supplies plot uniforms and requests a redraw only while the view changes. */
export function createPlotInteraction(
  canvas: HTMLCanvasElement,
  initialBounds: PlotBounds,
  onChange: () => void,
  enabled = true,
  viewport: () => Pick<DOMRect, "left" | "top" | "width" | "height"> = () =>
    canvas.getBoundingClientRect(),
) {
  const win = canvas.ownerDocument.defaultView!;
  for (const axis of [initialBounds.x, initialBounds.y]) {
    if (!axis.every(Number.isFinite) || !(axis[1] > axis[0])) {
      throw new RangeError("Plot bounds must be finite and increasing.");
    }
  }
  const original: View = {
    center: [
      initialBounds.x[0] / 2 + initialBounds.x[1] / 2,
      initialBounds.y[0] / 2 + initialBounds.y[1] / 2,
    ],
    span: [
      initialBounds.x[1] - initialBounds.x[0],
      initialBounds.y[1] - initialBounds.y[0],
    ],
    rotation: [...ROTATION],
    pan: [0, 0],
    blend: [0],
  };
  if (!original.span.every((span) => Number.isFinite(span * 1e6))) {
    throw new RangeError("Plot bounds exceed the supported range.");
  }
  const current = copy(original);
  let target = copy(original);
  let start = copy(original);
  let threeD = false;
  let destroyed = false;
  let frame = 0;
  let started = 0;
  let pointer: { id: number; x: number; y: number; pan: boolean } | null = null;
  const motion = win.matchMedia("(prefers-reduced-motion: reduce)");
  const oldTouchAction = canvas.style.touchAction;
  const oldTabIndex = canvas.getAttribute("tabindex");
  if (enabled) {
    canvas.style.touchAction = "none";
    if (oldTabIndex === null) canvas.tabIndex = 0;
  }

  function assign(view: View) {
    for (const key of ["center", "span", "rotation", "pan", "blend"] as const) {
      for (let i = 0; i < view[key].length; i++) current[key][i] = view[key][i];
    }
  }

  function tick(time: number) {
    frame = 0;
    if (destroyed) return;
    const progress = clamp((time - started) / DURATION, 0, 1);
    const eased = 1 - (1 - progress) ** 3;
    for (const key of ["center", "span", "rotation", "pan", "blend"] as const) {
      for (let i = 0; i < current[key].length; i++) {
        current[key][i] =
          start[key][i] + (target[key][i] - start[key][i]) * eased;
      }
    }
    onChange();
    if (progress < 1 && !destroyed) frame = win.requestAnimationFrame(tick);
  }

  function change(immediate = false) {
    if (destroyed) return;
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    if (motion.matches || immediate) {
      assign(target);
      onChange();
    } else {
      start = copy(current);
      started = win.performance.now();
      frame = win.requestAnimationFrame(tick);
    }
  }

  function limitCenter(axis: number, value: number) {
    const extent = original.span[axis] * 1e6;
    return clamp(
      value,
      original.center[axis] - extent,
      original.center[axis] + extent,
    );
  }

  function zoom(factor: number, anchor: Pair = [0.5, 0.5], immediate = false) {
    for (let axis = 0; axis < 2; axis++) {
      const before = target.span[axis];
      const after = clamp(
        before * factor,
        original.span[axis] * 1e-3,
        original.span[axis] * 1e3,
      );
      if (!threeD) {
        target.center[axis] = limitCenter(
          axis,
          target.center[axis] + (anchor[axis] - 0.5) * (before - after),
        );
      }
      target.span[axis] = after;
    }
    change(immediate);
  }

  function wheel(event: WheelEvent) {
    if (!Number.isFinite(event.deltaY)) return;
    event.preventDefault();
    const rect = viewport();
    const units =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
    const anchor: Pair = [
      clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
      clamp(1 - (event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1),
    ];
    zoom(Math.exp(clamp(event.deltaY * units * 0.002, -1, 1)), anchor, true);
  }

  function down(event: PointerEvent) {
    if (
      pointer ||
      (event.button !== 0 && event.button !== 2) ||
      !event.isPrimary
    )
      return;
    target = copy(current);
    target.blend[0] = threeD ? 1 : 0;
    change(true);
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      pan: event.button === 2,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
    event.preventDefault();
  }

  function rotate(yaw: number, pitch: number) {
    target.rotation[0] += yaw;
    target.rotation[1] = clamp(target.rotation[1] + pitch, -1.45, 1.45);
  }

  function move(event: PointerEvent) {
    if (pointer?.id !== event.pointerId) return;
    const rect = viewport();
    const dx = clamp(
      (event.clientX - pointer.x) / Math.max(rect.width, 1),
      -1,
      1,
    );
    const dy = clamp(
      (event.clientY - pointer.y) / Math.max(rect.height, 1),
      -1,
      1,
    );
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (threeD && !pointer.pan) rotate(dx * Math.PI, dy * Math.PI);
    else if (threeD) {
      target.pan[0] += dx;
      target.pan[1] -= dy;
    } else {
      target.center[0] = limitCenter(0, target.center[0] - dx * target.span[0]);
      target.center[1] = limitCenter(1, target.center[1] + dy * target.span[1]);
    }
    change(true);
  }

  function contextmenu(event: MouseEvent) {
    event.preventDefault();
  }

  function up(event: PointerEvent) {
    if (pointer?.id !== event.pointerId) return;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  }

  function reset() {
    target = copy(original);
    target.blend[0] = threeD ? 1 : 0;
    change();
  }

  function keydown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const directions: Record<string, Pair> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    const direction = directions[event.key];
    if (direction) {
      if (threeD) rotate(direction[0] * 0.15, -direction[1] * 0.15);
      else {
        for (let axis = 0; axis < 2; axis++) {
          target.center[axis] = limitCenter(
            axis,
            target.center[axis] + direction[axis] * target.span[axis] * 0.1,
          );
        }
      }
      change();
    } else if (event.key === "+" || event.key === "=") zoom(1 / 1.2);
    else if (event.key === "-" || event.key === "_") zoom(1.2);
    else if (event.key === "Home") reset();
    else return;
    event.preventDefault();
  }

  function motionChanged() {
    if (motion.matches) change();
  }

  if (enabled) {
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);
    canvas.addEventListener("keydown", keydown);
    canvas.addEventListener("contextmenu", contextmenu);
  }
  motion.addEventListener("change", motionChanged);

  return {
    value(field: string): readonly number[] | null {
      switch (field) {
        case "plotCenter":
          return current.center;
        case "plotSpan":
          return current.span;
        case "plotRotation":
          return current.rotation;
        case "plotPan":
          return current.pan;
        case "plotBlend":
          return current.blend;
        default:
          return null;
      }
    },
    setMode(enabled: boolean) {
      if (destroyed || threeD === enabled) return;
      threeD = enabled;
      target.blend[0] = enabled ? 1 : 0;
      change();
    },
    reset,
    /** Replace the home view and display it immediately. */
    setBounds(bounds: PlotBounds) {
      if (destroyed) return;
      for (const axis of [bounds.x, bounds.y]) {
        const span = axis[1] - axis[0];
        if (
          !axis.every(Number.isFinite) ||
          !(span > 0) ||
          !Number.isFinite(span * 1e6)
        )
          throw new RangeError(
            "Plot bounds must be finite and increasing within the supported range.",
          );
      }
      original.center = [
        bounds.x[0] / 2 + bounds.x[1] / 2,
        bounds.y[0] / 2 + bounds.y[1] / 2,
      ];
      original.span = [bounds.x[1] - bounds.x[0], bounds.y[1] - bounds.y[0]];
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
      target = copy(original);
      target.blend[0] = threeD ? 1 : 0;
      assign(target);
      onChange();
    },
    bounds(): { x: Pair; y: Pair } {
      return {
        x: [
          current.center[0] - current.span[0] / 2,
          current.center[0] + current.span[0] / 2,
        ],
        y: [
          current.center[1] - current.span[1] / 2,
          current.center[1] + current.span[1] / 2,
        ],
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame) win.cancelAnimationFrame(frame);
      if (pointer && canvas.hasPointerCapture(pointer.id))
        canvas.releasePointerCapture(pointer.id);
      pointer = null;
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("contextmenu", contextmenu);
      motion.removeEventListener("change", motionChanged);
      if (enabled) {
        canvas.style.touchAction = oldTouchAction;
        if (oldTabIndex === null) canvas.removeAttribute("tabindex");
        else canvas.setAttribute("tabindex", oldTabIndex);
      }
    },
  };
}
