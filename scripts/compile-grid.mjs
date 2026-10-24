import { readFile, writeFile } from "node:fs/promises";
import { compilePlot } from "../dist/compiler.js";
const fileName = "shaders/grid-surface.shade.ts";
const program = compilePlot(await readFile(fileName, "utf8"), {
  fileName,
  kind: "surface",
  parameters: {
    gridXMin: 0,
    gridXMax: 1,
    gridZMin: 0,
    gridZMax: 1,
    gridRows: 2,
    gridColumns: 2,
    gridCount: 4,
    heightScale: 1,
    heightOffset: 0,
  },
});
await writeFile(".build/grid-surface.json", JSON.stringify(program));
console.log("Compiled the named resident-grid height field.");
