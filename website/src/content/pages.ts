import {
  signalCode,
  gpuCode,
  helixCode,
  surfaceCode,
  sampledSurfaceCode,
  uncertaintyCode,
  fieldCode,
} from "./samples";
import version from "../vendor/typeplot/version.json";
export type Locale = "en" | "ko";
export type PageKey = "guide" | "gpu" | "api" | "examples";
export interface Section {
  title: string;
  text: string;
  code?: string;
  lang?: string;
  items?: string[];
  api?: [string, string][];
}
export interface DocPage {
  title: string;
  description: string;
  sections: Section[];
}
const install = `npm install https://github.com/typeshade/typeplot.git#${version.commit}`;
const lifecycle = `import { subplots, linspace } from "typeplot/data";

const { fig, axes: [ax] } = subplots(1, 1, { target: "#chart" });
const x = linspace(0, 10, 100);
const line = ax.plot(x, x.map(v => v * v));
ax.set({ title: "Quadratic", xLabel: "x", yLabel: "y" });
line.setData(x, x.map(v => v * v * 0.5));
ax.setXLimits(0, 5);
await fig.saveImage("quadratic.png", { pixelRatio: 2 });

// When the view unmounts:
fig.destroy();`;
const plugin = `import { defineConfig } from "vite";
import { typeplot } from "typeplot/vite";

export default defineConfig({
  plugins: [typeplot({
    configure: file => file.endsWith("curve.shade.ts")
      ? { parameters: { exponent: 2 } }
      : file.endsWith("surface.shade.ts")
        ? { parameters: { phase: 0, amplitude: 1 } }
        : {},
  })],
});`;
const chartApi: [string, string][] = [
  [
    "plot(y, options?)",
    "Create a Figure with x coordinates taken from array indices.",
  ],
  [
    "plot(x, yOrFunction, options?)",
    "Draw arrays, typed arrays or a JavaScript callback.",
  ],
  [
    "subplots(rows?, cols?, options?)",
    "Return { fig, axes }; axes is always a flat row-major array.",
  ],
  ["figure(options?)", "Create an empty Figure; draw with fig.axes[0]."],
  [
    "linspace(start, stop, count = 50)",
    "Return a Float64Array including both endpoints.",
  ],
  [
    "ax.plot / scatter / bar / histogram",
    "Add a series. histogram returns { counts, bins, series }.",
  ],
  [
    "ax.set(options)",
    "Set title, xLabel, yLabel, grid, legend, xLimits/yLimits and xScale/yScale.",
  ],
  [
    "ax.setXLimits / setYLimits",
    "Fix a range. autoscale() restores automatic ranges.",
  ],
  [
    "ax.barh / step / stem / fillBetween / errorbar",
    "Add scientific data artists with resident GPU coverage.",
  ],
  [
    "ax.imshow / contour / contourf / colorbar",
    "Render scalar fields and their color scale.",
  ],
  [
    "ax.text / annotate / on / off / pick",
    "Add SDF annotations and GPU data events.",
  ],
  ["series.setData / remove", "Replace copied data or remove one series."],
  [
    "fig.saveImage / toBlob / destroy",
    "Download PNG, obtain PNG bytes, or release the figure.",
  ],
];
const chartApiKo: [string, string][] = [
  ["plot(y, options?)", "배열 인덱스를 x 좌표로 사용하는 Figure를 만듭니다."],
  [
    "plot(x, yOrFunction, options?)",
    "배열, typed array 또는 JavaScript 함수로 그래프를 그립니다.",
  ],
  [
    "subplots(rows?, cols?, options?)",
    "{ fig, axes }를 반환합니다. axes는 항상 행 우선의 1차원 배열입니다.",
  ],
  [
    "figure(options?)",
    "빈 Figure를 만듭니다. fig.axes[0]에서 그래프를 추가합니다.",
  ],
  [
    "linspace(start, stop, count = 50)",
    "양 끝점을 포함하는 Float64Array를 반환합니다.",
  ],
  [
    "ax.plot / scatter / bar / histogram",
    "계열을 추가합니다. histogram은 { counts, bins, series }를 반환합니다.",
  ],
  [
    "ax.set(options)",
    "title, xLabel, yLabel, grid, legend, 축 범위와 축 종류를 설정합니다.",
  ],
  [
    "ax.setXLimits / setYLimits",
    "축 범위를 고정합니다. autoscale()로 자동 범위로 돌아갑니다.",
  ],
  [
    "ax.barh / step / stem / fillBetween / errorbar",
    "GPU 과학 그래프 계열을 추가합니다.",
  ],
  [
    "ax.imshow / contour / contourf / colorbar",
    "스칼라 필드와 색상 눈금을 표시합니다.",
  ],
  [
    "ax.text / annotate / on / off / pick",
    "SDF 주석과 GPU 데이터 이벤트를 사용합니다.",
  ],
  ["series.setData / remove", "계열 데이터를 교체하거나 계열을 제거합니다."],
  [
    "fig.saveImage / toBlob / destroy",
    "PNG 다운로드, PNG Blob 생성, 리소스 해제를 수행합니다.",
  ],
];
export const pages: Record<Locale, Record<PageKey, DocPage>> = {
  en: {
    guide: {
      title: "Your first plot",
      description:
        "Start with an array, add a second curve, and keep the figure lifecycle explicit.",
      sections: [
        {
          title: "Install the runtime shown on this site",
          text: "The data plotting API is unreleased. This command pins the source commit used by this website; the v0.1.1 release contains the earlier GPU function API. JavaScript and declarations are included in the Git install.",
          code: install,
          lang: "sh",
        },
        {
          title: "Start with one array",
          text: "Create a container in your page, then call plot. With one array, TypePlot uses zero-based indices for x. Bounds and colors are automatic. A data-only application can import the smaller typeplot/data entry.",
          code: `import { plot } from "typeplot";\n\nconst fig = plot([3, 1, 4, 1, 5], {\n  target: "#chart",\n  title: "First plot",\n  xLabel: "Index",\n  yLabel: "Value",\n});`,
        },
        {
          title: "Add curves on the same axes",
          text: "A Figure owns its DOM. Each Axes owns its ranges, color cycle and interaction. There is no global current figure to keep track of. subplots returns the same flat array shape for one or many axes.",
          code: signalCode,
        },
        {
          title: "Scientific charts and annotations",
          text: "barh, step, stem, fillBetween and errorbar add scientific data artists. Errors accept scalars, arrays or { lower, upper }; capSize is in CSS pixels. Series support setStyle, setVisible and setAlpha. text/annotate render data-anchored SDF glyphs and implicit arrows with rotation and offsets. on/off and pick expose GPU hover/click results.",
          code: uncertaintyCode,
        },
        {
          title: "Images, contours and colorbars",
          text: "imshow, contour and contourf use resident row-major arrays. shape is [rows, columns], extent is [xMin, xMax, yMin, yMax], and origin defaults to upper. Configure colorMap, valueRange, interpolation, alpha, visible and levels. Contour lines require linear interpolation and 2–64 distinguishable f32 levels. Missing values are transparent. field.setData preserves shape and updates automatic color limits; colorbar links a scale to a field. No host contour mesh is generated.",
          code: fieldCode,
        },
        {
          title: "Update, save and release",
          text: "Data is copied on insertion. Use setData to replace it; automatic limits refit unless you have fixed them. PNG export redraws the figure at the requested density. Always destroy a figure when removing its view.",
          code: lifecycle,
        },
        {
          title: "Inputs and current limits",
          text: "The data API uses precompiled TypeShade shaders on WebGPU or WebGL2. Grids, axes, tick numbers, text and series are GPU-rendered. JavaScript callbacks supply sampled data; they are not compiled into shader code.",
          items: [
            "x and y must have equal lengths. Arrays and typed arrays are supported.",
            "NaN and infinity make line gaps and are omitted from bounds.",
            "Logarithmic axes omit non-positive values; fixed log limits must be positive.",
            "Numeric bars and histograms are supported. Date axes, categorical axes and SVG/PDF export are not implemented.",
            "Provide an adjacent description or table when readers need access to individual values.",
          ],
        },
      ],
    },
    gpu: {
      title: "Plot GPU functions",
      description:
        "Compile named TypeShade callbacks at build time, then render with WebGPU or WebGL2.",
      sections: [
        {
          title: "Separate compilation from rendering",
          text: "A .shade.ts callback is compiled on the build machine. The browser receives a serialized program and the runtime. The compiler and TypeScript are not included in the browser entry. Ordinary JavaScript callbacks supply host-sampled data to the precompiled TypeShade data renderer.",
        },
        {
          title: "Configure Vite",
          text: "The plugin compiles ?plot imports and watches shader dependencies. Parameter defaults must follow the callback's extra scalar arguments. Keep the real callback in a named shader file.",
          code: plugin,
        },
        {
          title: "Render a scalar function",
          text: "The first scalar argument is x. In 2D the renderer evaluates y − f(x) as an implicit field. In 3D, independent subpixel rays seed an actual projected-point distance query, with bracket refinement in compressed regions. This avoids false coverage at the projective pole. The finite numerical query is not a guaranteed global SDF. Camera bounds never truncate its mathematical domain. Extra arguments are configurable parameters. Guard the mathematical domain in the callback; a magnitude of at least 1e18 omits a point. Configure parameters for curve.shade.ts as shown above.",
          code: gpuCode,
        },
        {
          title: "Render a spatial curve",
          text: "A parametric callback returns vec3. Its first argument is the curve parameter. Set domain independently from the camera bounds; new programs default to [-Infinity, Infinity]. Unbounded domains use compactified numerical search near the camera focus; finite GPU precision and quality still limit resolved detail, and arbitrary callbacks have no guaranteed global coverage. Explicit finite and one-sided infinite domains are supported. The GPU refines closest-point candidates against the original callback, without connecting line segments. quality.samples (16–512, default 128) and quality.refinements (1–8, default 5) control this bounded numerical search. Change them with setQuality; setDomain changes the parameter interval without resetting the view. They open in 3D with perspective projection. Orthographic projection is also available; 2D always uses orthographic projection.",
          code: helixCode,
        },
        {
          title: "GPU search acceleration",
          text: "New spatial programs cache projected search intervals, tile candidate masks and axis-label layout in GPU textures. Pixels refine nearby candidates against the original callback; the cache does not become a rendered polyline. Changed camera, domain or parameters update the affected cache, and unchanged redraws reuse it. Search quality, display density and parameter-based dashes retain their settings. Enabled by default on WebGPU and WebGL2 with EXT_color_buffer_float. acceleration: false selects the reference query; older programs need recompilation to gain acceleration. This reduces repeated work without removing the numerical limits of arbitrary or unbounded curves.",
        },
        {
          title: "Height fields and camera animation",
          text: "Compile ?plot=surface or kind: surface for y = f(x, z); TypePlot uses y-up. The GPU finds ray/height-field crossings without triangle meshes. surface configures colorMap, valueRange, colorBar, shading, wireframe, contours, contourInterval, filled and opacity. Color limits do not clip geometry. setMode(2d) shows the same x/z color field. surfaceDomain is independent of the camera and defaults to unbounded; this example explicitly displays a finite patch. quality controls a finite ray/refinement budget, so thin branches, tangencies and arbitrary high frequencies are not guaranteed. setCamera exposes center, z focus, span, rotation, pan, fov in radians and distance. New pointer input pauses owned motion. plot.animate and transition use captured endpoints and absolute time; Timeline, ValueTracker, parallel and sequence compose motion with seek, pause, repeat and yoyo. Reduced motion completes a requested animation without looping.",
          code: surfaceCode,
        },
        {
          title: "Independent scene branches",
          text: "Newly compiled plots expose scene.root, scene.axes and scene.content. In 3D, transform the surface independently of its coordinate frame or group both under a parent. Opacity and visibility inherit through groups. Group changes update TypeShade uniforms and reuse resident observations. plot.timeline() composes node transitions with camera/function clips, supports absolute seek and pauses on pointer input. scene.add adds compiled callbacks sharing the same Runtime and camera, with per-pixel depth composition. 2D keeps the original field mapping while there are no additional spatial objects. Older manifests require recompilation for scene branches.",
          code: `const group = plot.scene.group(plot.scene.content);
const timeline = plot.timeline();
timeline.add(parallel(
  group.transition({
    transform: multiplyMatrices(
      translationMatrix(0, 0.5, 0),
      rotationMatrix(Math.PI / 4, [0, 0, 1]),
    ),
    opacity: 0.6,
  }, { duration: 4 }),
  plot.transition({
    parameters: { phase: 2 * Math.PI },
    camera: { rotation: [1.2, 0.6], distance: 3.6 },
  }, { duration: 4 }),
));
await timeline.seek(2); // Evaluate the same state when seeking in either direction.
timeline.play();`,
        },
        {
          title: "Surfaces from observation arrays",
          text: "createSurface accepts row-major observations, shape [rows, columns], and extent [xMin, xMax, zMin, zMax]. Rows progress from zMin to zMax. A precompiled TypeShade callback bilinearly evaluates resident values; camera changes reuse data. setValues replaces observations without rebuilding the plot. Its second argument true rescales colors. heightScale and heightOffset are animatable parameters. Missing cells are not extrapolated. Affine setTransform applies to 3D plots, grids and axes together; picking returns local mathematical coordinates. General callbacks may receive read-only f32 storage arrays through data and setData.",
          code: sampledSurfaceCode,
        },
        {
          title: "Picking and GPU PNG export",
          text: "on/off subscribe to hover and click. pick([x, y], radius) queries CSS pixels from the top-left and returns local point coordinates, distance and a curve parameter when applicable. Hover is opt-in, coalesces events and keeps one readback in flight. Function queries have finite numerical quality; surface picking queries the underlying field. toBlob and saveImage redraw the same programs with caches at export density. Width/height are CSS sizes; pixelRatio is at most four within device and 16-megapixel limits. A nonzero-size frame must have rendered. No CPU geometry search or Canvas2D export renderer is involved.",
          code: `plot.on("click", event => console.log(event.result?.point));
const point = await plot.pick([120, 90]);
await plot.saveImage("surface.png", { pixelRatio: 2 });
// Unmount: plot.destroy();`,
        },
        {
          title: "Shader appearance and navigation",
          text: 'Axes and ticks default to 1 CSS px. style and setStyle configure axisWidth, gridWidth, curveWidth, labelSize, tickDensity, labelHalo, labelBackground, grid, tickLabels and axisLabels. Widths stay independent of zoom and display density. lineStyle, dashPeriod and dashOffset define a procedural pattern in callback parameter coordinates, without cumulative path lengths. Left-drag orbits in 3D, right-drag pans, and both buttons pan in 2D. Touchscreens support one-finger pan/orbit, two-finger pinch/pan and double-tap reset. Released drags coast with damping; new input or Escape stops them. Double-click restores the home camera. inertia: false and doubleClickReset: false disable these gestures. Attach ViewControl with plot.addControl(new ViewControl(), "top-right"); removeControl cleans up the HTML camera UI. Spatial axes and the ground lattice are implicit distance fields using the same camera as the curve. Hierarchical world-coordinate ticks fade continuously with zoom. Numeric labels and axis names use a thin SDF halo by default, with optional rounded backgrounds. Their density follows projected spacing and formatted text width. Grid and GPU-label visibility changes fade over 160 ms, respecting reduced-motion preferences. Text uses X-GIS computeSDF encoding and its analytic antialiasing rule, with complete glyph padding at character boundaries.',
          code: `plot.setStyle({ axisWidth: 1, gridWidth: 0.5, curveWidth: 2, labelSize: 12, tickDensity: 1.25, labelHalo: 0.8, labelBackground: false, tickLabels: true });`,
        },
        {
          title: "Host integration and resources",
          text: "The host owns the GPU canvas and its CSS size. TypePlot adjusts the drawing buffer for display density. createPlot returns a Promise; await it, handle a rejected backend, and destroy the plot on unmount.",
          code: `const plot = await createPlot(canvas, program, { backend: "auto" });\nplot.setParameters({ exponent: 3 });\nplot.setMode("3d");\nplot.reset();\nplot.destroy();`,
          items: [
            "auto attempts WebGPU and falls back to WebGL2. Explicit backends report failures.",
            "Add typeplot/client to host declarations and exclude **/*.shade.ts from the host tsconfig.",
            "Returning a hidden point does not replace all discontinuity handling. Compile with discontinuous: true when needed.",
            "Figure and GPU plots both support toBlob/saveImage through TypeShade rendering, including 3D surfaces.",
          ],
        },
      ],
    },
    api: {
      title: "API reference",
      description:
        "The practical plotting surface, with links to the exact source used by this website.",
      sections: [
        {
          title: "Data figures",
          text: "Import from typeplot or typeplot/data. Both include the TypeShade runtime without the compiler. The figure handle is synchronous; await fig.ready for the first complete GPU frame and handle renderer failures.",
          api: chartApi,
        },
        {
          title: "Style and axes options",
          text: 'Series styles use label, color, lineWidth, lineStyle, marker, markerSize and alpha. Procedural dashes repeat in parameter coordinates: parameter selects auto/x/index, dashPeriod sets the period, and dashOffset shifts it. Without an explicit dashPeriod, automatic density adjusts the parameter period by powers of two in both zoom directions: magnification keeps visible gaps, and minification keeps rounded ends separated. Explicit periods retain fixed parameter spacing. Line styles are -, --, : and none. Markers are o, s and none. Axes can have linear or log xScale/yScale, fixed xLimits/yLimits, titles, labels, grids and legends. legend: "html" selects an HTML legend on screen; PNG retains a GPU legend.',
          code: `ax.plot(x, y, {\n  label: "Measurements", color: "#1677ff",\n  lineWidth: 2, lineStyle: "--", marker: "o", markerSize: 3,\n});\nax.set({ xScale: "log", xLimits: [1, 100], grid: true });`,
        },
        {
          title: "Histograms",
          text: "bins accepts a count from 1 to 10000 or finite strictly increasing edges. The final bin includes its right endpoint. density: true normalizes the total bar area to one. NaN and infinity are ignored. Remove and recreate a histogram to change its bins.",
        },
        {
          title: "GPU programs",
          text: "Compile with typeplot/compiler or the Vite plugin, then mount using createPlot(canvas, program, options). The original plot(canvas, program, options) form remains supported.",
          api: [
            [
              "compilePlot(source, options)",
              "Build-time scalar, parametric or surface callback compilation.",
            ],
            [
              "createPlot(canvas, program, options)",
              "Return a Promise<Plot> with its actual backend.",
            ],
            [
              "plot.setParameters(values)",
              "Update declared finite f32 parameters; unknown names are rejected.",
            ],
            [
              "plot.setMode / setProjection / setProbe / bounds",
              "Switch 2D/3D mode, select perspective/orthographic projection, set the probe or read bounds.",
            ],
            [
              "plot.setStyle(style)",
              "Configure CSS-pixel widths, label size and shader decorations without resetting the camera.",
            ],
            [
              "plot.setDomain / domain / setQuality",
              "Change or read the spatial parameter domain; configure GPU closest-point search without resetting the view.",
            ],
            [
              "createSurface / setSurface / setSurfaceDomain",
              "Render resident height grids or GPU height functions and configure their appearance/domain.",
            ],
            [
              "getCamera / setCamera / getTransform / setTransform",
              "Control a shared 3D camera and invertible affine scene transform.",
            ],
            [
              "plot.scene / scene.add / SceneNode / SceneGroup / SceneObject",
              "Compose multiple callbacks with shared camera/depth, per-object data and transforms, and object-aware picking.",
            ],
            [
              "timeline / animate / transition / Timeline / ValueTracker",
              "Coordinate captured camera/function state with absolute time, seek and playback.",
            ],
            [
              "on / off / pick / toBlob / saveImage",
              "Query GPU points, handle hover/click and export the original shaders to PNG.",
            ],
            [
              "plot.reset / redraw / destroy",
              "Restore initial settings, request a frame, or release resources.",
            ],
          ],
        },
        {
          title: "Export and lifecycle",
          text: "Figure.toBlob() returns a PNG Blob; saveImage() initiates a PNG download. Export size is independent of the displayed size. The budget is 16 megapixels with a 16384-pixel dimension limit. destroy() is idempotent and releases observers, interaction listeners, pending frames and owned DOM.",
        },
      ],
    },
    examples: {
      title: "Examples you can run",
      description:
        "Real TypePlot charts, their source, and the boundaries of the current implementation.",
      sections: [
        {
          title: "Lines, scatter, bars and histograms",
          text: "The charts below run the built TypePlot data API in your browser. Values are deterministic examples, not experimental measurements. Use the Playground to adjust parameters, pan, zoom and save a PNG.",
        },
        {
          title: "More than one subplot",
          text: "Each axes has independent bounds and interaction. The array is row-major: in a 2 × 2 layout, index 0 is top left and index 3 is bottom right.",
          code: `const { fig, axes } = subplots(2, 2, { width: 1000, height: 720 });\naxes[0].plot([3, 1, 4]);\naxes[1].scatter([1, 2, 3], [2, 5, 4]);\naxes[2].bar([1, 2, 3], [4, 7, 2]);\naxes[3].histogram([1, 2, 2, 3, 3, 3], { bins: 3 });`,
        },
        {
          title: "Run the repository examples",
          text: "The Vite example uses real ?plot shader imports alongside data charts. The standalone example uses generated scalar and helix programs. Explicit WebGL2 selection is available with ?backend=webgl2.",
          code: `git clone https://github.com/typeshade/typeplot.git\ncd typeplot\ngit checkout ${version.commit}\nnpm ci\nnpm run build\nnpm run dev`,
          lang: "sh",
        },
        {
          title: "Current scope",
          text: "Both data figures and function plots use TypeShade-generated WebGPU or WebGL2 shaders. This site makes no hardware performance claim and does not present browser output as a GPU benchmark. Height fields and camera/function animation are available in the Playground. General 3D volumes, unstructured meshes, date/category axes and full matplotlib API compatibility remain separate work.",
        },
      ],
    },
  },
  ko: {
    guide: {
      title: "첫 그래프 그리기",
      description:
        "배열에서 시작해 곡선을 추가하고, 갱신과 리소스 해제까지 살펴봅니다.",
      sections: [
        {
          title: "사이트에서 실행하는 버전 설치",
          text: "새 데이터 API는 아직 정식 릴리스 전입니다. 아래 명령은 이 사이트에서 사용하는 소스 커밋을 고정합니다. 기존 v0.1.1 태그에는 이전 GPU 함수 API가 들어 있습니다. Git 설치에는 빌드된 JavaScript와 선언 파일이 포함됩니다.",
          code: install,
          lang: "sh",
        },
        {
          title: "배열 하나로 시작",
          text: "페이지에 컨테이너를 만든 뒤 plot을 호출합니다. 배열 하나만 전달하면 0부터 시작하는 인덱스가 x 좌표가 됩니다. 축 범위와 색은 자동으로 결정합니다. 데이터만 그리는 앱에서는 더 작은 typeplot/data를 가져올 수 있습니다.",
          code: `import { plot } from "typeplot";\n\nconst fig = plot([3, 1, 4, 1, 5], {\n  target: "#chart",\n  title: "First plot",\n  xLabel: "Index",\n  yLabel: "Value",\n});`,
        },
        {
          title: "같은 축에 곡선 추가",
          text: "Figure는 DOM을 관리하고, Axes는 범위·색 순서·상호작용을 관리합니다. 전역의 현재 그래프 상태를 추적할 필요가 없습니다. subplots는 그래프 수와 관계없이 항상 1차원 axes 배열을 반환합니다.",
          code: signalCode,
        },
        {
          title: "과학 그래프와 주석",
          text: "barh, step, stem, fillBetween, errorbar로 과학 그래프를 추가합니다. 오차는 스칼라, 배열 또는 { lower, upper }를 받으며 capSize는 CSS 픽셀입니다. 계열은 setStyle, setVisible, setAlpha를 지원합니다. text와 annotate는 데이터 좌표의 SDF 글자와 암시적 화살표·회전·오프셋을 사용합니다. on/off와 pick으로 GPU hover/click 결과를 받습니다.",
          code: uncertaintyCode,
        },
        {
          title: "히트맵·등고선·컬러바",
          text: "imshow, contour, contourf는 행 우선 배열을 GPU에 유지해 표시합니다. shape는 [행, 열], extent는 [xMin, xMax, yMin, yMax]이며 origin 기본값은 upper입니다. colorMap, valueRange, interpolation, alpha, visible, levels를 설정합니다. 등고선은 선형 보간과 f32에서 구분되는 2–64개 수준을 사용합니다. 누락값은 투명합니다. field.setData는 크기를 유지하며 자동 색상 범위를 갱신하고 colorbar는 필드에 눈금을 연결합니다. 호스트에서 등고선 메시를 만들지 않습니다.",
          code: fieldCode,
        },
        {
          title: "갱신, 저장, 해제",
          text: "추가한 데이터는 복사됩니다. setData로 데이터를 교체하면 고정하지 않은 축 범위가 다시 맞춰집니다. PNG는 지정한 배율로 다시 그려 저장합니다. 뷰를 제거할 때는 반드시 destroy를 호출하십시오.",
          code: lifecycle,
        },
        {
          title: "입력 규칙과 현재 범위",
          text: "데이터 API는 미리 컴파일한 TypeShade 셰이더를 WebGPU 또는 WebGL2로 실행합니다. 그리드·축·눈금 숫자·텍스트·계열을 모두 GPU에서 그립니다. 일반 JavaScript 콜백은 호스트에서 표본 데이터를 만들며 셰이더로 컴파일하지 않습니다.",
          items: [
            "x와 y의 길이는 같아야 합니다. 배열과 typed array를 지원합니다.",
            "NaN과 무한대는 선을 끊으며, 자동 축 범위 계산에서 제외합니다.",
            "로그 축에서는 양수가 아닌 값을 제외합니다. 고정 로그 범위는 양수여야 합니다.",
            "숫자 좌표의 막대와 히스토그램을 지원합니다. 날짜·범주형 축과 SVG/PDF 저장은 아직 지원하지 않습니다.",
            "개별 값에 접근해야 하는 독자를 위해 그래프 옆에 설명이나 표를 제공하십시오.",
          ],
        },
      ],
    },
    gpu: {
      title: "GPU 함수 그래프",
      description:
        "이름 있는 TypeShade 콜백을 빌드 때 컴파일하고, WebGPU 또는 WebGL2로 실행합니다.",
      sections: [
        {
          title: "컴파일과 렌더링 분리",
          text: ".shade.ts 콜백은 빌드 환경에서 컴파일합니다. 브라우저에는 직렬화된 프로그램과 런타임을 전달합니다. 브라우저 진입점에는 컴파일러와 TypeScript가 포함되지 않습니다. 일반 JavaScript 콜백의 표본 데이터도 미리 컴파일한 TypeShade 데이터 렌더러로 그립니다.",
        },
        {
          title: "Vite 설정",
          text: "플러그인은 ?plot 가져오기를 컴파일하고 셰이더 의존성 변경을 감시합니다. 매개변수 기본값은 콜백의 추가 스칼라 인수와 맞춰야 합니다. 콜백은 이름 있는 실제 셰이더 파일에 작성하십시오.",
          code: plugin,
        },
        {
          title: "스칼라 함수 표시",
          text: "첫 스칼라 인수는 x입니다. 2D에서는 y − f(x)를 암시적 필드로 평가합니다. 3D에서는 서브픽셀마다 독립적으로 역투영하고 실제 투영된 곡선 위 점까지의 거리를 계산하며, 압축된 구간은 구간 탐색으로 보정합니다. 소실점 부근의 잘못된 면적 판정을 막지만 유한 수치 탐색이므로 전역적으로 정확한 SDF를 보장하지는 않습니다. 카메라 범위는 함수의 정의역을 자르지 않습니다. 추가 인수는 갱신 가능한 매개변수입니다. 수학적 정의역을 콜백 안에서 처리하십시오. 크기가 1e18 이상인 반환값은 해당 점을 생략합니다. 위 설정처럼 curve.shade.ts의 매개변수 기본값을 지정합니다.",
          code: gpuCode,
        },
        {
          title: "공간 곡선 표시",
          text: "매개변수 곡선 콜백은 vec3를 반환합니다. 첫 인수는 곡선의 매개변수입니다. domain은 카메라와 독립된 매개변수 구간입니다. 새 프로그램의 기본값은 [-Infinity, Infinity]입니다. 무한 정의역은 카메라 초점 주변으로 정밀도를 배분하는 압축 수치 탐색을 사용합니다. GPU 정밀도와 탐색 횟수의 한계가 있으며 임의의 콜백 전체를 찾는 보장은 아닙니다. 유한 구간과 한쪽만 무한한 구간도 지원합니다. GPU에서 원래 콜백의 최근접점을 수치 탐색하고 보정하며 점을 잇는 선분을 그리지 않습니다. quality.samples(16–512, 기본 128)와 quality.refinements(1–8, 기본 5)로 유한 수치 탐색의 정밀도를 조절합니다. setQuality와 setDomain은 카메라를 초기화하지 않고 설정을 갱신합니다. Perspective 투영의 3D로 시작합니다. 3D에서는 Orthographic으로 전환할 수 있습니다. 2D는 항상 Orthographic을 사용합니다.",
          code: helixCode,
        },
        {
          title: "GPU 탐색 가속",
          text: "새 공간 곡선 프로그램은 투영된 탐색 구간, 타일별 후보 목록과 축 라벨 배치를 GPU 텍스처에 보관합니다. 픽셀에서는 가까운 후보만 원래 콜백으로 보정하며 캐시를 선분으로 그리지 않습니다. 카메라·정의역·매개변수가 바뀌면 해당 캐시를 갱신하고 같은 상태의 재그리기에서는 재사용합니다. 탐색 품질, 화면 배율과 매개변수 기준 대시 설정을 유지합니다. WebGPU와 EXT_color_buffer_float를 지원하는 WebGL2에서 기본으로 활성화됩니다. acceleration: false로 참조 탐색을 선택할 수 있으며 이전 프로그램은 재컴파일해야 가속됩니다. 반복 연산을 줄이는 기능이며 임의의 곡선이나 무한 정의역에 대한 수치 탐색의 한계를 없애지는 않습니다.",
        },
        {
          title: "곡면과 카메라 애니메이션",
          text: "?plot=surface 또는 kind: surface로 y = f(x, z)를 컴파일합니다. TypePlot은 y-up 좌표계를 사용합니다. GPU가 광선과 곡면의 교차점을 직접 찾으며 삼각형 메시를 만들지 않습니다. surface에서 colorMap, valueRange, colorBar, shading, wireframe, contours, contourInterval, filled, opacity를 설정합니다. 색상 범위는 기하를 자르지 않습니다. setMode(2d)는 같은 함수를 x/z 색상장으로 표시합니다. surfaceDomain의 기본값은 무한 정의역이며 카메라와 독립됩니다. 이 예제는 유한 패치를 명시합니다. quality는 유한 광선 탐색·보정 예산이므로 얇은 가지나 접점, 임의의 고주파를 모두 찾는 보장은 아닙니다. setCamera는 center, z 초점, span, rotation, pan, 라디안 fov와 distance를 제어합니다. 새 포인터 입력은 재생을 멈춥니다. animate와 transition은 시작 상태와 절대 시간으로 보간하며 Timeline, ValueTracker, parallel, sequence로 되감기·일시정지·반복·왕복 재생을 구성합니다. 모션 감소 설정에서는 반복하지 않고 최종 상태로 이동합니다.",
          code: surfaceCode,
        },
        {
          title: "독립적인 장면 변환",
          text: "새로 컴파일한 프로그램은 scene.root, scene.axes, scene.content를 제공합니다. 3D에서 좌표계는 고정한 채 곡면만 변환하거나 부모 그룹으로 함께 변환할 수 있습니다. 투명도와 가시성은 상위 그룹에서 상속됩니다. 그룹 변경은 TypeShade uniform을 갱신하며 관측 데이터를 재사용합니다. plot.timeline()은 노드 변환과 카메라·함수 클립을 합성하고 절대 시간 탐색을 지원하며 새 포인터 입력에서 재생을 멈춥니다. scene.add로 같은 Runtime·카메라를 공유하는 콜백을 추가하고 픽셀별 깊이로 합성합니다. 추가 공간 객체가 없을 때 2D는 원래 색상장·함수 좌표를 유지합니다. 이전 프로그램은 장면 계층을 사용하려면 다시 컴파일해야 합니다.",
          code: `const group = plot.scene.group(plot.scene.content);
const timeline = plot.timeline();
timeline.add(parallel(
  group.transition({
    transform: multiplyMatrices(
      translationMatrix(0, 0.5, 0),
      rotationMatrix(Math.PI / 4, [0, 0, 1]),
    ),
    opacity: 0.6,
  }, { duration: 4 }),
  plot.transition({
    parameters: { phase: 2 * Math.PI },
    camera: { rotation: [1.2, 0.6], distance: 3.6 },
  }, { duration: 4 }),
));
await timeline.seek(2); // Evaluate the same state when seeking in either direction.
timeline.play();`,
        },
        {
          title: "관측 배열 곡면",
          text: "createSurface는 행 우선 배열과 shape [행, 열], extent [xMin, xMax, zMin, zMax]를 받습니다. 행은 zMin부터 zMax 방향입니다. 미리 컴파일한 TypeShade 콜백이 GPU에 유지한 값을 보간하므로 카메라 변경 시 데이터를 재사용합니다. setValues로 관측값을 교체하고 두 번째 인수 true로 색상 범위도 다시 맞춥니다. heightScale과 heightOffset을 애니메이션으로 제어할 수 있습니다. 누락된 셀을 외삽하지 않습니다. setTransform은 3D 그래프·격자·축에 같은 아핀 행렬을 적용하며 picking은 원래 수학 좌표를 반환합니다. 일반 콜백도 data와 setData로 읽기 전용 f32 저장 배열을 전달할 수 있습니다.",
          code: sampledSurfaceCode,
        },
        {
          title: "Picking과 GPU PNG 저장",
          text: "on/off로 hover와 click 이벤트를 연결합니다. pick([x, y], radius)는 왼쪽 위부터의 CSS 픽셀 좌표로 질의하며 원래 점 좌표, 거리와 곡선 매개변수를 반환합니다. hover는 구독할 때만 동작하고 이벤트를 합쳐 readback 하나만 실행합니다. 함수 질의에는 수치 탐색의 한계가 있고 곡면은 내부 높이장을 질의합니다. toBlob과 saveImage는 저장 배율에 맞춘 캐시와 같은 셰이더로 다시 그립니다. width/height는 CSS 크기이며 pixelRatio는 최대 4, 기기 한계와 16메가픽셀 이내입니다. 크기가 0이 아닌 프레임이 한 번은 그려져야 합니다. CPU 기하 탐색이나 Canvas2D 저장 렌더러를 사용하지 않습니다.",
          code: `plot.on("click", event => console.log(event.result?.point));
const point = await plot.pick([120, 90]);
await plot.saveImage("surface.png", { pixelRatio: 2 });
// Unmount: plot.destroy();`,
        },
        {
          title: "셰이더 스타일과 탐색",
          text: '축과 눈금의 기본 굵기는 1 CSS px입니다. style과 setStyle에서 axisWidth, gridWidth, curveWidth, labelSize, tickDensity, labelHalo, labelBackground, grid, tickLabels, axisLabels를 설정합니다. 데이터 범례는 legend: "html"로 HTML 표시를 선택할 수 있으며 PNG에는 GPU 범례를 포함합니다. 굵기는 줌과 화면 배율에 영향을 받지 않습니다. lineStyle, dashPeriod, dashOffset은 콜백 매개변수 좌표에서 절차형 대시를 정의하며 경로 길이를 누적하지 않습니다. 3D에서는 왼쪽 드래그로 회전하고 오른쪽 드래그로 이동하며, 2D에서는 양쪽 버튼으로 이동합니다. 터치에서는 한 손가락으로 이동·회전하고 두 손가락으로 확대·이동하며 두 번 탭하면 초기화합니다. 드래그를 놓으면 관성으로 감속하고 새 입력이나 Escape로 멈춥니다. 더블 클릭은 카메라를 초기화합니다. inertia: false와 doubleClickReset: false로 각 동작을 끌 수 있습니다. plot.addControl(new ViewControl(), "top-right")으로 HTML 카메라 조작 UI를 추가하고 removeControl로 제거합니다. 공간 축과 바닥 격자는 곡선과 같은 카메라를 사용하는 암시적 거리장입니다. 월드 좌표에 고정된 계층형 눈금은 줌에 따라 연속적으로 페이드됩니다. 숫자와 축 이름은 기본적으로 얇은 SDF 외곽선을 사용하며, 둥근 배경은 옵션입니다. 투영 간격과 숫자 폭으로 밀도를 조절합니다. 격자와 GPU 라벨의 표시 전환은 160ms 동안 페이드되며 모션 감소 설정을 존중합니다. 글자는 X-GIS computeSDF 인코딩과 크기별 안티앨리어싱 규칙을 사용하며 글자 경계의 SDF 여백을 보존합니다.',
          code: `plot.setStyle({ axisWidth: 1, gridWidth: 0.5, curveWidth: 2, labelSize: 12, tickDensity: 1.25, labelHalo: 0.8, labelBackground: false, tickLabels: true });`,
        },
        {
          title: "앱 연결과 리소스",
          text: "앱에서 GPU canvas와 CSS 크기를 관리합니다. TypePlot은 화면 배율에 맞춰 그리기 버퍼를 조정합니다. createPlot을 기다리고, 백엔드 오류를 처리하고, 뷰가 사라질 때 destroy를 호출하십시오.",
          code: `const plot = await createPlot(canvas, program, { backend: "auto" });\nplot.setParameters({ exponent: 3 });\nplot.setMode("3d");\nplot.reset();\nplot.destroy();`,
          items: [
            "auto는 WebGPU를 시도한 뒤 WebGL2로 대체합니다. 백엔드를 명시하면 해당 경로의 오류를 보고합니다.",
            "호스트 선언에 typeplot/client를 추가하고 tsconfig에서 **/*.shade.ts를 제외합니다.",
            "점을 생략하는 것만으로 모든 불연속을 처리하지는 않습니다. 필요하면 discontinuous: true로 컴파일합니다.",
            "Figure와 GPU 그래프 모두 TypeShade 렌더링으로 toBlob/saveImage를 지원하며 3D 곡면도 저장할 수 있습니다.",
          ],
        },
      ],
    },
    api: {
      title: "API 참조",
      description:
        "주요 그래프 API와 이 사이트가 사용하는 정확한 소스를 확인합니다.",
      sections: [
        {
          title: "데이터 Figure",
          text: "typeplot 또는 typeplot/data에서 가져옵니다. 두 진입점 모두 컴파일러 없이 TypeShade 런타임을 포함합니다. Figure 핸들은 동기적으로 생성합니다. 첫 GPU 프레임은 fig.ready를 기다리고 초기화 오류를 처리하십시오.",
          api: chartApiKo,
        },
        {
          title: "계열 스타일과 축 옵션",
          text: "계열에는 label, color, lineWidth, lineStyle, marker, markerSize, alpha를 지정합니다. 절차형 대시는 곡선 매개변수 좌표에서 반복하며 parameter(auto/x/index), dashPeriod, dashOffset으로 기준·주기·위상을 조절합니다. dashPeriod를 생략하면 확대·축소에 맞춰 매개변수 주기를 2배 단위로 조절합니다. 확대할 때도 간격을 유지하고 축소할 때 둥근 끝이 겹치지 않도록 합니다. 명시한 주기는 고정됩니다. 선 종류는 -, --, :, none이며, 마커는 o, s, none입니다. xScale/yScale은 linear 또는 log이고 xLimits/yLimits로 범위를 고정합니다.",
          code: `ax.plot(x, y, {\n  label: "Measurements", color: "#1677ff",\n  lineWidth: 2, lineStyle: "--", marker: "o", markerSize: 3,\n});\nax.set({ xScale: "log", xLimits: [1, 100], grid: true });`,
        },
        {
          title: "히스토그램",
          text: "bins에는 1부터 10000까지의 구간 수 또는 유한하고 엄격히 증가하는 경계 배열을 전달합니다. 마지막 구간은 오른쪽 끝점을 포함합니다. density: true는 막대 전체 넓이를 1로 맞춥니다. NaN과 무한대는 무시합니다. 구간을 바꾸려면 기존 히스토그램을 제거한 뒤 다시 만드십시오.",
        },
        {
          title: "GPU 프로그램",
          text: "typeplot/compiler나 Vite 플러그인으로 컴파일하고 createPlot(canvas, program, options)으로 연결합니다. 기존 plot(canvas, program, options) 형식도 지원합니다.",
          api: [
            [
              "compilePlot(source, options)",
              "스칼라 또는 매개변수 콜백을 빌드 때 컴파일합니다.",
            ],
            [
              "createPlot(canvas, program, options)",
              "실제 백엔드를 포함한 Promise<Plot>을 반환합니다.",
            ],
            [
              "plot.setParameters(values)",
              "선언된 유한 f32 매개변수를 갱신합니다. 알 수 없는 이름은 거부합니다.",
            ],
            [
              "plot.setMode / setProjection / setProbe / bounds",
              "2D/3D 모드, Perspective/Orthographic 투영, 프로브와 현재 범위를 관리합니다.",
            ],
            [
              "plot.setStyle(style)",
              "카메라를 초기화하지 않고 CSS px 단위의 굵기와 글자 크기, 격자·라벨 표시를 설정합니다.",
            ],
            [
              "plot.setDomain / domain / setQuality",
              "카메라와 독립된 공간 곡선 매개변수 구간을 읽거나 갱신하고 GPU 최근접점 탐색 정밀도를 조절합니다.",
            ],
            [
              "plot.scene / scene.add / SceneNode / SceneGroup / SceneObject",
              "다중 콜백의 카메라·깊이 합성, 객체별 데이터·변환, 그룹·가시성과 객체별 picking을 제어합니다.",
            ],
            [
              "plot.timeline / animate / transition",
              "노드·카메라·함수 클립을 하나의 절대 시간으로 합성하고 재생·되감기·일시정지를 제어합니다.",
            ],
            [
              "plot.reset / redraw / destroy",
              "초기 설정 복원, 프레임 요청, 리소스 해제를 수행합니다.",
            ],
          ],
        },
        {
          title: "내보내기와 수명",
          text: "Figure.toBlob()은 PNG Blob을 반환하고 saveImage()는 다운로드를 시작합니다. 저장 크기는 화면 표시 크기와 독립적입니다. 전체 1600만 픽셀, 한 변 16384픽셀 제한이 있습니다. destroy()는 여러 번 호출해도 안전하며 관찰자·이벤트·예약 프레임·DOM을 해제합니다.",
        },
      ],
    },
    examples: {
      title: "직접 실행하는 예제",
      description:
        "실제 TypePlot 그래프, 해당 코드, 현재 구현 범위를 확인합니다.",
      sections: [
        {
          title: "선, 산점도, 막대, 히스토그램",
          text: "아래 그래프는 브라우저에서 빌드된 TypePlot 데이터 API를 실행합니다. 값은 일정한 수식으로 만든 예제이며 실험 측정값이 아닙니다. 직접 실행 페이지에서 매개변수 조절, 이동, 확대와 PNG 저장을 할 수 있습니다.",
        },
        {
          title: "여러 서브플롯 구성",
          text: "각 Axes는 범위와 상호작용을 독립적으로 관리합니다. 배열은 행 우선 순서입니다. 2 × 2 구성에서 0번은 왼쪽 위, 3번은 오른쪽 아래입니다.",
          code: `const { fig, axes } = subplots(2, 2, { width: 1000, height: 720 });\naxes[0].plot([3, 1, 4]);\naxes[1].scatter([1, 2, 3], [2, 5, 4]);\naxes[2].bar([1, 2, 3], [4, 7, 2]);\naxes[3].histogram([1, 2, 2, 3, 3, 3], { bins: 3 });`,
        },
        {
          title: "저장소 예제 실행",
          text: "Vite 예제는 실제 ?plot 셰이더 가져오기와 데이터 차트를 함께 사용합니다. 독립 실행 예제에는 생성된 스칼라·나선 프로그램이 들어 있습니다. ?backend=webgl2로 대체 백엔드를 명시할 수 있습니다.",
          code: `git clone https://github.com/typeshade/typeplot.git\ncd typeplot\ngit checkout ${version.commit}\nnpm ci\nnpm run build\nnpm run dev`,
          lang: "sh",
        },
        {
          title: "현재 지원 범위",
          text: "데이터 Figure와 함수 그래프 모두 TypeShade로 생성한 WebGPU 또는 WebGL2 셰이더로 그립니다. 이 사이트는 하드웨어 성능을 주장하거나 브라우저 출력을 GPU 벤치마크로 제시하지 않습니다. 일반 3D 부피장, 비정형 메시, 날짜·범주형 축과 전체 matplotlib API 호환은 별도 확장 범위입니다. 높이 곡면·카메라·함수 애니메이션은 직접 실행 페이지에서 사용할 수 있습니다.",
        },
      ],
    },
  },
};
