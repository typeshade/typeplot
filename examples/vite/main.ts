/// <reference types="vite/client" />
/// <reference path="../../dist/client.d.ts" />
import { createPlot, type Plot } from "typeplot";
import curveProgram from "../curve.shade.ts?plot";
import helixProgram from "../helix.shade.ts?plot=3d";
import "./style.css";

const curveCanvas = document.querySelector<HTMLCanvasElement>("#curve")!;
const helixCanvas = document.querySelector<HTMLCanvasElement>("#helix")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const controls = document.querySelector<HTMLFieldSetElement>("#controls")!;
const exponent = document.querySelector<HTMLInputElement>("#exponent")!;
const value = document.querySelector<HTMLOutputElement>("#value")!;
const mode = document.querySelector<HTMLButtonElement>("#mode")!;
const reset = document.querySelector<HTMLButtonElement>("#reset")!;
const plots: Plot[] = [];
let disposed = false;
let threeD = false;

function cleanup() {
  disposed = true;
  plots.forEach((plot) => plot.destroy());
  controls.disabled = true;
  exponent.oninput = mode.onclick = reset.onclick = null;
}
function report(error: Error) {
  status.textContent = `Unable to render the plot: ${error.message}`;
}
async function start() {
  const requested =
    new URLSearchParams(location.search).get("backend") ?? "auto";
  if (!["auto", "webgpu", "webgl2"].includes(requested))
    throw new Error("Choose auto, webgpu or webgl2 for the backend query.");
  const backend = requested as "auto" | "webgpu" | "webgl2";
  const curve = await createPlot(curveCanvas, curveProgram, {
    bounds: { x: [0, 1], y: [0, 1] },
    probe: 0.5,
    backend,
    label: "Power function",
    onError: report,
  });
  if (disposed) {
    curve.destroy();
    return;
  }
  plots.push(curve);
  const helix = await createPlot(helixCanvas, helixProgram, {
    bounds: { x: [-6.28, 6.28], y: [-1.25, 1.25] },
    backend,
    label: "Spatial helix",
    onError: report,
  });
  if (disposed) {
    helix.destroy();
    return;
  }
  plots.push(helix);
  status.textContent = `Renderer: ${curve.backend}`;
  controls.disabled = false;
  exponent.oninput = () => {
    curve.setParameters({ exponent: Number(exponent.value) });
    value.value = String(Number(exponent.value));
  };
  mode.onclick = () => {
    threeD = !threeD;
    curve.setMode(threeD ? "3d" : "2d");
    mode.setAttribute("aria-pressed", String(threeD));
  };
  reset.onclick = () => {
    curve.reset();
    helix.reset();
    threeD = false;
    exponent.value = value.value = "2";
    mode.setAttribute("aria-pressed", "false");
  };
}
void start().catch((error) => {
  cleanup();
  report(error instanceof Error ? error : new Error(String(error)));
});
const pagehide = (event: PageTransitionEvent) => {
  if (!event.persisted) cleanup();
};
window.addEventListener("pagehide", pagehide);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", pagehide);
    cleanup();
  });
