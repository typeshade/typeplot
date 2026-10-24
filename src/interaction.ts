export interface PlotInteractionOptions {
  /** Continue a released drag with exponential damping. Default true. */
  readonly inertia?: boolean;
  /** Double-click restores the home camera. Default true. */
  readonly doubleClickReset?: boolean;
}

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
  lens: Pair;
  focusZ: [number];
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
  lens: [...view.lens],
  focusZ: [...view.focusZ],
});

/** Supplies plot uniforms and requests a redraw only while the view changes. */
export function createPlotInteraction(
  canvas: HTMLCanvasElement,
  initialBounds: PlotBounds,
  onChange: () => void,
  enabled = true,
  viewport: () => Pick<DOMRect, "left" | "top" | "width" | "height"> = () =>
    canvas.getBoundingClientRect(),
  options: PlotInteractionOptions = {},
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
    lens: [Math.PI / 4, 3],
    focusZ: [0],
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
  let pointer: {
    id: number;
    x: number;
    y: number;
    pan: boolean;
    time: number;
    velocity: Pair;
  } | null = null;
  const touches = new Map<number, Pair>();
  let gesture: { center: Pair; distance: number } | null = null;
  let tap: {
    id: number;
    position: Pair;
    started: number;
    moved: boolean;
  } | null = null;
  let lastTap: { position: Pair; time: number } | null = null;
  let touchResetAt = -Infinity;
  let momentum: {
    velocity: Pair;
    pan: boolean;
    last: number;
    started: number;
  } | null = null;
  const motion = win.matchMedia("(prefers-reduced-motion: reduce)");
  const oldTouchAction = canvas.style.touchAction;
  const oldTabIndex = canvas.getAttribute("tabindex");
  if (enabled) {
    canvas.style.touchAction = "none";
    if (oldTabIndex === null) canvas.tabIndex = 0;
  }

  function assign(view: View) {
    for (const key of [
      "center",
      "span",
      "rotation",
      "pan",
      "blend",
      "lens",
      "focusZ",
    ] as const) {
      for (let i = 0; i < view[key].length; i++) current[key][i] = view[key][i];
    }
  }

  function tick(time: number) {
    frame = 0;
    if (destroyed) return;
    const progress = clamp((time - started) / DURATION, 0, 1);
    const eased = 1 - (1 - progress) ** 3;
    for (const key of [
      "center",
      "span",
      "rotation",
      "pan",
      "blend",
      "lens",
      "focusZ",
    ] as const) {
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
    momentum = null;
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

  function zoom(
    factor: number,
    anchor: Pair = [0.5, 0.5],
    immediate = false,
    notify = true,
  ) {
    for (let axis = 0; axis < 2; axis++) {
      const before = target.span[axis];
      const after = clamp(
        before * factor,
        original.span[axis] * 1e-3,
        original.span[axis] * 1e3,
      );
      if (threeD) {
        // Hold the focus plane under the pointer. Perspective parallax remains
        // depth-dependent, while orthographic anchoring is exact.
        const cursor = anchor[axis] - 0.5;
        target.pan[axis] =
          cursor - ((cursor - target.pan[axis]) * before) / after;
      } else {
        target.center[axis] = limitCenter(
          axis,
          target.center[axis] + (anchor[axis] - 0.5) * (before - after),
        );
      }
      target.span[axis] = after;
    }
    if (notify) change(immediate);
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
    if (momentum) {
      target = copy(current);
    }
    zoom(Math.exp(clamp(event.deltaY * units * 0.002, -1, 1)), anchor, true);
  }

  function inputTime(event: Event): number {
    const now = win.performance.now();
    // Use input timestamps so a busy render cannot turn a short tap into a hold.
    return Number.isFinite(event.timeStamp) &&
      Math.abs(event.timeStamp - now) < 60000
      ? event.timeStamp
      : now;
  }

  function touchGeometry(): { center: Pair; distance: number } {
    const [a, b] = [...touches.values()];
    return {
      center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      distance: Math.max(2, Math.hypot(a[0] - b[0], a[1] - b[1])),
    };
  }

  function down(event: PointerEvent) {
    if (event.pointerType !== "touch" && touches.size) return;
    if (event.pointerType === "touch") {
      if (touches.size >= 2 || (pointer && !touches.size)) return;
      touches.set(event.pointerId, [event.clientX, event.clientY]);
      if (touches.size === 2) {
        pointer = null;
        tap = null;
        lastTap = null;
        target = copy(current);
        change(true);
        gesture = touchGeometry();
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      tap = {
        id: event.pointerId,
        position: [event.clientX, event.clientY],
        started: inputTime(event),
        moved: false,
      };
    }

    if (
      pointer ||
      (event.button !== 0 && event.button !== 2) ||
      (event.pointerType !== "touch" && !event.isPrimary)
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
      time: win.performance.now(),
      velocity: [0, 0],
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
    if (event.pointerType === "touch" && touches.has(event.pointerId)) {
      touches.set(event.pointerId, [event.clientX, event.clientY]);
      if (
        tap &&
        Math.hypot(
          event.clientX - tap.position[0],
          event.clientY - tap.position[1],
        ) > 8
      ) {
        tap.moved = true;
        lastTap = null;
      }
      if (gesture && touches.size === 2) {
        const next = touchGeometry(),
          rect = viewport();
        const anchor: Pair = [
          clamp(
            (gesture.center[0] - rect.left) / Math.max(rect.width, 1),
            0,
            1,
          ),
          clamp(
            1 - (gesture.center[1] - rect.top) / Math.max(rect.height, 1),
            0,
            1,
          ),
        ];
        zoom(gesture.distance / next.distance, anchor, true, false);
        dragBy(
          (next.center[0] - gesture.center[0]) / Math.max(rect.width, 1),
          (next.center[1] - gesture.center[1]) / Math.max(rect.height, 1),
          true,
        );
        gesture = next;
        change(true);
        event.preventDefault();
        return;
      }
    }
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
    const now = win.performance.now();
    const elapsed = Math.max((now - pointer.time) / 1000, 0.001);
    // Low-pass recent input velocity; positions themselves always track directly.
    const weight = 1 - Math.exp(-elapsed / 0.035);
    pointer.velocity[0] +=
      (clamp(dx / elapsed, -2, 2) - pointer.velocity[0]) * weight;
    pointer.velocity[1] +=
      (clamp(dy / elapsed, -2, 2) - pointer.velocity[1]) * weight;
    pointer.time = now;
    dragBy(dx, dy, pointer.pan);
    change(true);
  }

  function dragBy(dx: number, dy: number, pan: boolean) {
    if (threeD && !pan) rotate(dx * Math.PI, dy * Math.PI);
    else if (threeD) {
      target.pan[0] += dx;
      target.pan[1] -= dy;
    } else {
      target.center[0] = limitCenter(0, target.center[0] - dx * target.span[0]);
      target.center[1] = limitCenter(1, target.center[1] + dy * target.span[1]);
    }
  }

  function inertiaTick(time: number) {
    frame = 0;
    if (destroyed || !momentum || motion.matches) {
      momentum = null;
      return;
    }
    // Integrate exponential damping exactly, independently of frame rate.
    // A paused/background tab terminates motion instead of resuming a stale fling.
    const elapsed = (time - momentum.last) / 1000;
    if (elapsed > 0.2) {
      momentum = null;
      return;
    }
    const dt = Math.max(0, elapsed);
    const decay = Math.exp(-8.5 * dt);
    const travel = (1 - decay) / 8.5;
    dragBy(
      momentum.velocity[0] * travel,
      momentum.velocity[1] * travel,
      momentum.pan,
    );
    momentum.velocity[0] *= decay;
    momentum.velocity[1] *= decay;
    momentum.last = time;
    assign(target);
    const active = momentum;
    onChange();
    if (destroyed || momentum !== active) return;
    if (
      Math.hypot(...momentum.velocity) > 0.003 &&
      time - momentum.started < 1200
    )
      frame = win.requestAnimationFrame(inertiaTick);
    else momentum = null;
  }

  function contextmenu(event: MouseEvent) {
    event.preventDefault();
  }

  function up(event: PointerEvent) {
    const touch = touches.has(event.pointerId);
    if (touch) {
      touches.delete(event.pointerId);
      if (event.type !== "pointerup") {
        pointer = null;
        gesture = null;
        tap = null;
        lastTap = null;
        for (const id of [...touches.keys()]) {
          touches.delete(id);
          if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
        }
        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
        return;
      }
      if (gesture) {
        gesture = null;
        tap = null;
        lastTap = null;
        const remaining = [...touches.entries()][0];
        pointer = remaining
          ? {
              id: remaining[0],
              x: remaining[1][0],
              y: remaining[1][1],
              pan: false,
              time: win.performance.now(),
              velocity: [0, 0],
            }
          : null;
        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
        return;
      }
    }
    if (pointer?.id !== event.pointerId) return;
    const released = pointer;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    const now = win.performance.now();
    if (touch && tap?.id === event.pointerId) {
      const candidate = tap;
      const tapTime = inputTime(event);
      tap = null;
      if (!candidate.moved && tapTime - candidate.started <= 250) {
        if (
          options.doubleClickReset !== false &&
          lastTap &&
          tapTime - lastTap.time <= 300 &&
          Math.hypot(
            event.clientX - lastTap.position[0],
            event.clientY - lastTap.position[1],
          ) <= 24
        ) {
          lastTap = null;
          touchResetAt = now;
          reset();
          return;
        }
        lastTap = { position: [event.clientX, event.clientY], time: tapTime };
      } else lastTap = null;
    }
    if (
      event.type === "pointerup" &&
      options.inertia !== false &&
      !motion.matches &&
      now - released.time < 80 &&
      Math.hypot(...released.velocity) > 0.02
    ) {
      if (frame) win.cancelAnimationFrame(frame);
      momentum = {
        velocity: [...released.velocity],
        pan: released.pan,
        last: now,
        started: now,
      };
      frame = win.requestAnimationFrame(inertiaTick);
    }
  }

  function reset() {
    target = copy(original);
    target.blend[0] = threeD ? 1 : 0;
    change();
  }

  function doubleClick(event: MouseEvent) {
    if (
      event.button !== 0 ||
      options.doubleClickReset === false ||
      win.performance.now() - touchResetAt < 400
    )
      return;
    reset();
    event.preventDefault();
  }

  function keydown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      target = copy(current);
      change(true);
      event.preventDefault();
      return;
    }
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
    canvas.addEventListener("dblclick", doubleClick);
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
        case "plotLens":
          return current.lens;
        case "plotCenterZ":
          return current.focusZ;
        default:
          return null;
      }
    },
    setMode(enabled: boolean, immediate = false) {
      if (destroyed || threeD === enabled) return;
      threeD = enabled;
      target.blend[0] = enabled ? 1 : 0;
      change(immediate);
    },
    reset,
    camera() {
      return {
        center: [...current.center] as Pair,
        span: [...current.span] as Pair,
        rotation: [...current.rotation] as Pair,
        pan: [...current.pan] as Pair,
        fov: current.lens[0],
        distance: current.lens[1],
        z: current.focusZ[0],
      };
    },
    /** Apply an already validated camera state without an eased input transition. */
    setCamera(
      view: Partial<Pick<View, "center" | "span" | "rotation" | "pan">> & {
        fov?: number;
        distance?: number;
        z?: number;
      },
      home = false,
    ) {
      if (destroyed) return;
      target = copy(current);
      for (const key of ["center", "span", "rotation", "pan"] as const)
        if (view[key]) {
          target[key] = [...view[key]];
          if (home) original[key] = [...view[key]];
        }
      if (view.fov !== undefined) {
        target.lens[0] = view.fov;
        if (home) original.lens[0] = view.fov;
      }
      if (view.distance !== undefined) {
        target.lens[1] = view.distance;
        if (home) original.lens[1] = view.distance;
      }
      if (view.z !== undefined) {
        target.focusZ[0] = view.z;
        if (home) original.focusZ[0] = view.z;
      }
      change(true);
    },
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
      momentum = null;
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
      momentum = null;
      const captured = new Set([
        ...touches.keys(),
        ...(pointer ? [pointer.id] : []),
      ]);
      touches.clear();
      pointer = null;
      gesture = null;
      tap = null;
      lastTap = null;
      for (const id of captured)
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("contextmenu", contextmenu);
      canvas.removeEventListener("dblclick", doubleClick);
      motion.removeEventListener("change", motionChanged);
      if (enabled) {
        canvas.style.touchAction = oldTouchAction;
        if (oldTabIndex === null) canvas.removeAttribute("tabindex");
        else canvas.setAttribute("tabindex", oldTabIndex);
      }
    },
  };
}
