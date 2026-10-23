import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const target = resolve(root, "website/src/vendor/typeplot");
await mkdir(target, { recursive: true });
for (const name of [
  "index.js",
  "data.js",
  "index.d.ts",
  "data.d.ts",
  "types.d.ts",
  "gpu-renderer.d.ts",
]) {
  await copyFile(resolve(root, "dist", name), resolve(target, name));
}
for (const name of await readdir(resolve(root, "dist"))) {
  if (/^(index|data)\.js\.LEGAL\.txt$/.test(name))
    await copyFile(resolve(root, "dist", name), resolve(target, name));
}
for (const name of ["curve", "helix"])
  await copyFile(
    resolve(root, "examples/generated", `${name}.js`),
    resolve(target, `${name}.js`),
  );
for (const name of ["LICENSE", "NOTICE"])
  await copyFile(resolve(root, name), resolve(target, name));
// Preserve provenance for identical runtime bytes, including in shallow CI checkouts.
const hash = createHash("sha256");
for (const name of [
  "index.js",
  "data.js",
  "index.d.ts",
  "data.d.ts",
  "types.d.ts",
  "gpu-renderer.d.ts",
  "curve.js",
  "helix.js",
])
  hash
    .update(name)
    .update("\0")
    .update(await readFile(resolve(target, name)))
    .update("\0");
const runtimeSha256 = hash.digest("hex");
let previous;
try {
  previous = JSON.parse(
    await readFile(resolve(target, "version.json"), "utf8"),
  );
} catch {
  /* First synchronization. */
}
const commit =
  previous?.runtimeSha256 === runtimeSha256 &&
  /^[0-9a-f]{40}$/.test(previous.commit)
    ? previous.commit
    : execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim();
if (!/^[0-9a-f]{40}$/.test(commit))
  throw new Error(
    "A committed TypePlot runtime is required for website provenance.",
  );
await writeFile(
  resolve(target, "version.json"),
  JSON.stringify(
    { commit, source: "https://github.com/typeshade/typeplot", runtimeSha256 },
    null,
    2,
  ) + "\n",
);
await writeFile(
  resolve(target, "README.md"),
  `# TypePlot browser runtime\n\nBuilt from [typeshade/typeplot](https://github.com/typeshade/typeplot/tree/${commit}) at runtime source commit \`${commit}\`.\n\nRun the library build and examples generation, then \`npm run sync:typeplot\` in website/.\nJavaScript is generated and ignored by Git. Declarations, source provenance, Apache-2.0 LICENSE,\nand NOTICE are retained. Compiled curve and helix programs come from the repository's named\nTypeShade callbacks. The website does not compile visitor source or load a CDN runtime.\n`,
);
console.log(
  `Synced TypePlot browser runtime and shader examples from ${commit}.`,
);
