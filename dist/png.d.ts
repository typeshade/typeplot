/** PNG encoding only: pixels have already been rendered by TypeShade and read from a GPU texture. */
export declare function encodePng(bytes: Uint8Array, width: number, height: number): Promise<Blob>;
