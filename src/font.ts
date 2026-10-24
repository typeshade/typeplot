import type { Runtime, Texture } from "typeshade/runtime";
import atlasUrl from "../assets/typeplot-font.png";
import baseAtlasUrl from "../assets/typeplot-font-base.png";

// Figures share compressed bytes, while each runtime owns its GPU texture.
const resources = new Map<string, Promise<Blob>>();
function resource(url: string): Promise<Blob> {
  let pending = resources.get(url);
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error("Cannot load the TypePlot font atlas.");
      return response.blob();
    });
    resources.set(url, pending);
    void pending.catch(() => resources.delete(url));
  }
  return pending;
}

/** Start I/O before choosing a backend; it owns no decoded image or GPU object. */
export function prepareGlyphAtlas(full = false): Promise<Blob> {
  return resource(full ? atlasUrl : baseAtlasUrl);
}

/** Upload the offline SDF resource; all glyph reconstruction runs in TypeShade. */
export async function loadGlyphAtlas(
  runtime: Runtime,
  full = false,
  target?: Texture,
  active: () => boolean = () => true,
  prepared?: Promise<Blob>,
): Promise<Texture> {
  const image = await createImageBitmap(
    await (prepared ?? prepareGlyphAtlas(full)),
    {
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
    },
  );
  let texture: Texture | undefined;
  try {
    if (!active())
      throw new DOMException("The font upload was cancelled.", "AbortError");
    texture =
      target ??
      runtime.texture({
        size: [image.width, image.height],
        format: "rgba8unorm",
      });
    if (runtime.tier === "webgpu")
      (runtime.device as GPUDevice).queue.copyExternalImageToTexture(
        { source: image },
        { texture: texture.texture as GPUTexture },
        [image.width, image.height],
      );
    else {
      const gl = runtime.device as WebGL2RenderingContext;
      const bound = gl.getParameter(
        gl.TEXTURE_BINDING_2D,
      ) as WebGLTexture | null;
      gl.bindTexture(gl.TEXTURE_2D, texture.texture as WebGLTexture);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.bindTexture(gl.TEXTURE_2D, bound);
    }
    return texture;
  } catch (error) {
    if (!target) texture?.destroy();
    throw error;
  } finally {
    image.close();
  }
}
