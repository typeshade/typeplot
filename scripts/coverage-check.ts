// Curve coverage check: evaluate the shader's own distance queries on the CPU,
// through TypeShade's CPU oracle, and compare them with an exact ground truth.
//
// Every visibility bug so far (fb51c63, c0b26cb, d11039d, #27) was found by eye.
// This check measures the shipped shader text (plotSource) against a dense,
// edge-bisected sampling of the same callback, for callbacks that are hard for a
// closest-point search: domain edges with an infinite slope, both-sided edges,
// unbounded values, unbounded parameter domains and smooth controls. See
// docs/verification.md.
//
// Run: npm run check:coverage [-- --only <name>]
//
// The shader runs as a correctly rounding f32 machine (precision "f32"), which
// is what the GPU computes; the projection that places the truth uses f64.
import path from "node:path";
import { compile, compileModuleJs } from "typeshade";
import { plotSource } from "../src/plot-source.js";

type Vec2 = [number, number];
type Vec3 = [number, number, number];
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

/** The parameter domain of a parametric case, as createPlot passes it. */
interface Domain {
  /** 0: [low, high]; 1: (-inf, high]; 2: [low, inf); 3: (-inf, inf). */
  readonly mode: 0 | 1 | 2 | 3;
  readonly bounds: Vec2;
  /** The parameter the unbounded search starts from (createPlot's probe). */
  readonly seed: number;
}

/** A hard point of one curve, checked in each of the curve's views and zooms. */
interface Case {
  readonly focus: Vec3;
  readonly domain?: Domain;
}

/** A callback with its exact JS twin. `exact` returns undefined where the
 * callback omits the point. */
interface Curve {
  readonly name: string;
  readonly kind: "scalar" | "parametric";
  readonly body: string;
  readonly exact: (t: number) => Vec3 | undefined;
  readonly cases: readonly Case[];
  /** Parameters the truth samples; scalar curves sample around the focus. */
  readonly range?: Vec2;
}

const scalar = (
  name: string,
  body: string,
  f: (x: number) => number,
  focus: readonly Vec2[],
): Curve => ({
  name,
  kind: "scalar",
  body,
  exact: (x) => {
    const y = f(x);
    return Number.isFinite(y) ? [x, y, 0] : undefined;
  },
  cases: focus.map(([x, y]) => ({ focus: [x, y, 0] })),
});

const unbounded = (seed: number): Domain => ({
  mode: 3,
  bounds: [0, 0],
  seed,
});

const curves: readonly Curve[] = [
  scalar(
    "sqrt",
    "if (x < 0) { return 1e20; }\n  return sqrt(x);",
    (x) => (x < 0 ? NaN : Math.sqrt(x)),
    [
      [0, 0],
      [0.01, 0.1],
      [1, 1],
    ],
  ),
  scalar(
    "quarter-power",
    "if (x < 0) { return 1e20; }\n  return pow(x, 0.25);",
    (x) => (x < 0 ? NaN : Math.pow(x, 0.25)),
    [[0, 0]],
  ),
  scalar(
    "semicircle",
    "const r = 1 - x * x;\n  if (r < 0) { return 1e20; }\n  return sqrt(r);",
    (x) => (1 - x * x < 0 ? NaN : Math.sqrt(1 - x * x)),
    [
      [-1, 0],
      [1, 0],
      [0, 1],
    ],
  ),
  scalar(
    "log",
    "if (x <= 0) { return 1e20; }\n  return log(x);",
    (x) => (x <= 0 ? NaN : Math.log(x)),
    [
      [1, 0],
      [0.05, Math.log(0.05)],
      [1e-4, Math.log(1e-4)],
    ],
  ),
  scalar("fast-sine", "return sin(40 * x);", (x) => Math.sin(40 * x), [
    [0, 0],
    [Math.PI / 80, 1],
  ]),
  scalar("sine", "return sin(3 * x);", (x) => Math.sin(3 * x), [
    [0, 0],
    [Math.PI / 6, 1],
  ]),
  {
    name: "param-sqrt",
    kind: "parametric",
    body: "if (t < 0) { return vec3(1e20); }\n  return vec3(t, sqrt(t), 0);",
    exact: (t) => (t < 0 ? undefined : [t, Math.sqrt(t), 0]),
    range: [-4, 40],
    cases: [
      { focus: [0, 0, 0], domain: { mode: 0, bounds: [-1, 2], seed: 0.5 } },
      { focus: [0, 0, 0], domain: unbounded(0.5) },
      // createPlot's default probe is the centre of the x bounds: an edge.
      { focus: [1.5, Math.sqrt(1.5), 0], domain: unbounded(0) },
    ],
  },
  {
    name: "param-semicircle",
    kind: "parametric",
    body: "if (abs(t) > 1) { return vec3(1e20); }\n  return vec3(t, sqrt(1 - t * t), 0);",
    exact: (t) => (Math.abs(t) > 1 ? undefined : [t, Math.sqrt(1 - t * t), 0]),
    range: [-4, 4],
    cases: [
      { focus: [1, 0, 0], domain: unbounded(0) },
      { focus: [-1, 0, 0], domain: { mode: 0, bounds: [-2, 2], seed: 0 } },
    ],
  },
  {
    name: "arc",
    kind: "parametric",
    body: "return vec3(cos(t), sin(t), 0);",
    exact: (t) => [Math.cos(t), Math.sin(t), 0],
    range: [0, Math.PI],
    cases: [
      { focus: [1, 0, 0], domain: { mode: 0, bounds: [0, Math.PI], seed: 1 } },
      { focus: [0, 1, 0], domain: { mode: 0, bounds: [0, Math.PI], seed: 1 } },
    ],
  },
  {
    name: "helix",
    kind: "parametric",
    body: "return vec3(2 * cos(t), sin(t), 0.4 * t);",
    exact: (t) => [2 * Math.cos(t), Math.sin(t), 0.4 * t],
    range: [-40, 40],
    cases: [
      { focus: [2, 0, 0], domain: unbounded(0) },
      { focus: [-2, 0, 0.4 * Math.PI], domain: unbounded(0) },
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
/** createPlot's default parametric search budget (quality.samples). */
const searchBudget = 128;

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
// interaction.ts default lens: a 45 degree field of view at distance 3.
const lens = [Math.tan(Math.fround(Math.PI / 4) * 0.5), 3];

function uniforms(view: View, focus: Vec3, span: Vec2, domain?: Domain) {
  return {
    resolution,
    plotCenter: [focus[0], focus[1]],
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
    plotCenterZ: focus[2],
    probe: -1e9,
    parameterFocusSeed: domain ? domain.seed : focus[0],
    view3d: view.view3d,
    parameterBounds: domain ? domain.bounds : [0, 0],
    parameterMode: domain ? domain.mode : 3,
    curveQuality: [searchBudget, 5],
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
type Uniforms = ReturnType<typeof uniforms>;

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

function load(curve: Curve) {
  const signature =
    curve.kind === "scalar" ? "sample(x: f32): f32" : "sample(t: f32): vec3";
  const source = `"use typeshade";\nexport function ${signature} {\n  ${curve.body}\n}\n`;
  const plot = plotSource(source, {
    kind: curve.kind,
    fileName: path.resolve(`coverage/${curve.name}.shade.ts`),
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

/** Exact pixel position of a world point, in CSS pixels with y up; undefined
 * behind the perspective near plane, where the shader draws nothing. */
function projector(cpu: Cpu, view: View, u: Uniforms) {
  if (view.view3d === 0)
    return ([x, y]: Vec3): Vec2 | undefined => [
      ((x - u.plotCenter[0]) / u.plotSpan[0] + 0.5) * resolution[0],
      ((y - u.plotCenter[1]) / u.plotSpan[1] + 0.5) * resolution[1],
    ];
  return (p: Vec3): Vec2 | undefined =>
    cpu.fns.inFront(p, u) ? (cpu.fns.project(p, u) as Vec2) : undefined;
}

/** A truth segment. `isolated` marks a single f32-representable point whose
 * neighbours are more than a chord apart: f32 cannot draw the curve there. */
type Segment = [Vec2, Vec2, boolean];

/** A dense polyline of the exact curve near the cells. Intervals subdivide until
 * their projected chord is below 0.2 px, and each domain edge is bisected to an
 * actual endpoint, so the truth never joins across an omitted domain. */
function truthSegments(
  curve: Curve,
  project: (p: Vec3) => Vec2 | undefined,
  low: number,
  high: number,
  box: [number, number, number, number],
): Segment[] {
  const segments: Segment[] = [];
  // The shader can only evaluate f32 parameters, so the truth may not be
  // finer: an edge bisects to the last valid f32 parameter, and parameters
  // closer than one f32 step are separate points, never joined by a chord.
  const quantize = Math.fround;
  const at = (t: number) => {
    const p = curve.exact(quantize(t));
    return p ? project(p) : undefined;
  };
  const valid = (t: number) => at(t) !== undefined;
  const near = (a: Vec2, b: Vec2) => {
    const pad = Math.hypot(b[0] - a[0], b[1] - a[1]) + curveWidth + 2;
    return (
      Math.max(a[0], b[0]) >= box[0] - pad &&
      Math.min(a[0], b[0]) <= box[2] + pad &&
      Math.max(a[1], b[1]) >= box[1] - pad &&
      Math.min(a[1], b[1]) <= box[3] + pad
    );
  };
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
    const pa = at(a),
      pb = at(b);
    if (!pa && !pb) {
      if (depth < 12) {
        refine(a, (a + b) / 2, depth + 1);
        refine((a + b) / 2, b, depth + 1);
      }
      return;
    }
    if (!pa || !pb) {
      const e = pa ? edge(a, b) : edge(b, a);
      if (pa) refine(a, e, depth + 1);
      else refine(e, b, depth + 1);
      return;
    }
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
  const steps = 4096;
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
  /** Pick queries that missed a curve within reach, or hit one beyond it. */
  readonly pickMissing: number;
  readonly pickSpurious: number;
  readonly worst: number;
  readonly map: string;
}

function domainLabel(domain?: Domain) {
  if (!domain) return "";
  if (domain.mode === 3) return ` t unbounded from ${domain.seed}`;
  return ` t in [${domain.bounds.map((v) => +v.toFixed(3)).join(", ")}]`;
}

function check(
  curve: Curve,
  cpu: { tested: Cpu; exact: Cpu },
  view: View,
  item: Case,
  zoom: number,
): Result {
  const { focus, domain } = item;
  const span: Vec2 = [baseSpan[0] / zoom, baseSpan[1] / zoom];
  const u = uniforms(view, focus, span, domain);
  for (const module of [cpu.tested, cpu.exact]) {
    module.setBinding("u", u);
    module.setBinding("font", { pixelRatio });
  }
  const project = projector(cpu.exact, view, u);
  const center = project(focus)!;
  const width = 1 / pixelRatio;
  const x0 = Math.round(center[0] / width) - cells / 2;
  const y0 = Math.round(center[1] / width) - cells / 2;
  const box: [number, number, number, number] = [
    x0 * width,
    y0 * width,
    (x0 + cells) * width,
    (y0 + cells) * width,
  ];
  // The truth samples the domain the shader is given, no wider.
  let [low, high] =
    curve.range ??
    ([
      focus[0] - Math.max(span[0], span[1]) * 2,
      focus[0] + Math.max(span[0], span[1]) * 2,
    ] as Vec2);
  if (domain && (domain.mode === 0 || domain.mode === 2))
    low = Math.max(low, domain.bounds[0]);
  if (domain && (domain.mode === 0 || domain.mode === 1))
    high = Math.min(high, domain.bounds[1]);
  const segments = truthSegments(curve, project, low, high, box);
  const coverage = cpu.exact.fns.distanceCoverage as (
    d: number,
    w: number,
  ) => number;
  let distance: (pixel: Vec2) => number;
  let field2D: Fn | undefined;
  if (curve.kind === "parametric") {
    const query = specialized(cpu.tested, "trajectoryDistance");
    distance = (pixel) => query(pixel, u, u.parameterBounds, false) as number;
  } else if (view.view3d === 0) {
    field2D = specialized(cpu.tested, "scalarField");
    distance = () => NaN;
  } else {
    const query = specialized(cpu.tested, "projectedScalarDistance");
    distance = (pixel) => query(pixel, u, false) as number;
  }
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
        curveCoverage = 0,
        shader = 0;
      for (const [ox, oy] of offsets) {
        const pixel: Vec2 = [
          (x0 + i + 0.5 + ox) * width,
          (y0 + j + 0.5 + oy) * width,
        ];
        let d = Infinity,
          dCurve = Infinity;
        for (const segment of segments) {
          const value = segmentDistance(pixel, segment);
          d = Math.min(d, value);
          if (!segment[2]) dCurve = Math.min(dCurve, value);
        }
        truth += coverage(d, curveWidth) / 4;
        curveCoverage += coverage(dCurve, curveWidth) / 4;
        if (field2D) {
          const p: Vec2 = [
            focus[0] + (pixel[0] / resolution[0] - 0.5) * span[0],
            focus[1] + (pixel[1] / resolution[1] - 0.5) * span[1],
          ];
          shader += (field2D(p, dx, dy, u, false) as number) / 4;
        } else shader += coverage(distance(pixel), curveWidth) / 4;
      }
      worst = Math.max(worst, Math.abs(shader - truth));
      const miss = curveCoverage > 0.5 && shader < 0.25;
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
  // Picking: every third pixel, at radius 0 and 4 px. A pick must hit where the
  // exact curve is within reach (radius + half the stroke), less half a pixel
  // of tolerance, and must miss where it is half a pixel beyond.
  const pick = specialized(cpu.tested, "pickTrajectory");
  const scalarPick = curve.kind === "scalar";
  let pickMissing = 0,
    pickSpurious = 0;
  for (const radius of [0, 4])
    for (let j = 0; j < cells; j += 3)
      for (let i = 0; i < cells; i += 3) {
        const pixel: Vec2 = [(x0 + i + 0.5) * width, (y0 + j + 0.5) * width];
        // Missing picks are judged against the continuous truth, spurious
        // picks against every f32 point, as coverage is.
        let d = Infinity,
          dCurve = Infinity;
        for (const segment of segments) {
          const value = segmentDistance(pixel, segment);
          d = Math.min(d, value);
          if (!segment[2]) dCurve = Math.min(dCurve, value);
        }
        const reach = radius + curveWidth * 0.5;
        cpu.tested.setBinding("query", { pixel, radius });
        const result = pick([0.5, 0.5, 0, 1], u, scalarPick, false) as number[];
        const hit = result[3] !== 0;
        if (!hit && dCurve < reach - 0.5) pickMissing++;
        if (hit && d > reach + 0.5) pickSpurious++;
      }
  return {
    name: `${curve.name} ${view.name} ${zoom}x at (${focus.map((v) => +v.toFixed(3)).join(", ")})${domainLabel(domain)}`,
    missing,
    spurious,
    floor,
    pickMissing,
    pickSpurious,
    worst,
    map: rows.join("\n"),
  };
}

const started = performance.now();
const failures: Result[] = [];
let cases = 0;
for (const curve of curves) {
  if (only && curve.name !== only) continue;
  const cpu = load(curve);
  for (const view of views) {
    // A parametric curve is a spatial object; 2D draws scalar graphs only.
    if (curve.kind === "parametric" && view.view3d === 0) continue;
    for (const zoom of zooms)
      for (const item of curve.cases) {
        const result = check(curve, cpu, view, item, zoom);
        cases++;
        const ok =
          result.missing === 0 &&
          result.spurious === 0 &&
          result.pickMissing === 0 &&
          result.pickSpurious === 0;
        console.log(
          `${ok ? "ok  " : "FAIL"} ${result.name}: missing ${result.missing}, spurious ${result.spurious}, f32 floor ${result.floor}, max |coverage error| ${result.worst.toFixed(2)}, picks missed ${result.pickMissing}, picks spurious ${result.pickSpurious}`,
        );
        if (!ok) failures.push(result);
      }
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
