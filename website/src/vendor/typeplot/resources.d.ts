/** Start cacheable font downloads without allocating a device, image or texture. */
export declare function preloadFonts(options?: {
    readonly korean?: boolean;
}): Promise<void>;
