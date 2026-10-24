import type { PlotProgram, PlotKind, PlotQuality, PlotPick, SurfaceOptions, SurfaceDomain } from "./types.js";
import { type AnimationClip, type TweenOptions } from "./animation.js";
import { type Matrix4 } from "./transform.js";
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
/** Additional callbacks prepared before the plot's first complete frame. */
export interface SceneObjectSpec extends SceneObjectOptions {
    readonly program: PlotProgram;
}
/** @internal Snapshot mutable insertion values before asynchronous preparation. */
export declare function captureSceneObjectOptions(options: SceneObjectOptions): SceneObjectOptions;
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
    attach(node: SceneObject, program: PlotProgram, options: SceneObjectOptions): Promise<SceneObjectHandle>;
    detach(node: SceneObject): Promise<void>;
    pick(position: readonly [number, number], radius: number): Promise<ScenePick | null>;
}
export interface SceneNodeSnapshot {
    readonly transform: Matrix4;
    readonly inverse: Matrix4;
    readonly opacity: number;
}
export declare const MAX_SCENE_OBJECTS = 16;
declare function world(node: SceneNode): SceneNodeSnapshot;
/** A local affine transform; its world matrix is composed from its ancestors. */
export declare class SceneNode {
    protected constructor(owner: PlotScene);
    get parent(): SceneGroup | null;
    getTransform(): Matrix4;
    getWorldTransform(): Matrix4;
    setTransform(value: Matrix4): this;
    getOpacity(): number;
    setOpacity(value: number): this;
    isVisible(): boolean;
    setVisible(value: boolean): this;
    /** Captured local endpoints make reverse seeking and grouped clips deterministic. */
    transition(to: SceneTransition, options?: TweenOptions): AnimationClip;
}
/** Reparenting retains local transforms. Cross-scene parents and cycles are refused. */
export declare class SceneGroup extends SceneNode {
    /** @internal Create groups with plot.scene.group(). */
    constructor(owner: PlotScene);
    get children(): readonly SceneNode[];
    add(...children: readonly SceneNode[]): this;
    remove(...children: readonly SceneNode[]): this;
}
/** A compiled callback instance sharing the plot's runtime and camera. */
export declare class SceneObject extends SceneNode {
    readonly id: string;
    readonly kind: PlotKind;
    /** @internal Use plot.scene.add(). */
    constructor(owner: PlotScene, id: string, kind: PlotKind);
    private handle;
    parameters(): Readonly<Record<string, number>>;
    setParameters(values: Readonly<Record<string, number>>): this;
    setData(name: string, values: Float32Array): this;
    setStyle(value: SceneObjectStyle): this;
    setDomain(value: readonly [number, number]): this;
    setQuality(value: PlotQuality): this;
    setSurface(value: Omit<SurfaceOptions, "colorBar">): this;
    setSurfaceDomain(value: SurfaceDomain): this;
    transition(to: SceneObjectTransition, options?: TweenOptions): AnimationClip;
    remove(): Promise<void>;
}
/** One compiled plot's retained coordinate frame and mathematical content, on one GPU canvas. */
export declare class PlotScene {
    readonly root: SceneGroup;
    readonly axes: SceneNode;
    readonly content: SceneNode;
    /** @internal A plot supplies invalidation and lifecycle hooks; this object owns no GPU resources. */
    constructor(transform?: Matrix4, invalidate?: () => void, alive?: () => void);
    /** Prepared additional objects; the original callback remains scene.content. */
    get objects(): readonly SceneObject[];
    add(program: PlotProgram, options?: SceneObjectOptions): Promise<SceneObject>;
    remove(node: SceneObject): Promise<void>;
    pick(position: readonly [number, number], radius?: number): Promise<ScenePick | null>;
    /** @internal */
    connect(adapter: SceneAdapter): void;
    /** @internal */
    nodeSnapshot(node: SceneNode): SceneNodeSnapshot;
    group(...children: readonly SceneNode[]): SceneGroup;
    /** Restore default branches; custom groups detach and may be added again explicitly. */
    reset(): void;
    /** @internal One coherent pair of world transforms and inherited opacity for the shaders. */
    snapshot(): {
        axes: ReturnType<typeof world>;
        content: ReturnType<typeof world>;
    };
}
export {};
