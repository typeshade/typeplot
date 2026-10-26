// Curve coverage check: evaluate the shader's own distance queries on the CPU,
// through TypeShade's CPU oracle, and compare them with an f64 ground truth.
//
// Every visibility bug so far (fb51c63, c0b26cb, d11039d, #27) was found by eye.
// This check measures the shipped shader text (plotSource) against a dense,
// edge-bisected sampling of the same callback, for callbacks that are hard for a
// closest-point search: domain edges with an infinite slope, both-sided edges,
// unbounded values and a smooth control. See docs/verification.md.
//
// Run: npm run check:coverage [-- --only <name>]
//
// The shader runs as a correctly rounding f32 machine (precision "f32"), which
// is what the GPU computes; the projection that places the truth uses f64.
import path from "node:path";
import { compile, compileModuleJs } from "typeshade";
import { plotSource } from "../src/plot-source.js";

type Vec2 = [number, number];
type Fn = (...args: unknown[]) => unknown;
interface Cpu {
  setBinding(name: string, value: unknown): void;
  readonly fns: Record<string, Fn>;
}

const args = process.argv.slice(2);
const option = (name: string) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
};
const precision = "f32";
const only = option("--only");

/** A callback with its exact JS twin. NaN marks the omitted domain. */
interface Callback {
  readonly name: string;
  readonly body: string;
  readonly exact: (x: number) => number;
  /** World points where the search is hardest: edges, steep or flat parts. */
  readonly focus: readonly Vec2[];
}
const callbacks: readonly Callback[] = [
  {
    name: "sqrt",
    body: "if (x < 0) { return 1e20; }\n  return sqrt(x);",
    exact: (x) => (x < 0 ? NaN : Math.sqrt(x)),
    focus: [
      [0, 0],
      [0.01, 0.1],
      [1, 1],
    ],
  },
  {
    name: "quarter-power",
    body: "if (x < 0) { return 1e20; }\n  return pow(x, 0.25);",
    exact: (x) => (x < 0 ? NaN : Math.pow(x, 0.25)),
    focus: [[0, 0]],
  },
  {
    name: "semicircle",
    body: "const r = 1 - x * x;\n  if (r < 0) { return 1e20; }\n  return sqrt(r);",
    exact: (x) => (1 - x * x < 0 ? NaN : Math.sqrt(1 - x * x)),
    focus: [
      [-1, 0],
      [1, 0],
      [0, 1],
    ],
  },
  {
    name: "log",
    body: "if (x <= 0) { return 1e20; }\n  return log(x);",
    exact: (x) => (x <= 0 ? NaN : Math.log(x)),
    focus: [
      [1, 0],
      [0.05, Math.log(0.05)],
      [1e-4, Math.log(1e-4)],
    ],
  },
  {
    name: "fast-sine",
    body: "return sin(40 * x);",
    exact: (x) => Math.sin(40 * x),
    focus: [
      [0, 0],
      [Math.PI / 80, 1],
    ],
  },
  {
    name: "sine",
    body: "return sin(3 * x);",
    exact: (x) => Math.sin(3 * x),
    focus: [
      [0, 0],
      [Math.PI / 6, 1],
    ],
  },
];

interface View {
  readonly name: string;
  /** 0: 2D, 1: orthographic 3D, 2: perspective 3D. */
  readonly view3d: 0 | 1 | 2;
  readonly yaw: number;
  readonly pitch: number;
}
const views: readonly View[] = [
  { name: "2d", view3d: 0, yaw: 0, pitch: 0 },
  { name: "3d-front", view3d: 1, yaw: 0, pitch: 0 },
  { name: "3d-turned", view3d: 1, yaw: 0.5, pitch: 0.3 },
  { name: "3d-perspective", view3d: 2, yaw: 0.4, pitch: 0.25 },
];
const zooms = [1, 100];
const resolution: Vec2 = [800, 600];
const pixelRatio = 1;
const curveWidth = 2;
const baseSpan: Vec2 = [4, 3];
/** Physical pixels checked around each focus point. */
const cells = 24;

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
// interaction.ts default lens: a 45 degree field of view at distance 3.
const lens = [Math.tan(Math.fround(Math.PI / 4) * 0.5), 3];

function uniforms(view: View, center: Vec2, span: Vec2) {
  return {
    resolution,
    plotCenter: center,
    plotSpan: span,
    plotRotation: [view.yaw, view.pitch],
    rotationBasis: [
      Math.sin(view.yaw),
      Math.cos(view.yaw),
      Math.sin(view.pitch),
      Math.cos(view.pitch),
    ],
    plotPan: [0, 0],
    plotBlend: view.view3d === 0 ? 0 : 1,
    appearance: [1, 1, curveWidth, 11],
    decorations: 7,
    labelStyle: [1, 1, 0, 0],
    decorationOpacity: [1, 1, 1],
    model: identity,
    inverseModel: identity,
    axesModel: identity,
    inverseAxesModel: identity,
    sceneOpacity: [1, 1],
    cameraLens: lens,
    plotCenterZ: 0,
    probe: -1e9,
    parameterFocusSeed: center[0],
    view3d: view.view3d,
    parameterBounds: [0, 0],
    parameterMode: 3,
    curveQuality: [64, 5],
    curvePattern: [0, 0.2, 0, 0.55],
    curveTiles: [0, 0, 16, 0],
    surfaceBounds: [0, 0, 0, 0],
    surfaceDomainMode: 0,
    surfaceRange: [0, 1],
    surfaceHeight: [0, 1],
    surfaceDepth: [0, 1],
    surfaceRender: [0, 0, 0, 0],
    surfaceFlags: 0,
  };
}

/** The monomorphized copy of a shared function for this program's callback. */
function specialized(cpu: Cpu, name: string): Fn {
  const found = Object.keys(cpu.fns).filter((key) =>
    key.startsWith(`${name}_`),
  );
  if (found.length !== 1)
    throw new Error(
      `Expected one specialization of ${name}, found ${found.join(", ") || "none"}. ` +
        "Update scripts/coverage-check.ts with the shader.",
    );
  return cpu.fns[found[0]];
}

function load(callback: Callback) {
  const source = `"use typeshade";\nexport function sample(x: f32): f32 {\n  ${callback.body}\n}\n`;
  const plot = plotSource(source, {
    kind: "scalar",
    fileName: path.resolve(`coverage/${callback.name}.shade.ts`),
  });
  const result = compile(plot.wrapper, {
    fileName: plot.wrapperFile,
    readDocument: plot.readDocument,
  });
  const errors = result.diagnostics.filter((d) => d.category === "error");
  if (errors.length)
    throw new Error(
      errors.map((d) => `${d.fileName}:${d.line}: ${d.message}`).join("\n"),
    );
  const tested = compileModuleJs(result.module, {
    gpuStubs: true,
    precision,
  }) as unknown as Cpu;
  const exact = compileModuleJs(result.module, {
    gpuStubs: true,
    precision: "f64",
  }) as unknown as Cpu;
  return { tested, exact };
}

/** Exact pixel position of a world point, in CSS pixels with y up. */
function projector(cpu: Cpu, view: View, u: ReturnType<typeof uniforms>) {
  if (view.view3d === 0)
    return ([x, y]: Vec2): Vec2 => [
      ((x - u.plotCenter[0]) / u.plotSpan[0] + 0.5) * resolution[0],
      ((y - u.plotCenter[1]) / u.plotSpan[1] + 0.5) * resolution[1],
    ];
  return ([x, y]: Vec2) => cpu.fns.project([x, y, 0], u) as Vec2;
}

/** A truth segment. `isolated` marks a single f32-representable point whose
 * neighbours are more than a chord apart: f32 cannot draw the curve there. */
type Segment = [Vec2, Vec2, boolean];

/** A dense polyline of the exact curve near the cells. Intervals subdivide until
 * their projected chord is below 0.2 px, and each domain edge is bisected to an
 * actual endpoint, so the truth never joins across an omitted domain. */
function truthSegments(
  callback: Callback,
  project: (p: Vec2) => Vec2,
  low: number,
  high: number,
  box: [number, number, number, number],
): Segment[] {
  const segments: Segment[] = [];
  const quantize = Math.fround;
  const valid = (t: number) => Number.isFinite(callback.exact(quantize(t)));
  const at = (t: number) => project([quantize(t), callback.exact(quantize(t))]);
  const near = (a: Vec2, b: Vec2) => {
    const pad = Math.hypot(b[0] - a[0], b[1] - a[1]) + curveWidth + 2;
    return (
      Math.max(a[0], b[0]) >= box[0] - pad &&
      Math.min(a[0], b[0]) <= box[2] + pad &&
      Math.max(a[1], b[1]) >= box[1] - pad &&
      Math.min(a[1], b[1]) <= box[3] + pad
    );
  };
  // The shader can only evaluate f32 parameters, so the truth may not be
  // finer: an edge bisects to the last valid f32 parameter, and parameters
  // closer than one f32 step are separate points, never joined by a chord.
  const edge = (inside: number, outside: number) => {
    for (let i = 0; i < 200; i++) {
      const mid = quantize((inside + outside) / 2);
      if (mid === inside || mid === outside) break;
      if (valid(mid)) inside = mid;
      else outside = mid;
    }
    return inside;
  };
  const separate = (a: number, b: number) => {
    const fa = Math.fround(a),
      fb = Math.fround(b),
      mid = Math.fround((fa + fb) / 2);
    return mid === fa || mid === fb;
  };
  const refine = (a: number, b: number, depth: number) => {
    const va = valid(a),
      vb = valid(b);
    if (!va && !vb) {
      if (depth < 12) {
        refine(a, (a + b) / 2, depth + 1);
        refine((a + b) / 2, b, depth + 1);
      }
      return;
    }
    if (va !== vb) {
      const e = va ? edge(a, b) : edge(b, a);
      if (va) refine(a, e, depth + 1);
      else refine(e, b, depth + 1);
      return;
    }
    const pa = at(a),
      pb = at(b);
    if (!near(pa, pb)) return;
    if (separate(a, b)) {
      segments.push([pa, pa, true], [pb, pb, true]);
      return;
    }
    if (Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) < 0.2 || depth > 60) {
      segments.push([pa, pb, false]);
      return;
    }
    const mid = (a + b) / 2;
    refine(a, mid, depth + 1);
    refine(mid, b, depth + 1);
  };
  const steps = 2048;
  for (let i = 0; i < steps; i++)
    refine(
      low + ((high - low) * i) / steps,
      low + ((high - low) * (i + 1)) / steps,
      0,
    );
  return segments;
}

function segmentDistance(p: Vec2, [a, b]: Segment) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = dx * dx + dy * dy;
  const h =
    length > 0
      ? Math.min(
          1,
          Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length),
        )
      : 0;
  return Math.hypot(p[0] - a[0] - dx * h, p[1] - a[1] - dy * h);
}

const offsets: Vec2[] = [
  [-0.25, -0.25],
  [0.25, -0.25],
  [-0.25, 0.25],
  [0.25, 0.25],
];

interface Result {
  readonly name: string;
  readonly missing: number;
  readonly spurious: number;
  /** Pixels covered only by isolated f32 points: reported, not failed. */
  readonly floor: number;
  readonly worst: number;
  readonly map: string;
}

function check(
  callback: Callback,
  cpu: { tested: Cpu; exact: Cpu },
  view: View,
  focus: Vec2,
  zoom: number,
): Result {
  const span: Vec2 = [baseSpan[0] / zoom, baseSpan[1] / zoom];
  const u = uniforms(view, focus, span);
  for (const module of [cpu.tested, cpu.exact]) {
    module.setBinding("u", u);
    module.setBinding("font", { pixelRatio });
  }
  const project = projector(cpu.exact, view, u);
  const center = project(focus);
  const width = 1 / pixelRatio;
  const x0 = Math.round(center[0] / width) - cells / 2;
  const y0 = Math.round(center[1] / width) - cells / 2;
  const box: [number, number, number, number] = [
    x0 * width,
    y0 * width,
    (x0 + cells) * width,
    (y0 + cells) * width,
  ];
  const reach = Math.max(span[0], span[1]) * 2;
  const segments = truthSegments(
    callback,
    project,
    focus[0] - reach,
    focus[0] + reach,
    box,
  );
  const coverage = cpu.exact.fns.distanceCoverage as (
    d: number,
    w: number,
  ) => number;
  const distance3D =
    view.view3d === 0
      ? undefined
      : specialized(cpu.tested, "projectedScalarDistance");
  const field2D =
    view.view3d === 0 ? specialized(cpu.tested, "scalarField") : undefined;
  const dx: Vec2 = [span[0] / (resolution[0] * pixelRatio), 0];
  const dy: Vec2 = [0, span[1] / (resolution[1] * pixelRatio)];
  let missing = 0,
    spurious = 0,
    floor = 0,
    worst = 0;
  const rows: string[] = [];
  for (let j = cells - 1; j >= 0; j--) {
    let row = "";
    for (let i = 0; i < cells; i++) {
      let truth = 0,
        curve = 0,
        shader = 0;
      for (const [ox, oy] of offsets) {
        const pixel: Vec2 = [
          (x0 + i + 0.5 + ox) * width,
          (y0 + j + 0.5 + oy) * width,
        ];
        let d = Infinity,
          dCurve = Infinity;
        for (const segment of segments) {
          const distance = segmentDistance(pixel, segment);
          d = Math.min(d, distance);
          if (!segment[2]) dCurve = Math.min(dCurve, distance);
        }
        truth += coverage(d, curveWidth) / 4;
        curve += coverage(dCurve, curveWidth) / 4;
        if (field2D) {
          const p: Vec2 = [
            focus[0] + (pixel[0] / resolution[0] - 0.5) * span[0],
            focus[1] + (pixel[1] / resolution[1] - 0.5) * span[1],
          ];
          shader += (field2D(p, dx, dy, u, false) as number) / 4;
        } else {
          const got = distance3D!(pixel, u, false) as number;
          shader += coverage(got, curveWidth) / 4;
        }
      }
      worst = Math.max(worst, Math.abs(shader - truth));
      const miss = curve > 0.5 && shader < 0.25;
      const extra = truth < 0.05 && shader > 0.5;
      const limited = !miss && truth > 0.5 && shader < 0.25;
      if (miss) missing++;
      if (extra) spurious++;
      if (limited) floor++;
      row += miss
        ? "!"
        : limited
          ? "~"
          : extra
            ? "x"
            : shader > 0.5
              ? "#"
              : truth > 0.5
                ? "+"
                : ".";
    }
    rows.push(row);
  }
  return {
    name: `${callback.name} ${view.name} ${zoom}x at (${focus.map((v) => +v.toFixed(3)).join(", ")})`,
    missing,
    spurious,
    floor,
    worst,
    map: rows.join("\n"),
  };
}

const started = performance.now();
const failures: Result[] = [];
let cases = 0;
for (const callback of callbacks) {
  if (only && callback.name !== only) continue;
  const cpu = load(callback);
  for (const view of views)
    for (const zoom of zooms)
      for (const focus of callback.focus) {
        const result = check(callback, cpu, view, focus, zoom);
        cases++;
        const ok = result.missing === 0 && result.spurious === 0;
        console.log(
          `${ok ? "ok  " : "FAIL"} ${result.name}: missing ${result.missing}, spurious ${result.spurious}, f32 floor ${result.floor}, max |coverage error| ${result.worst.toFixed(2)}`,
        );
        if (!ok) failures.push(result);
      }
}
for (const failure of failures)
  console.log(
    `\n${failure.name} ("!" missing, "x" spurious, "~" f32 floor, "#" drawn, "+" truth only)\n${failure.map}`,
  );
console.log(
  `\n${cases - failures.length}/${cases} cases passed in ${((performance.now() - started) / 1000).toFixed(1)} s.`,
);
if (failures.length) process.exitCode = 1;
