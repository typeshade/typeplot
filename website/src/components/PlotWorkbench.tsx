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
  type Plot,
  type PlotProgram,
  type PlotProjection,
} from "../vendor/typeplot/index.js";
import power from "../vendor/typeplot/curve.js";
import helix from "../vendor/typeplot/helix.js";
import { exampleCode, type Preset } from "../content/samples";
import version from "../vendor/typeplot/version.json";

type Backend = "auto" | "webgpu" | "webgl2";
export default function PlotWorkbench({ locale }: { locale: "en" | "ko" }) {
  const ko = locale === "ko";
  const [preset, setPreset] = useState<Preset>("signals");
  const [frequency, setFrequency] = useState(1);
  const [exponent, setExponent] = useState(2);
  const [backend, setBackend] = useState<Backend>("auto");
  const [threeD, setThreeD] = useState(false);
  const [projection, setProjection] = useState<PlotProjection>("perspective");
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
  const desired = useRef({ exponent, threeD, projection });
  desired.current = { exponent, threeD, projection };
  const gpu = preset === "power" || preset === "helix";
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
        (preset === "power" ? power : helix) as PlotProgram,
        {
          bounds:
            preset === "power"
              ? { x: [0, 1], y: [0, 1] }
              : { x: [-6.28, 6.28], y: [-1.25, 1.25] },
          backend,
          mode: preset === "helix" || threeD ? "3d" : "2d",
          projection: preset === "helix" || threeD ? projection : undefined,
          label:
            preset === "power"
              ? ko
                ? "거듭제곱 함수"
                : "Power function"
              : ko
                ? "3차원 나선"
                : "Spatial helix",
          parameters: preset === "power" ? { exponent } : undefined,
          onError: fail,
        },
      )
        .then((result) => {
          if (disposed) {
            result.destroy();
            return;
          }
          plot = result;
          const current = desired.current;
          result.setMode(preset === "helix" || current.threeD ? "3d" : "2d");
          if (preset === "helix" || current.threeD)
            result.setProjection(current.projection);
          if (preset === "power")
            result.setParameters({ exponent: current.exponent });
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
    plot.setMode(preset === "helix" || threeD ? "3d" : "2d");
    if (preset === "helix" || threeD) plot.setProjection(projection);
    if (preset === "power") plot.setParameters({ exponent });
  }, [preset, exponent, threeD, projection, ready]);
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
  const code = exampleCode(
    preset,
    frequency,
    exponent,
    backend,
    threeD,
    projection,
  );
  const descriptions: Record<Preset, string> = ko
    ? {
        signals:
          "0부터 2π까지의 구간에서 사인과 코사인을 200개 점으로 표시합니다. 진폭 범위는 −1부터 1까지입니다.",
        scatter:
          "지수 함수에 일정한 변화를 더한 35개 표본입니다. 세로축은 밑이 10인 로그 축입니다.",
        bars: "네 집단의 관측값은 순서대로 12, 19, 8, 15입니다.",
        histogram:
          "세 삼각함수로 만든 600개 값을 20개 구간으로 나눕니다. 막대의 전체 넓이는 1입니다.",
        power: `0부터 1까지의 구간에서 y = x^${exponent}을 표시합니다. 음수 구간은 셰이더에서 제외합니다.`,
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
        power: `y = x^${exponent} over zero to one. The shader omits the negative domain.`,
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
          {preset === "signals" && (
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
          <div className="plot-actions">
            <Button
              disabled={!ready}
              onClick={() => {
                active.current.figure?.axes.forEach((ax) => ax.reset());
                const plot = active.current.gpu;
                if (plot) {
                  plot.reset();
                  plot.setMode(preset === "helix" || threeD ? "3d" : "2d");
                  if (preset === "helix" || threeD)
                    plot.setProjection(projection);
                  if (preset === "power") plot.setParameters({ exponent });
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
            ? "드래그로 이동하거나 회전하고, 스크롤로 확대합니다. 그래프에 초점을 맞추면 방향키, +/−, Home을 사용할 수 있습니다. PNG 저장은 데이터 예제에서 지원합니다."
            : "Drag to pan or orbit. Scroll to zoom. Focus the plot for arrow keys, +/− and Home. PNG export is available for data examples."}
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
