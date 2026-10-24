import type {
  PlotProgram,
  PlotKind,
  PlotQuality,
  PlotPick,
  SurfaceOptions,
  SurfaceDomain,
} from "./types.js";
import {
  parallel,
  tween,
  type AnimationClip,
  type TweenOptions,
} from "./animation.js";
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
export interface SceneObjectStyle {
  readonly color?: string;
  readonly curveWidth?: number;
  readonly lineStyle?: "-" | "--" | ":";
  readonly dashPeriod?: number;
  readonly dashOffset?: number;
  /** Camera-distance offset for intentional coplanar overlays. Default zero. */
  readonly depthBias?: number;
}
export interface SceneObjectOptions {
  readonly id?: string;
  readonly transform?: Matrix4;
  readonly opacity?: number;
  readonly visible?: boolean;
  readonly parameters?: Readonly<Record<string, number>>;
  readonly data?: Readonly<Record<string, Float32Array>>;
  readonly domain?: readonly [number, number];
  readonly quality?: PlotQuality;
  readonly style?: SceneObjectStyle;
  readonly surface?: Omit<SurfaceOptions, "colorBar">;
  readonly surfaceDomain?: SurfaceDomain;
}
export interface SceneObjectTransition extends SceneTransition {
  readonly parameters?: Readonly<Record<string, number>>;
}
export interface ScenePick extends PlotPick {
  readonly objectId: string;
  readonly object: SceneNode;
  readonly worldPoint: readonly [number, number, number];
}
/** @internal Host operations; a scene node itself owns no GPU resources. */
export interface SceneObjectHandle {
  parameters(): Readonly<Record<string, number>>;
  checkParameters(values: Readonly<Record<string, number>>): void;
  setParameters(values: Readonly<Record<string, number>>): void;
  setData(name: string, values: Float32Array): void;
  setStyle(style: SceneObjectStyle): void;
  setDomain(domain: readonly [number, number]): void;
  setQuality(quality: PlotQuality): void;
  setSurface(options: Omit<SurfaceOptions, "colorBar">): void;
  setSurfaceDomain(domain: SurfaceDomain): void;
  reset(): void;
}
/** @internal A procedural host connects the hierarchy to its one rendering session. */
export interface SceneAdapter {
  attach(
    node: SceneObject,
    program: PlotProgram,
    options: SceneObjectOptions,
  ): Promise<SceneObjectHandle>;
  detach(node: SceneObject): Promise<void>;
  pick(
    position: readonly [number, number],
    radius: number,
  ): Promise<ScenePick | null>;
}
export interface SceneNodeSnapshot {
  readonly transform: Matrix4;
  readonly inverse: Matrix4;
  readonly opacity: number;
}
export const MAX_SCENE_OBJECTS = 16;
const handles = new WeakMap<SceneObject, SceneObjectHandle>();

interface NodeState {
  owner: PlotScene;
  parent: SceneGroup | null;
  children: SceneNode[];
  transform: Matrix4;
  opacity: number;
  visible: boolean;
  retired?: boolean;
  home?: { transform: Matrix4; opacity: number; visible: boolean };
}
interface SceneState {
  invalidate: () => void;
  alive: () => void;
  initial: Matrix4;
  groups: Set<SceneGroup>;
  objects: Set<SceneObject>;
  ids: Set<string>;
  nextId: number;
  adapter?: SceneAdapter;
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
function assertNode(node: SceneNode): void {
  const current = state(node);
  settings(current.owner).alive();
  if (current.retired) throw new Error("This scene object has been removed.");
}
function world(node: SceneNode): SceneNodeSnapshot {
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
    for (const object of config.objects) world(object);
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
    assertNode(this);
    return [...state(this).transform];
  }
  getWorldTransform(): Matrix4 {
    assertNode(this);
    return world(this).transform;
  }
  setTransform(value: Matrix4): this {
    assertNode(this);
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
    assertNode(this);
    return state(this).opacity;
  }
  setOpacity(value: number): this {
    assertNode(this);
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
    assertNode(this);
    return state(this).visible;
  }
  setVisible(value: boolean): this {
    assertNode(this);
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
      assertNode(child);
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

/** A compiled callback instance sharing the plot's runtime and camera. */
export class SceneObject extends SceneNode {
  /** @internal Use plot.scene.add(). */
  constructor(
    owner: PlotScene,
    readonly id: string,
    readonly kind: PlotKind,
  ) {
    super(owner);
  }
  private handle(): SceneObjectHandle {
    assertNode(this);
    const result = handles.get(this);
    if (!result) throw new Error("This scene object is not ready.");
    return result;
  }
  parameters(): Readonly<Record<string, number>> {
    return this.handle().parameters();
  }
  setParameters(values: Readonly<Record<string, number>>): this {
    this.handle().setParameters(values);
    return this;
  }
  setData(name: string, values: Float32Array): this {
    this.handle().setData(name, values);
    return this;
  }
  setStyle(value: SceneObjectStyle): this {
    this.handle().setStyle(value);
    return this;
  }
  setDomain(value: readonly [number, number]): this {
    this.handle().setDomain(value);
    return this;
  }
  setQuality(value: PlotQuality): this {
    this.handle().setQuality(value);
    return this;
  }
  setSurface(value: Omit<SurfaceOptions, "colorBar">): this {
    this.handle().setSurface(value);
    return this;
  }
  setSurfaceDomain(value: SurfaceDomain): this {
    this.handle().setSurfaceDomain(value);
    return this;
  }
  transition(
    to: SceneObjectTransition,
    options: TweenOptions = {},
  ): AnimationClip {
    const handle = this.handle(),
      destination = { ...to.parameters },
      from = handle.parameters();
    handle.checkParameters(destination);
    const parameters = tween(
      0,
      1,
      (progress) =>
        handle.setParameters(
          Object.fromEntries(
            Object.entries(destination).map(([name, value]) => [
              name,
              from[name] + (value - from[name]) * progress,
            ]),
          ),
        ),
      options,
    );
    return parallel(super.transition(to, options), parameters);
  }
  remove(): Promise<void> {
    return state(this).owner.remove(this);
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
    scenes.set(this, {
      initial,
      invalidate,
      alive,
      groups: new Set(),
      objects: new Set(),
      ids: new Set(["primary"]),
      nextId: 1,
    });
    this.root = new SceneGroup(this);
    this.axes = new SceneItem(this);
    this.content = new SceneItem(this);
    state(this.root).transform = initial;
    state(this.root).children = [this.axes, this.content];
    state(this.axes).parent = this.root;
    state(this.content).parent = this.root;
  }
  /** Prepared additional objects; the original callback remains scene.content. */
  get objects(): readonly SceneObject[] {
    settings(this).alive();
    return [...settings(this).objects].filter((node) => handles.has(node));
  }
  async add(
    program: PlotProgram,
    options: SceneObjectOptions = {},
  ): Promise<SceneObject> {
    const config = settings(this);
    config.alive();
    if (!config.adapter)
      throw new Error("This scene is not attached to a plot.");
    if (config.objects.size >= MAX_SCENE_OBJECTS - 1)
      throw new RangeError(
        `A scene supports at most ${MAX_SCENE_OBJECTS} mathematical objects, including its original callback.`,
      );
    if (!program || program.composition !== "layers-v1")
      throw new Error(
        "Recompile this program to enable multiple-object composition.",
      );
    const id = options.id ?? `object-${config.nextId++}`;
    if (typeof id !== "string" || !id.trim() || config.ids.has(id))
      throw new TypeError(
        "Scene object IDs must be nonempty and unique; 'primary' names the original callback.",
      );
    const captured: SceneObjectOptions = {
      ...options,
      ...(options.parameters ? { parameters: { ...options.parameters } } : {}),
      ...(options.style ? { style: { ...options.style } } : {}),
      ...(options.quality ? { quality: { ...options.quality } } : {}),
      ...(options.domain
        ? { domain: [...options.domain] as [number, number] }
        : {}),
      ...(options.surface
        ? {
            surface: {
              ...options.surface,
              ...(options.surface.valueRange
                ? {
                    valueRange: [...options.surface.valueRange] as [
                      number,
                      number,
                    ],
                  }
                : {}),
              ...(options.surface.depthRange
                ? {
                    depthRange: [...options.surface.depthRange] as [
                      number,
                      number,
                    ],
                  }
                : {}),
            },
          }
        : {}),
      ...(options.surfaceDomain
        ? {
            surfaceDomain: {
              x: [...options.surfaceDomain.x] as [number, number],
              z: [...options.surfaceDomain.z] as [number, number],
            },
          }
        : {}),
      ...(options.data
        ? {
            data: Object.fromEntries(
              Object.entries(options.data).map(([name, value]) => {
                if (!(value instanceof Float32Array) || !value.length)
                  throw new TypeError(
                    `data.${name} must be a nonempty Float32Array.`,
                  );
                return [name, value.slice()];
              }),
            ),
          }
        : {}),
    };
    const node = new SceneObject(this, id, program.kind),
      initial = state(node);
    initial.transform = matrix(options.transform ?? identityMatrix());
    initial.opacity = opacity(options.opacity ?? 1);
    if (options.visible !== undefined && typeof options.visible !== "boolean")
      throw new TypeError("Scene visibility must be a boolean.");
    initial.visible = options.visible ?? true;
    initial.home = {
      transform: initial.transform,
      opacity: initial.opacity,
      visible: initial.visible,
    };
    config.ids.add(id);
    config.objects.add(node);
    try {
      const handle = await config.adapter.attach(node, program, captured);
      config.alive();
      handles.set(node, handle);
      this.root.add(node);
      return node;
    } catch (error) {
      config.objects.delete(node);
      config.ids.delete(id);
      handles.delete(node);
      initial.retired = true;
      await config.adapter.detach(node).catch(() => {});
      throw error;
    }
  }
  remove(node: SceneObject): Promise<void> {
    const config = settings(this);
    config.alive();
    if (state(node).owner !== this)
      throw new Error("Scene objects must belong to this plot.");
    if (!config.objects.delete(node)) return Promise.resolve();
    const current = state(node);
    if (current.parent)
      state(current.parent).children = state(current.parent).children.filter(
        (child) => child !== node,
      );
    current.parent = null;
    current.retired = true;
    config.ids.delete(node.id);
    handles.delete(node);
    config.invalidate();
    return config.adapter!.detach(node);
  }
  pick(
    position: readonly [number, number],
    radius = 8,
  ): Promise<ScenePick | null> {
    const config = settings(this);
    config.alive();
    if (!config.adapter)
      throw new Error("This scene is not attached to a plot.");
    return config.adapter.pick(position, radius);
  }
  /** @internal */
  connect(adapter: SceneAdapter): void {
    const config = settings(this);
    config.alive();
    if (config.adapter) throw new Error("The scene is already attached.");
    config.adapter = adapter;
  }
  /** @internal */
  nodeSnapshot(node: SceneNode): SceneNodeSnapshot {
    assertNode(node);
    if (state(node).owner !== this) throw new Error("Foreign scene node.");
    return world(node);
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
    for (const node of [
      this.root,
      this.axes,
      this.content,
      ...config.groups,
      ...config.objects,
    ])
      Object.assign(state(node), {
        parent: null,
        children: [],
        transform: identityMatrix(),
        opacity: 1,
        visible: true,
      });
    state(this.root).transform = [...config.initial];
    const objects = [...config.objects].filter((node) => handles.has(node));
    state(this.root).children = [this.axes, this.content, ...objects];
    state(this.axes).parent = this.root;
    state(this.content).parent = this.root;
    for (const node of objects) {
      const item = state(node);
      Object.assign(item, item.home, { parent: this.root });
      handles.get(node)!.reset();
    }
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
