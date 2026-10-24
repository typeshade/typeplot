import { type AnimationClip, type TweenOptions } from "./animation.js";
import { type Matrix4 } from "./transform.js";
export interface SceneTransition {
    readonly transform?: Matrix4;
    readonly opacity?: number;
}
declare function world(node: SceneNode): {
    transform: Matrix4;
    inverse: Matrix4;
    opacity: number;
};
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
/** One compiled plot's retained coordinate frame and mathematical content, on one GPU canvas. */
export declare class PlotScene {
    readonly root: SceneGroup;
    readonly axes: SceneNode;
    readonly content: SceneNode;
    /** @internal A plot supplies invalidation and lifecycle hooks; this object owns no GPU resources. */
    constructor(transform?: Matrix4, invalidate?: () => void, alive?: () => void);
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
