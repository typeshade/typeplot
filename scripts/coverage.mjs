// Bundle and run scripts/coverage-check.ts against the shader sources in this tree.
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
const outfile = path.resolve(".build/coverage-check.mjs");
await build({
  entryPoints: ["scripts/coverage-check.ts"],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "bundle",
  plugins: [sourcePlugin],
  logLevel: "warning",
  banner: {
    js: "import{createRequire}from'node:module';import{fileURLToPath}from'node:url';import{dirname}from'node:path';const require=createRequire(import.meta.url);const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);",
  },
});
await import(pathToFileURL(outfile).href);
