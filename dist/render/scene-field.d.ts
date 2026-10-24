import { type OriginPacket } from "./origin.js";
import type { Frame, Runtime, Texture } from "typeshade/runtime";
import type { PlotProgram, PlotQuality, SurfaceDomain, SurfaceOptions } from "../types.js";
import type { PlotScene, SceneNode, SceneObjectHandle, SceneObjectOptions, SceneObjectStyle } from "../scene.js";
import { RenderSession } from "./session.js";
export type UniformValues = Readonly<Record<string, unknown>>;
export type LoadedProgram = ReturnType<Runtime["load"]>;
export interface CurveCache {
    intervals: Texture;
    candidates: Texture;
    key: string;
}
export interface ScenePrimaryFrame {
    readonly u: UniformValues;
    readonly bindings: Readonly<Record<string, unknown>>;
    readonly generation: number;
    readonly cache?: CurveCache;
}
export interface ScenePacket {
    readonly field: SceneField;
    readonly u: UniformValues;
    readonly bindings: Readonly<Record<string, unknown>>;
    readonly key: string;
    readonly geometry: string;
    readonly cache?: CurveCache;
    readonly external: boolean;
    readonly origin?: OriginPacket;
}
/** Per-callback resources. The shared TypeShade Runtime owns pipelines and submissions. */
export declare class SceneField implements SceneObjectHandle {
    readonly id: string;
    readonly node: SceneNode;
    readonly program: PlotProgram;
    readonly loaded: LoadedProgram;
    private readonly owner;
    private readonly scene;
    private readonly doc;
    private readonly invalidate;
    readonly primary: boolean;
    private readonly work;
    private readonly manifest;
    private readonly inputNames;
    private readonly data;
    private readonly inputs;
    private readonly retired;
    private values;
    private curveDomain;
    private search;
    private appearance;
    private ink;
    private surface;
    private bounds;
    private automaticDepth;
    private readonly initial;
    private drawPipeline;
    private intervalPipeline?;
    private candidatePipeline?;
    private queryPipeline?;
    private displayCache?;
    private generation;
    private closed;
    private retirement?;
    readonly accelerated: boolean;
    constructor(id: string, node: SceneNode, program: PlotProgram, loaded: LoadedProgram, owner: RenderSession, scene: PlotScene, doc: Document, invalidate: () => void, options: SceneObjectOptions, primary: boolean, accelerate: boolean);
    private originResources?;
    private alive;
    initialize(externalCache?: boolean): Promise<void>;
    private createCache;
    packet(base: ScenePrimaryFrame, ratio: number, transient: boolean): ScenePacket;
    private draw;
    prepare(frame: Frame, packet: ScenePacket): void;
    layer(frame: Frame, packet: ScenePacket, colors: Texture, depths: Texture, x: number, y: number, width: number, height: number): void;
    query(packet: ScenePacket, pixel: readonly [number, number]): Promise<{
        point: readonly [number, number, number];
        parameter?: number;
    } | null>;
    parameters(): Readonly<Record<string, number>>;
    checkParameters(values: Readonly<Record<string, number>>): void;
    setParameters(values: Readonly<Record<string, number>>): void;
    setData(name: string, values: Float32Array): void;
    setStyle(value: SceneObjectStyle): void;
    setDomain(value: readonly [number, number]): void;
    setQuality(value: PlotQuality): void;
    setSurface(value: Omit<SurfaceOptions, "colorBar">): void;
    setSurfaceDomain(value: SurfaceDomain): void;
    reset(): void;
    afterFrame(): void;
    releasePacket(packet: ScenePacket): void;
    close(): Promise<void>;
    dispose(after?: Promise<unknown>): Promise<void>;
}
