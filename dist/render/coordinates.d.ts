import type { Frame, Texture } from "typeshade/runtime";
import { RenderSession } from "./session.js";
import type { ScenePrimaryFrame } from "./scene-field.js";
export interface CoordinatePacket {
    bindings: Record<string, unknown>;
    finish(success: boolean): void;
}
/** Load extended-precision axes only when absolute coordinates exceed the f32 budget. */
export declare class CoordinatesRenderer {
    private readonly owner;
    private readonly format;
    private readonly surface;
    private readonly limit;
    private readonly pack;
    private readonly program;
    private labels;
    private backdrop;
    private overlay;
    private cache?;
    constructor(owner: RenderSession, format: string, surface: boolean, limit: number);
    initialize(): Promise<void>;
    private draw;
    prepare(frame: Frame, base: ScenePrimaryFrame, ratio: number, transient: boolean): CoordinatePacket;
    background(frame: Frame, packet: CoordinatePacket, target: Texture): void;
    foreground(frame: Frame, packet: CoordinatePacket, target: Texture | GPUCanvasContext | WebGL2RenderingContext): void;
    dispose(): void;
}
