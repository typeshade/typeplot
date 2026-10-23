import { build } from "esbuild";
import { readFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
await mkdir("dist", { recursive: true });
const sourcePlugin = {
  name: "shader-source",
  setup(b) {
    b.onResolve({ filter: /\?source$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?source$/, "")),
      namespace: "shader-source",
    }));
    b.onLoad({ filter: /.*/, namespace: "shader-source" }, async (args) => ({
      contents: await readFile(args.path, "utf8"),
      loader: "text",
    }));
  },
};
await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  minify: true,
  metafile: true,
}).then(async (result) => {
  const shipped = Object.entries(
    result.metafile.outputs["dist/index.js"].inputs,
  )
    .filter(([, value]) => value.bytesInOutput > 0)
    .map(([name]) => name);
  const leaked = shipped.filter((p) =>
    /typescript\/|typeshade\/src\/(compiler|core\/emit)/.test(p),
  );
  if (leaked.length)
    throw new Error(`Compiler leaked into browser entry: ${leaked.join(", ")}`);
});
await build({
  entryPoints: ["src/interaction.ts", "src/shaders.ts"],
  outdir: "dist",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  plugins: [sourcePlugin],
  minify: true,
});
await build({
  entryPoints: ["src/compiler.ts"],
  outfile: "dist/compiler.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "bundle",
  plugins: [sourcePlugin],
  minify: true,
  banner: {
    js: "import {createRequire} from 'node:module';import{fileURLToPath}from'node:url';import{dirname}from'node:path';const require=createRequire(import.meta.url);const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);",
  },
});
execFileSync("node_modules/.bin/tsc", [], { stdio: "inherit" });
