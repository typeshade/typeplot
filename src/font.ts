import type { Runtime, Texture } from "typeshade/runtime";
import atlasUrl from "../assets/typeplot-font.png";

/** Upload the offline SDF resource; all glyph reconstruction runs in TypeShade. */
export async function loadGlyphAtlas(runtime: Runtime): Promise<Texture> {
  const response = await fetch(atlasUrl);
  if (!response.ok) throw new Error("Cannot load the TypePlot font atlas.");
  const image = await createImageBitmap(await response.blob(), {
    premultiplyAlpha: "none",
    colorSpaceConversion: "none",
  });
  let texture: Texture | undefined;
  try {
    texture = runtime.texture({
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
    texture?.destroy();
    throw error;
  } finally {
    image.close();
  }
}
