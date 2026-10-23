import { readFile, writeFile, mkdir } from "node:fs/promises";
import { compilePlot } from "../dist/compiler.js";
await mkdir("examples/generated", { recursive: true });
for (const [name, options] of [
  ["curve", { parameters: { exponent: 2 } }],
  ["helix", { kind: "parametric" }],
]) {
  const fileName = `examples/${name}.shade.ts`;
  const program = compilePlot(await readFile(fileName, "utf8"), {
    fileName,
    ...options,
  });
  await writeFile(
    `examples/generated/${name}.js`,
    `export default ${JSON.stringify(program)};\n`,
  );
}
