import { build } from "esbuild";
import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  copyFile,
  rm,
} from "node:fs/promises";
import { createHash } from "node:crypto";
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
await mkdir(".build", { recursive: true });
await build({
  entryPoints: ["scripts/compile-data.mjs"],
  outfile: ".build/compile-data.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  banner: {
    js: "import{createRequire}from'node:module';import{fileURLToPath}from'node:url';import{dirname}from'node:path';const require=createRequire(import.meta.url);const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);",
  },
});
await import(path.resolve(".build/compile-data.mjs"));
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
  legalComments: "linked",
  banner: {
    js: "import {createRequire} from 'node:module';import{fileURLToPath}from'node:url';import{dirname}from'node:path';const require=createRequire(import.meta.url);const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);",
  },
});
execFileSync(process.execPath, ["scripts/compile-grid.mjs"], {
  stdio: "inherit",
});

// One browser graph shares the runtime across all public entry points. Assets
// stay separate from JavaScript so bundlers can cache and request them normally.
for (const name of await readdir("dist"))
  if (
    /^chunk-.*\.js(?:\.LEGAL\.txt)?$/.test(name) ||
    /^(index|data|interaction|shaders|animation|transform)\.js\.LEGAL\.txt$/.test(
      name,
    )
  )
    await rm(path.join("dist", name));
await rm("dist/assets", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
const assetPlugin = {
  name: "browser-assets",
  setup(b) {
    b.onLoad({ filter: /\.png$/ }, async (args) => {
      const bytes = await readFile(args.path);
      const hash = createHash("sha256")
        .update(bytes)
        .digest("hex")
        .slice(0, 12);
      const name = `${path.basename(args.path, ".png")}-${hash}.png`;
      await writeFile(path.join("dist/assets", name), bytes);
      return {
        contents: `export default new URL(${JSON.stringify(`./assets/${name}`)}, import.meta.url).href;`,
        loader: "js",
      };
    });
  },
};
await build({
  entryPoints: [
    "src/index.ts",
    "src/interaction.ts",
    "src/shaders.ts",
    "src/data.ts",
    "src/animation.ts",
    "src/transform.ts",
  ],
  outdir: "dist",
  chunkNames: "chunk-[hash]",
  bundle: true,
  platform: "browser",
  splitting: true,
  format: "esm",
  target: "es2022",
  plugins: [sourcePlugin, assetPlugin],
  minify: true,
  legalComments: "linked",
  metafile: true,
}).then(async (result) => {
  const shipped = Object.entries(result.metafile.outputs).flatMap(
    ([, output]) =>
      Object.entries(output.inputs)
        .filter(([, value]) => value.bytesInOutput > 0)
        .map(([name]) => name),
  );
  // Device-owned runtime plans may include TypeShade's IR emitter. Its TypeScript
  // frontend and language service must never enter the browser bundle.
  const leaked = shipped.filter((p) =>
    /typescript\/|typeshade\/src\/(compiler|language-service)\//.test(p),
  );
  if (leaked.length)
    throw new Error(`Compiler leaked into browser entry: ${leaked.join(", ")}`);
});
execFileSync("node_modules/.bin/tsc", [], { stdio: "inherit" });

await build({
  entryPoints: ["src/vite.ts"],
  outfile: "dist/vite.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["./compiler.js"],
  minify: true,
  legalComments: "linked",
});

for (const file of await readdir("dist"))
  if (file.endsWith(".LEGAL.txt")) {
    const target = `dist/${file}`;
    await writeFile(
      target,
      (await readFile(target, "utf8")).replace(/[ \t]+$/gm, ""),
    );
  }

await copyFile("src/client.d.ts", "dist/client.d.ts");
