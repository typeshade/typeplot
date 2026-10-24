import type { Frame, Pack, Texture } from "typeshade/runtime";
import { RenderSession } from "./session.js";
import type { LoadedProgram, UniformValues } from "./scene-field.js";
interface Cache {
    texture: Texture;
    key: string;
}
export interface OriginPacket {
    cache: Cache;
    key: string;
    transient: boolean;
}
/** One GPU texel prepares the extended-precision origin; SDF work stays local f32. */
export declare class CurveOrigin {
    private readonly owner;
    private readonly loaded;
    private readonly manifest;
    private readonly parameters;
    private pipeline;
    private cache?;
    constructor(owner: RenderSession, loaded: LoadedProgram, manifest: Pack, parameters: readonly string[]);
    initialize(): Promise<void>;
    packet(u: UniformValues, transient?: boolean, dataGeneration?: number): OriginPacket;
    record(frame: Frame, packet: OriginPacket, bindings: Readonly<Record<string, unknown>>): void;
    finish(packet: OriginPacket, success?: boolean): void;
    dispose(): void;
}
export {};
