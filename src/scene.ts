import { tween, type AnimationClip, type TweenOptions } from "./animation.js";
import {
  identityMatrix,
  invertAffineMatrix,
  matrixInterpolator,
  multiplyMatrices,
  type Matrix4,
} from "./transform.js";

export interface SceneTransition {
  readonly transform?: Matrix4;
  readonly opacity?: number;
}
interface NodeState {
  owner: PlotScene;
  parent: SceneGroup | null;
  children: SceneNode[];
  transform: Matrix4;
  opacity: number;
  visible: boolean;
}
interface SceneState {
  invalidate: () => void;
  alive: () => void;
  initial: Matrix4;
  groups: Set<SceneGroup>;
}
const nodes = new WeakMap<SceneNode, NodeState>();
const scenes = new WeakMap<PlotScene, SceneState>();
const state = (node: SceneNode): NodeState => {
  const value = nodes.get(node);
  if (!value) throw new TypeError("Expected a TypePlot scene node.");
  return value;
};
const settings = (scene: PlotScene): SceneState => scenes.get(scene)!;
function opacity(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new RangeError("Scene opacity must be between zero and one.");
  return value;
}
function matrix(value: Matrix4): Matrix4 {
  const copy = [...value] as unknown as Matrix4;
  invertAffineMatrix(copy);
  return copy;
}
function world(node: SceneNode): {
  transform: Matrix4;
  inverse: Matrix4;
  opacity: number;
} {
  const path: SceneNode[] = [];
  for (
    let current: SceneNode | null = node;
    current;
    current = state(current).parent
  )
    path.unshift(current);
  let transform = identityMatrix(),
    alpha = 1;
  for (const entry of path) {
    const current = state(entry);
    transform = multiplyMatrices(transform, current.transform);
    alpha *= current.visible ? current.opacity : 0;
  }
  if (path[0] !== state(node).owner.root) alpha = 0;
  return { transform, inverse: invertAffineMatrix(transform), opacity: alpha };
}
/** Validate both rendered branches before committing a hierarchy or matrix change. */
function change(scene: PlotScene, apply: () => () => void): void {
  const config = settings(scene);
  config.alive();
  const undo = apply();
  try {
    world(scene.axes);
    world(scene.content);
  } catch (error) {
    undo();
    throw error;
  }
  config.invalidate();
}

/** A local affine transform; its world matrix is composed from its ancestors. */
export class SceneNode {
  protected constructor(owner: PlotScene) {
    nodes.set(this, {
      owner,
      parent: null,
      children: [],
      transform: identityMatrix(),
      opacity: 1,
      visible: true,
    });
  }
  get parent(): SceneGroup | null {
    return state(this).parent;
  }
  getTransform(): Matrix4 {
    settings(state(this).owner).alive();
    return [...state(this).transform];
  }
  getWorldTransform(): Matrix4 {
    settings(state(this).owner).alive();
    return world(this).transform;
  }
  setTransform(value: Matrix4): this {
    const next = matrix(value),
      current = state(this),
      previous = current.transform;
    change(current.owner, () => {
      current.transform = next;
      return () => {
        current.transform = previous;
      };
    });
    return this;
  }
  getOpacity(): number {
    settings(state(this).owner).alive();
    return state(this).opacity;
  }
  setOpacity(value: number): this {
    const next = opacity(value),
      current = state(this),
      previous = current.opacity;
    change(current.owner, () => {
      current.opacity = next;
      return () => {
        current.opacity = previous;
      };
    });
    return this;
  }
  isVisible(): boolean {
    settings(state(this).owner).alive();
    return state(this).visible;
  }
  setVisible(value: boolean): this {
    if (typeof value !== "boolean")
      throw new TypeError("Scene visibility must be a boolean.");
    const current = state(this),
      previous = current.visible;
    change(current.owner, () => {
      current.visible = value;
      return () => {
        current.visible = previous;
      };
    });
    return this;
  }
  /** Captured local endpoints make reverse seeking and grouped clips deterministic. */
  transition(to: SceneTransition, options: TweenOptions = {}): AnimationClip {
    const animateOpacity = to.opacity !== undefined;
    const from = this.getOpacity(),
      target = to.opacity === undefined ? from : opacity(to.opacity);
    const interpolate = to.transform
      ? matrixInterpolator(this.getTransform(), to.transform)
      : undefined;
    return tween(
      0,
      1,
      (progress) => {
        const current = state(this),
          previous = { transform: current.transform, opacity: current.opacity };
        const next = interpolate
          ? matrix(interpolate(progress))
          : current.transform;
        const alpha = animateOpacity
          ? opacity(from + (target - from) * progress)
          : current.opacity;
        change(current.owner, () => {
          current.transform = next;
          current.opacity = alpha;
          return () => {
            Object.assign(current, previous);
          };
        });
      },
      options,
    );
  }
}
class SceneItem extends SceneNode {
  constructor(owner: PlotScene) {
    super(owner);
  }
}

/** Reparenting retains local transforms. Cross-scene parents and cycles are refused. */
export class SceneGroup extends SceneNode {
  /** @internal Create groups with plot.scene.group(). */
  constructor(owner: PlotScene) {
    super(owner);
    settings(owner).groups.add(this);
  }
  get children(): readonly SceneNode[] {
    return [...state(this).children];
  }
  add(...children: readonly SceneNode[]): this {
    const owner = state(this).owner;
    settings(owner).alive();
    const unique = [...new Set(children)];
    for (const child of unique) {
      if (state(child).owner !== owner)
        throw new Error("Scene nodes must belong to the same plot.");
      for (
        let ancestor: SceneNode | null = this;
        ancestor;
        ancestor = state(ancestor).parent
      )
        if (ancestor === child)
          throw new Error("Scene groups cannot contain a cycle.");
    }
    const previous = new Map<SceneGroup, SceneNode[]>();
    for (const group of [
      this,
      ...unique
        .map((child) => state(child).parent)
        .filter((parent): parent is SceneGroup => parent !== null),
    ])
      previous.set(group, [...state(group).children]);
    const parents = unique.map((child) => state(child).parent);
    change(owner, () => {
      for (const child of unique) {
        const current = state(child);
        if (current.parent)
          state(current.parent).children = state(
            current.parent,
          ).children.filter((entry) => entry !== child);
        current.parent = this;
        state(this).children.push(child);
      }
      return () => {
        for (const [group, list] of previous) state(group).children = list;
        unique.forEach((child, index) => {
          state(child).parent = parents[index];
        });
      };
    });
    return this;
  }
  remove(...children: readonly SceneNode[]): this {
    const current = state(this),
      previous = [...current.children];
    const removed = new Set(
      children.filter((child) => state(child).parent === this),
    );
    change(current.owner, () => {
      current.children = current.children.filter(
        (child) => !removed.has(child),
      );
      for (const child of removed) state(child).parent = null;
      return () => {
        current.children = previous;
        for (const child of removed) state(child).parent = this;
      };
    });
    return this;
  }
}

/** One compiled plot's retained coordinate frame and mathematical content, on one GPU canvas. */
export class PlotScene {
  readonly root: SceneGroup;
  readonly axes: SceneNode;
  readonly content: SceneNode;
  /** @internal A plot supplies invalidation and lifecycle hooks; this object owns no GPU resources. */
  constructor(
    transform: Matrix4 = identityMatrix(),
    invalidate = () => {},
    alive = () => {},
  ) {
    const initial = matrix(transform);
    scenes.set(this, { initial, invalidate, alive, groups: new Set() });
    this.root = new SceneGroup(this);
    this.axes = new SceneItem(this);
    this.content = new SceneItem(this);
    state(this.root).transform = initial;
    state(this.root).children = [this.axes, this.content];
    state(this.axes).parent = this.root;
    state(this.content).parent = this.root;
  }
  group(...children: readonly SceneNode[]): SceneGroup {
    settings(this).alive();
    for (const child of children)
      if (state(child).owner !== this || child === this.root)
        throw new Error("Groups accept non-root nodes from the same scene.");
    const group = new SceneGroup(this);
    this.root.add(group);
    try {
      group.add(...children);
    } catch (error) {
      this.root.remove(group);
      throw error;
    }
    settings(this).groups.add(group);
    return group;
  }
  /** Restore default branches; custom groups detach and may be added again explicitly. */
  reset(): void {
    const config = settings(this);
    config.alive();
    for (const node of [this.root, this.axes, this.content, ...config.groups])
      Object.assign(state(node), {
        parent: null,
        children: [],
        transform: identityMatrix(),
        opacity: 1,
        visible: true,
      });
    state(this.root).transform = [...config.initial];
    state(this.root).children = [this.axes, this.content];
    state(this.axes).parent = this.root;
    state(this.content).parent = this.root;
    config.invalidate();
  }
  /** @internal One coherent pair of world transforms and inherited opacity for the shaders. */
  snapshot(): {
    axes: ReturnType<typeof world>;
    content: ReturnType<typeof world>;
  } {
    settings(this).alive();
    return { axes: world(this.axes), content: world(this.content) };
  }
}
