import { readFile, writeFile, mkdir } from "node:fs/promises";
import { compilePlot } from "../dist/compiler.js";
await mkdir("examples/generated", { recursive: true });
for (const [name, options] of [
  ["curve", { parameters: { exponent: 2 } }],
  [
    "helix",
    {
      kind: "parametric",
      parameterOrigin: { axis: "z", scale: 0.4, prepare: "prepare" },
    },
  ],
  ["sine", { parameters: { frequency: 1 } }],
  [
    "surface-curve",
    { kind: "parametric", parameters: { phase: 0, lift: 0.04 } },
  ],
  ["surface", { kind: "surface", parameters: { phase: 0, amplitude: 1 } }],
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
