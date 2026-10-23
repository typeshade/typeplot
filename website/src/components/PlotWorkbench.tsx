import { useEffect, useRef, useState } from "react";
import { Button, ConfigProvider, Select, Slider, Switch, theme } from "antd";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import {
  subplots,
  linspace,
  type Figure,
  type Series,
} from "../vendor/typeplot/data.js";
import {
  createPlot,
  ViewControl,
  type Plot,
  type PlotProgram,
  type PlotProjection,
  type PlotStyle,
} from "../vendor/typeplot/index.js";
import power from "../vendor/typeplot/curve.js";
import sine from "../vendor/typeplot/sine.js";
import helix from "../vendor/typeplot/helix.js";
import { exampleCode, type Preset } from "../content/samples";
import version from "../vendor/typeplot/version.json";

const DEFAULT_STYLE: Required<PlotStyle> = {
  axisWidth: 1,
  gridWidth: 1,
  curveWidth: 2,
  lineStyle: "-",
  dashPeriod: 0.2,
  dashOffset: 0,
  labelSize: 11,
  tickDensity: 1,
  labelHalo: 0.8,
  labelBackground: false,
  grid: true,
  tickLabels: true,
  axisLabels: true,
};

type Backend = "auto" | "webgpu" | "webgl2";
export default function PlotWorkbench({ locale }: { locale: "en" | "ko" }) {
  const ko = locale === "ko";
  const [preset, setPreset] = useState<Preset>("signals");
  const [frequency, setFrequency] = useState(1);
  const [exponent, setExponent] = useState(2);
  const [backend, setBackend] = useState<Backend>("auto");
  const [threeD, setThreeD] = useState(false);
  const [htmlLegend, setHtmlLegend] = useState(false);
  const [projection, setProjection] = useState<PlotProjection>("perspective");
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [domainExtent, setDomainExtent] = useState(6.28);
  const [unbounded, setUnbounded] = useState(true);
  const [samples, setSamples] = useState(128);
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState(
    ko ? "그래프를 준비하고 있습니다…" : "Preparing the plot…",
  );
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const mount = useRef<HTMLDivElement>(null);
  const active = useRef<{
    figure?: Figure;
    gpu?: Plot;
    signal?: { x: Float64Array; lines: Series[] };
  }>({});
  const desired = useRef({
    exponent,
    frequency,
    threeD,
    projection,
    style,
    domainExtent,
    unbounded,
    samples,
  });
  desired.current = {
    exponent,
    frequency,
    threeD,
    projection,
    style,
    domainExtent,
    unbounded,
    samples,
  };
  const gpu = preset === "power" || preset === "sine" || preset === "helix";
  useEffect(() => {
    const update = () =>
      setDark(document.documentElement.dataset.theme === "dark");
    update();
    window.addEventListener("typeplot-theme-change", update);
    return () => window.removeEventListener("typeplot-theme-change", update);
  }, []);
  useEffect(() => {
    const target = mount.current;
    if (!target) return;
    let disposed = false;
    let fig: Figure | undefined, plot: Plot | undefined;
    let signal: { x: Float64Array; lines: Series[] } | undefined;
    setError("");
    setReady(false);
    setStatus(ko ? "렌더러를 준비하고 있습니다…" : "Preparing the renderer…");
    const fail = (error: unknown) => {
      if (!disposed) {
        setReady(false);
        setError(error instanceof Error ? error.message : String(error));
        setStatus(
          ko ? "그래프를 표시하지 못했습니다." : "Unable to render the plot.",
        );
      }
    };
    if (!gpu) {
      try {
        const result = subplots(1, 1, {
          target,
          width: 900,
          height: 440,
          toolbar: false,
          backend,
          onError: fail,
        });
        fig = result.fig;
        const ax = result.axes[0];
        if (preset === "signals") {
          const x = linspace(0, Math.PI * 2, 200);
          const sine = ax.plot(x, (v) => Math.sin(v * frequency), {
            label: "Sine",
          });
          const cosine = ax.plot(x, (v) => Math.cos(v * frequency), {
            label: "Cosine",
            lineStyle: "--",
          });
          signal = { x, lines: [sine, cosine] };
          ax.set({
            xLabel: "Angle (radians)",
            yLabel: "Amplitude",
            grid: true,
            legend: true,
          });
        } else if (preset === "scatter") {
          const x = linspace(0, 4, 35);
          ax.scatter(
            x,
            x.map((v, i) => Math.exp(v) * (1 + 0.15 * Math.sin(i * 13))),
            { color: "#9467bd" },
          );
          ax.set({
            xLabel: "Time",
            yLabel: "Value",
            yScale: "log",
            grid: true,
          });
        } else if (preset === "bars") {
          ax.bar([1, 2, 3, 4], [12, 19, 8, 15], {
            width: 0.6,
            color: "#2ca02c",
            label: "Observations",
          });
          ax.set({ xLabel: "Group", yLabel: "Count", legend: true });
        } else {
          const values = Array.from(
            { length: 600 },
            (_, i) =>
              Math.sin(i * 2.399) + Math.sin(i * 1.731) + Math.cos(i * 0.357),
          );
          ax.histogram(values, { bins: 20, density: true, color: "#ff7f0e" });
          ax.set({ xLabel: "Value", yLabel: "Density" });
        }
        active.current = { figure: fig, signal };
        void fig.ready
          .then(() => {
            if (!disposed) {
              setReady(true);
              setStatus(
                `TypeShade · ${fig!.backend === "webgpu" ? "WebGPU" : "WebGL2"}`,
              );
            }
          })
          .catch(fail);
      } catch (error) {
        fig?.destroy();
        fail(error);
      }
    } else {
      const canvas = target.ownerDocument.createElement("canvas");
      canvas.className = "gpu-canvas";
      canvas.setAttribute("aria-describedby", "plot-help");
      canvas.textContent =
        preset === "power"
          ? "y = x raised to the selected exponent, over x from zero to one."
          : "Helix: x = 2 cos(t), y = sin(t), z = 0.4t.";
      target.appendChild(canvas);
      void createPlot(
        canvas,
        (preset === "power"
          ? power
          : preset === "sine"
            ? sine
            : helix) as PlotProgram,
        {
          bounds:
            preset === "power"
              ? { x: [0, 1], y: [0, 1] }
              : { x: [-6.28, 6.28], y: [-1.5, 1.5] },
          domain:
            preset === "helix"
              ? unbounded
                ? [-Infinity, Infinity]
                : [-domainExtent, domainExtent]
              : undefined,
          quality: preset === "helix" ? { samples } : undefined,
          backend,
          mode: preset === "helix" || threeD ? "3d" : "2d",
          projection: preset === "helix" || threeD ? projection : undefined,
          label:
            preset === "power"
              ? ko
                ? "거듭제곱 함수"
                : "Power function"
              : preset === "sine"
                ? ko
                  ? "연속 사인 함수"
                  : "Continuous sine function"
                : ko
                  ? "3차원 나선"
                  : "Spatial helix",
          parameters:
            preset === "power"
              ? { exponent }
              : preset === "sine"
                ? { frequency }
                : undefined,
          onError: fail,
        },
      )
        .then((result) => {
          if (disposed) {
            result.destroy();
            return;
          }
          plot = result;
          result.addControl(
            new ViewControl({
              language: locale,
              onChange: (view) => {
                setThreeD(view.mode === "3d");
                setProjection(view.projection);
              },
            }),
            "top-right",
          );
          const current = desired.current;
          result.setStyle(current.style);
          result.setMode(preset === "helix" || current.threeD ? "3d" : "2d");
          if (preset === "helix" || current.threeD)
            result.setProjection(current.projection);
          if (preset === "power")
            result.setParameters({ exponent: current.exponent });
          if (preset === "sine")
            result.setParameters({ frequency: current.frequency });
          if (preset === "helix") {
            result.setDomain(
              current.unbounded
                ? [-Infinity, Infinity]
                : [-current.domainExtent, current.domainExtent],
            );
            result.setQuality({ samples: current.samples });
          }
          active.current = { gpu: result };
          setReady(true);
          setStatus(result.backend === "webgpu" ? "WebGPU" : "WebGL2");
        })
        .catch(fail);
    }
    return () => {
      disposed = true;
      fig?.destroy();
      plot?.destroy();
      active.current = {};
      target.replaceChildren();
    };
  }, [preset, backend, ko, gpu]);
  useEffect(() => {
    const signal = active.current.signal;
    if (!signal) return;
    signal.lines[0].setData(
      signal.x,
      signal.x.map((v) => Math.sin(v * frequency)),
    );
    signal.lines[1].setData(
      signal.x,
      signal.x.map((v) => Math.cos(v * frequency)),
    );
  }, [frequency, ready]);
  useEffect(() => {
    const plot = active.current.gpu;
    if (!plot) return;
    plot.setStyle(style);
    plot.setMode(preset === "helix" || threeD ? "3d" : "2d");
    if (preset === "helix" || threeD) plot.setProjection(projection);
    if (preset === "power") plot.setParameters({ exponent });
    if (preset === "sine") plot.setParameters({ frequency });
    if (preset === "helix") {
      plot.setDomain(
        unbounded ? [-Infinity, Infinity] : [-domainExtent, domainExtent],
      );
      plot.setQuality({ samples });
    }
  }, [
    preset,
    exponent,
    frequency,
    threeD,
    projection,
    style,
    domainExtent,
    unbounded,
    samples,
    ready,
  ]);
  useEffect(() => {
    if (!gpu && ready)
      active.current.figure?.axes.forEach((axes) =>
        axes.legend(htmlLegend ? "html" : true),
      );
  }, [gpu, ready, htmlLegend, preset]);
  async function save() {
    if (!active.current.figure) return;
    setSaving(true);
    try {
      await active.current.figure.saveImage(`typeplot-${preset}.png`, {
        pixelRatio: 2,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }
  const sourceCode = exampleCode(
    preset,
    frequency,
    exponent,
    backend,
    threeD,
    projection,
  );
  const code = gpu
    ? sourceCode +
      `
plot.setStyle(${JSON.stringify(style, null, 2)});` +
      (preset === "helix"
        ? `
plot.setDomain(${unbounded ? "[-Infinity, Infinity]" : `[-${domainExtent}, ${domainExtent}]`});
plot.setQuality({ samples: ${samples}, refinements: 5 });`
        : "")
    : sourceCode;
  const descriptions: Record<Preset, string> = ko
    ? {
        signals:
          "0부터 2π까지의 구간에서 사인과 코사인을 200개 점으로 표시합니다. 진폭 범위는 −1부터 1까지입니다.",
        scatter:
          "지수 함수에 일정한 변화를 더한 35개 표본입니다. 세로축은 밑이 10인 로그 축입니다.",
        bars: "네 집단의 관측값은 순서대로 12, 19, 8, 15입니다.",
        histogram:
          "세 삼각함수로 만든 600개 값을 20개 구간으로 나눕니다. 막대의 전체 넓이는 1입니다.",
        sine: "수학적 사인 함수를 화면 전체에서 직접 평가합니다. 확대하거나 축소해도 표본 배열의 끝이 생기지 않습니다.",
        power: `초기 뷰는 0부터 1까지이며 y = x^${exponent}을 화면 전체에서 평가합니다. 음수 구간은 셰이더에서 제외합니다.`,
        helix:
          "x = 2 cos(t), y = sin(t), z = 0.4t로 정의한 나선입니다. 드래그하면 회전합니다.",
      }
    : {
        signals:
          "Sine and cosine sampled at 200 points from 0 to 2π. Both amplitudes range from −1 to 1.",
        scatter:
          "35 deterministic samples of an exponential with a small variation. The y axis uses a base-10 log scale.",
        bars: "Four groups have observed values of 12, 19, 8 and 15, respectively.",
        histogram:
          "600 values formed from three trigonometric terms, grouped into 20 bins. Total bar area is one.",
        sine: "The mathematical sine function is evaluated across the visible plane. Zooming never reaches the end of a sampled array.",
        power: `y = x^${exponent}, initially viewed from zero to one, evaluated across the visible plane. The shader omits the negative domain.`,
        helix:
          "A helix defined by x = 2 cos(t), y = sin(t), z = 0.4t. Drag to orbit.",
      };
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
          fontFamily: '"IBM Plex Sans", "IBM Plex Sans KR", sans-serif',
        },
      }}
    >
      <div className="plot-workbench">
        <div className="plot-toolbar">
          <div className="plot-field">
            <label htmlFor="preset">{ko ? "예제" : "Example"}</label>
            <Select
              id="preset"
              value={preset}
              onChange={setPreset}
              options={[
                {
                  value: "signals",
                  label: ko ? "사인과 코사인" : "Sine and cosine",
                },
                {
                  value: "scatter",
                  label: ko ? "로그 산점도" : "Log-scale scatter",
                },
                { value: "bars", label: ko ? "막대 그래프" : "Bar chart" },
                { value: "histogram", label: ko ? "히스토그램" : "Histogram" },
                {
                  value: "sine",
                  label: ko ? "GPU 연속 사인 함수" : "GPU continuous sine",
                },
                {
                  value: "power",
                  label: ko ? "GPU 거듭제곱 함수" : "GPU power function",
                },
                {
                  value: "helix",
                  label: ko ? "GPU 3D 나선" : "GPU spatial helix",
                },
              ]}
            />
          </div>
          {(preset === "signals" || preset === "sine") && (
            <div className="plot-field">
              <label id="frequency-label">
                {ko ? "주파수" : "Frequency"}: {frequency.toFixed(2)}
              </label>
              <Slider
                ariaLabelledByForHandle="frequency-label"
                min={0.25}
                max={4}
                step={0.05}
                value={frequency}
                onChange={setFrequency}
              />
            </div>
          )}
          {preset === "power" && (
            <>
              <div className="plot-field">
                <label id="exponent-label">
                  {ko ? "지수" : "Exponent"}: {exponent.toFixed(2)}
                </label>
                <Slider
                  ariaLabelledByForHandle="exponent-label"
                  min={0.25}
                  max={5}
                  step={0.05}
                  value={exponent}
                  onChange={setExponent}
                />
              </div>
            </>
          )}
          {(preset === "power" || preset === "sine") && (
            <>
              <div className="plot-field">
                <span id="mode-label">{ko ? "3D 보기" : "3D view"}</span>
                <Switch
                  checked={threeD}
                  onChange={setThreeD}
                  aria-labelledby="mode-label"
                />
              </div>
            </>
          )}
          {
            <div className="plot-field">
              <label htmlFor="backend">{ko ? "백엔드" : "Backend"}</label>
              <Select
                id="backend"
                value={backend}
                onChange={setBackend}
                options={[
                  { value: "auto", label: ko ? "자동" : "Auto" },
                  { value: "webgpu", label: "WebGPU" },
                  { value: "webgl2", label: "WebGL2" },
                ]}
              />
            </div>
          }
          {gpu && (preset === "helix" || threeD) && (
            <div className="plot-field">
              <label htmlFor="projection">{ko ? "투영" : "Projection"}</label>
              <Select
                id="projection"
                value={projection}
                onChange={setProjection}
                options={[
                  { value: "perspective", label: "Perspective" },
                  { value: "orthographic", label: "Orthographic" },
                ]}
              />
            </div>
          )}
          {preset === "helix" && (
            <>
              <div className="plot-field">
                <span id="unbounded-label">
                  {ko ? "무한 정의역" : "Unbounded domain"}
                </span>
                <Switch
                  checked={unbounded}
                  onChange={setUnbounded}
                  aria-labelledby="unbounded-label"
                />
              </div>
              <div className="plot-field">
                <label id="domain-label">
                  {ko ? "매개변수 구간" : "Parameter domain"}:{" "}
                  {unbounded ? "(−∞, ∞)" : `±${domainExtent.toFixed(2)}`}
                </label>
                <Slider
                  disabled={unbounded}
                  min={3.14}
                  max={31.4}
                  step={3.14}
                  value={domainExtent}
                  ariaLabelledByForHandle="domain-label"
                  onChange={setDomainExtent}
                />
              </div>
              <div className="plot-field">
                <label htmlFor="curve-samples">
                  {ko ? "곡선 탐색 정밀도" : "Curve search quality"}
                </label>
                <Select
                  id="curve-samples"
                  value={samples}
                  onChange={setSamples}
                  options={[64, 128, 256, 512].map((value) => ({
                    value,
                    label: String(value),
                  }))}
                />
              </div>
            </>
          )}
          {!gpu && (
            <div className="plot-field">
              <label htmlFor="legend-renderer">
                {ko ? "범례 표시" : "Legend display"}
              </label>
              <Select
                id="legend-renderer"
                value={htmlLegend ? "html" : "gpu"}
                onChange={(value) => setHtmlLegend(value === "html")}
                options={[
                  { value: "gpu", label: ko ? "차트 내부" : "In chart" },
                  { value: "html", label: "HTML" },
                ]}
              />
            </div>
          )}
          <div className="plot-actions">
            <Button
              disabled={!ready}
              onClick={() => {
                active.current.figure?.axes.forEach((ax) => ax.reset());
                const plot = active.current.gpu;
                if (plot) {
                  plot.reset();
                  plot.setStyle(style);
                  plot.setMode(preset === "helix" || threeD ? "3d" : "2d");
                  if (preset === "helix" || threeD)
                    plot.setProjection(projection);
                  if (preset === "power") plot.setParameters({ exponent });
                  if (preset === "sine") plot.setParameters({ frequency });
                  if (preset === "helix") {
                    plot.setDomain(
                      unbounded
                        ? [-Infinity, Infinity]
                        : [-domainExtent, domainExtent],
                    );
                    plot.setQuality({ samples });
                  }
                }
              }}
            >
              {ko ? "뷰 초기화" : "Reset view"}
            </Button>
            <Button
              disabled={!ready || gpu}
              loading={saving}
              onClick={() => void save()}
            >
              {ko ? "PNG 저장" : "Save PNG"}
            </Button>
          </div>
        </div>
        {gpu && (
          <details className="plot-style-options">
            <summary>
              {ko
                ? "선과 라벨 설정 (CSS px)"
                : "Line and label settings (CSS px)"}
            </summary>
            <div className="plot-toolbar">
              <div className="plot-field">
                <label htmlFor="line-style">
                  {ko ? "선 패턴" : "Line pattern"}
                </label>
                <Select
                  id="line-style"
                  value={style.lineStyle}
                  onChange={(lineStyle) =>
                    setStyle((previous) => ({ ...previous, lineStyle }))
                  }
                  options={[
                    { value: "-", label: ko ? "실선" : "Solid" },
                    { value: "--", label: ko ? "파선" : "Dashed" },
                    { value: ":", label: ko ? "점선" : "Dotted" },
                  ]}
                />
              </div>
              <div className="plot-field">
                <label id="dash-period">
                  {ko ? "매개변수 대시 주기" : "Parameter dash period"}:{" "}
                  {style.dashPeriod}
                </label>
                <Slider
                  min={0.05}
                  max={2}
                  step={0.05}
                  value={style.dashPeriod}
                  ariaLabelledByForHandle="dash-period"
                  onChange={(dashPeriod) =>
                    setStyle((previous) => ({ ...previous, dashPeriod }))
                  }
                />
              </div>
              {(
                [
                  ["axisWidth", ko ? "축 굵기" : "Axis width", 0, 4, 0.25],
                  ["gridWidth", ko ? "격자 굵기" : "Grid width", 0, 4, 0.25],
                  ["curveWidth", ko ? "곡선 굵기" : "Curve width", 0, 8, 0.25],
                  ["labelSize", ko ? "글자 크기" : "Label size", 8, 24, 1],
                  [
                    "tickDensity",
                    ko ? "눈금 밀도" : "Tick density",
                    0.25,
                    4,
                    0.25,
                  ],
                  ["labelHalo", ko ? "글자 외곽선" : "Label halo", 0, 2, 0.1],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <div className="plot-field" key={key}>
                  <label id={`style-${key}`}>
                    {label}: {style[key]}
                    {key === "tickDensity" ? "×" : " px"}
                  </label>
                  <Slider
                    min={min}
                    max={max}
                    step={step}
                    value={style[key]}
                    ariaLabelledByForHandle={`style-${key}`}
                    onChange={(value) =>
                      setStyle((previous) => ({ ...previous, [key]: value }))
                    }
                  />
                </div>
              ))}
              {(
                [
                  ["grid", ko ? "격자" : "Grid"],
                  ["tickLabels", ko ? "눈금 숫자" : "Tick labels"],
                  ["axisLabels", ko ? "축 이름" : "Axis labels"],
                  ["labelBackground", ko ? "라벨 배경" : "Label backgrounds"],
                ] as const
              ).map(([key, label]) => (
                <div className="plot-field" key={key}>
                  <span id={`style-${key}`}>{label}</span>
                  <Switch
                    checked={style[key]}
                    aria-labelledby={`style-${key}`}
                    onChange={(value) =>
                      setStyle((previous) => ({ ...previous, [key]: value }))
                    }
                  />
                </div>
              ))}
              <Button onClick={() => setStyle(DEFAULT_STYLE)}>
                {ko ? "스타일 초기화" : "Reset style"}
              </Button>
            </div>
          </details>
        )}
        <div className="plot-stage">
          <div className="plot-mount" ref={mount} />
        </div>
        <div className="plot-status" role="status">
          <strong>{status}</strong>
          <span>
            {ko
              ? "이 브라우저에서 실제 TypePlot을 실행합니다."
              : "Real TypePlot, running in this browser."}
          </span>
        </div>
        {error && (
          <p className="plot-error" role="alert">
            {error}
          </p>
        )}
        <p id="plot-help" className="plot-help">
          {ko
            ? "왼쪽 드래그로 이동하거나 회전하고, 오른쪽 드래그로 이동하며, 스크롤로 확대합니다. 놓으면 관성으로 감속하며 더블 클릭으로 뷰를 초기화합니다. 그래프에 초점을 맞추면 방향키, +/−, Home, Escape를 사용할 수 있습니다. PNG 저장은 데이터 예제에서 지원합니다."
            : "Left-drag to pan or orbit. Right-drag to pan. Scroll to zoom. Focus the plot for arrow keys, +/− and Home. PNG export is available for data examples."}
        </p>
      </div>
      <p className="plot-details">{descriptions[preset]}</p>
      <figure className="code-frame plot-code">
        <figcaption className="code-caption">
          <span>{ko ? "이 그래프를 만드는 코드" : "Code for this plot"}</span>
          <span className="code-file">
            {gpu ? "shader + main.ts" : "main.ts"}
          </span>
        </figcaption>
        <pre>
          <code
            dangerouslySetInnerHTML={{
              __html: Prism.highlight(
                code,
                Prism.languages.typescript,
                "typescript",
              ),
            }}
          />
        </pre>
      </figure>
      <p className="source-meta">
        {ko ? "런타임 소스" : "Runtime source"}:{" "}
        <a
          className="inline-link"
          href={`${version.source}/tree/${version.commit}`}
        >
          {version.commit.slice(0, 12)}
        </a>{" "}
        · Apache-2.0
      </p>
      <details className="plot-data">
        <summary>{ko ? "예제 데이터 설명" : "About the example data"}</summary>
        <p>
          {ko
            ? "모든 값은 예제 코드에 정의한 수식이나 고정 배열에서 생성합니다. 실제 관측 데이터나 성능 측정값이 아닙니다. 방문자가 입력한 코드를 평가하지 않습니다."
            : "Values come from the formulas and fixed arrays in the sample code. They are illustrative data, not measurements or benchmarks. Visitor-provided source is never evaluated."}
        </p>
      </details>
    </ConfigProvider>
  );
}
