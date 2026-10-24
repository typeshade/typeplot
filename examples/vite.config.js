import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { typeplot } from "typeplot/vite";

export default defineConfig({
  root: fileURLToPath(new URL("./vite", import.meta.url)),
  plugins: [
    typeplot({
      configure: (file) =>
        file.endsWith("curve.shade.ts")
          ? { parameters: { exponent: 2 } }
          : file.endsWith("helix.shade.ts")
            ? { parameterOrigin: { axis: "z", scale: 0.4, prepare: "prepare" } }
            : {},
    }),
  ],
  build: {
    target: "es2022",
    outDir: fileURLToPath(new URL("../.build/vite-example", import.meta.url)),
    emptyOutDir: true,
  },
});
