// Offline adapter to the original X-GIS SDF generator. No browser rasterizer.
import { readFileSync, writeFileSync } from "node:fs";
import { computeSDF } from "./vendor/xgis-distance-transform.ts";

const width = Number(process.argv[2]);
const height = Number(process.argv[3]);
const radius = Number(process.argv[4]);
if (![width, height, radius].every((n) => Number.isFinite(n) && n > 0))
  throw new Error("Expected positive glyph width, height and radius.");
const input = readFileSync(0);
const cellSize = width * height;
if (input.length % cellSize) throw new Error("Incomplete glyph alpha cell.");
const output = new Uint8Array(input.length);
for (let at = 0; at < input.length; at += cellSize)
  output.set(
    computeSDF(input.subarray(at, at + cellSize), width, height, radius),
    at,
  );
writeFileSync(1, output);
