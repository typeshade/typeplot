import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compile, packModule } from "typeshade";
const fileName = path.resolve("shaders/data.shade.ts");
const result = compile(readFileSync(fileName, "utf8"), {
  fileName,
  readDocument: (name) => {
    try {
      return readFileSync(name, "utf8");
    } catch {
      return undefined;
    }
  },
});
const errors = result.diagnostics.filter((d) => d.category === "error");
if (errors.length)
  throw new Error(
    errors
      .map((d) => `${d.fileName}:${d.line}:${d.character}: ${d.message}`)
      .join("\n"),
  );
if (!result.wgsl) throw new Error("Data shaders must emit WGSL.");
const packed = packModule(result.module);
for (const entry of [
  ...Object.values(packed.gl?.draws ?? {}),
  ...Object.values(packed.gl?.vertices ?? {}),
])
  if (entry.none) throw new Error(entry.none);
const manifest = {
  ...packed,
  entries: packed.entries.map((entry) => ({
    ...entry,
    ...(entry.line
      ? {
          line: {
            ...entry.line,
            file: path
              .relative(process.cwd(), entry.line.file)
              .split(path.sep)
              .join("/"),
          },
        }
      : {}),
  })),
};
writeFileSync(".build/data-program.json", JSON.stringify(manifest));
console.log("Compiled named TypeShade data, axes and text shaders.");
