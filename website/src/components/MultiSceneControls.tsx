import { useEffect, useRef, useState } from "react";
import { Button, Select, Slider, Switch } from "antd";
import type {
  Plot,
  SceneObject,
  SceneGroup,
  Timeline,
  PlotPick,
  PickEvent,
} from "../vendor/typeplot/index.js";

export default function MultiSceneControls({
  plot,
  locale,
  onSpatial,
}: {
  plot: Plot;
  locale: "en" | "ko";
  onSpatial: () => void;
}) {
  const ko = locale === "ko",
    live = useRef(true),
    timeline = useRef<Timeline | undefined>(undefined),
    group = useRef<SceneGroup | undefined>(undefined),
    frame = useRef(0),
    preparing = useRef<Promise<Timeline> | undefined>(undefined),
    generation = useRef(0);
  const [curve, setCurve] = useState<SceneObject | null>(
    () =>
      plot.scene.objects.find((object) => object.id === "trajectory") ?? null,
  );
  const [selected, setSelected] = useState(curve ? "trajectory" : "primary"),
    [visible, setVisible] = useState(true),
    [opacity, setOpacity] = useState(1),
    [lift, setLift] = useState(() => curve?.parameters().lift ?? 0.04),
    [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const node = selected === "trajectory" && curve ? curve : plot.scene.content;
  function snapshot() {
    if (!live.current) return;
    const current = timeline.current;
    setTime(current?.time ?? 0);
    setPlaying(current?.state === "playing");
    setOpacity(node.getOpacity());
    setVisible(node.isVisible());
    if (curve) setLift(curve.parameters().lift);
  }
  function poll() {
    frame.current = 0;
    if (!live.current) return;
    snapshot();
    if (timeline.current?.state === "playing")
      frame.current = requestAnimationFrame(poll);
  }
  function pause() {
    timeline.current?.pause();
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    setPlaying(false);
  }
  function cancel() {
    generation.current++;
    preparing.current = undefined;
    pause();
    timeline.current?.cancel();
    timeline.current = undefined;
    setTime(0);
  }
  async function motion(): Promise<Timeline> {
    if (timeline.current) return timeline.current;
    if (!preparing.current) {
      const version = generation.current;
      preparing.current = (async () => {
        const { parallel, multiplyMatrices, rotationMatrix } =
          await import("../vendor/typeplot/index.js");
        if (!live.current || version !== generation.current)
          throw new Error("Scene motion was cancelled.");
        if (!group.current)
          group.current = plot.scene.group(
            plot.scene.content,
            ...(curve ? [curve] : []),
          );
        else if (curve && curve.parent !== group.current)
          group.current.add(curve);
        const camera = plot.getCamera(),
          clips = [
            plot.transition(
              {
                parameters: { phase: 2 * Math.PI },
                camera: {
                  rotation: [camera.rotation[0] + 1, 0.6],
                  distance: 3.6,
                },
              },
              { duration: 6 },
            ),
            group.current.transition(
              {
                transform: multiplyMatrices(
                  group.current.getTransform(),
                  rotationMatrix(0.35, [0, 0, 1]),
                ),
              },
              { duration: 6 },
            ),
          ];
        if (curve)
          clips.push(
            curve.transition(
              { parameters: { phase: 2 * Math.PI, lift: 0.25 } },
              { duration: 6 },
            ),
          );
        const result = plot.timeline();
        result.add(parallel(...clips), 0);
        timeline.current = result;
        return result;
      })().finally(() => {
        if (version === generation.current) preparing.current = undefined;
      });
    }
    return preparing.current;
  }
  async function seek(value: number) {
    pause();
    setBusy(true);
    try {
      await (await motion()).seek(value);
      snapshot();
    } catch (error) {
      if (live.current) setError(String(error));
    } finally {
      if (live.current) setBusy(false);
    }
  }
  useEffect(() => {
    live.current = true;
    const pick = (event: PickEvent<PlotPick>) => {
      if (event.result?.objectId) {
        pause();
        setSelected(event.result.objectId);
      }
    };
    plot.on("click", pick);
    return () => {
      generation.current++;
      live.current = false;
      if (frame.current) cancelAnimationFrame(frame.current);
      timeline.current?.cancel();
      plot.off("click", pick);
    };
  }, [plot]);
  useEffect(() => {
    setOpacity(node.getOpacity());
    setVisible(node.isVisible());
  }, [node]);
  return (
    <div className="plot-motion">
      <div className="plot-toolbar">
        <div className="plot-field">
          <label htmlFor="scene-object">
            {ko ? "선택한 객체" : "Selected object"}
          </label>
          <Select
            id="scene-object"
            value={selected}
            disabled={busy}
            onChange={(value) => {
              pause();
              setSelected(value);
            }}
            options={[
              { value: "primary", label: ko ? "곡면" : "Surface" },
              ...(curve
                ? [{ value: "trajectory", label: ko ? "곡선" : "Curve" }]
                : []),
            ]}
          />
        </div>
        <div className="plot-field">
          <span id="scene-visible">{ko ? "객체 표시" : "Object visible"}</span>
          <Switch
            aria-labelledby="scene-visible"
            checked={visible}
            onChange={(value) => {
              cancel();
              node.setVisible(value);
              setVisible(value);
            }}
          />
        </div>
        <div className="plot-field">
          <label id="scene-opacity">
            {ko ? "객체 투명도" : "Object opacity"}: {opacity.toFixed(2)}
          </label>
          <Slider
            ariaLabelledByForHandle="scene-opacity"
            min={0}
            max={1}
            step={0.02}
            value={opacity}
            onChange={(value) => {
              cancel();
              node.setOpacity(value);
              setOpacity(value);
            }}
          />
        </div>
        <div className="plot-actions">
          <Button
            disabled={busy}
            onClick={async () => {
              cancel();
              setBusy(true);
              try {
                if (curve) {
                  await curve.remove();
                  if (live.current) {
                    setCurve(null);
                    setSelected("primary");
                  }
                } else {
                  const program =
                    await import("../vendor/typeplot/surface-curve.js");
                  if (plot.getMode() !== "3d") plot.setMode("3d");
                  onSpatial();
                  const next = await plot.scene.add(program.default, {
                    id: "trajectory",
                    parameters: { phase: plot.parameters().phase, lift: 0.04 },
                    domain: [-3, 3],
                    quality: { samples: 64 },
                    style: { color: "#ff7f0e", curveWidth: 3 },
                  });
                  if (live.current) {
                    group.current?.add(next);
                    setCurve(next);
                    setSelected("trajectory");
                  }
                }
              } catch (error) {
                if (live.current) setError(String(error));
              } finally {
                if (live.current) setBusy(false);
              }
            }}
          >
            {curve
              ? ko
                ? "곡선 제거"
                : "Remove curve"
              : ko
                ? "곡선 추가"
                : "Add curve"}
          </Button>
        </div>
      </div>
      {curve && (
        <div className="plot-toolbar">
          <div className="plot-field">
            <label id="scene-lift">
              {ko ? "곡선 높이 차이" : "Curve lift"}: {lift.toFixed(2)}
            </label>
            <Slider
              ariaLabelledByForHandle="scene-lift"
              min={-0.8}
              max={0.8}
              step={0.02}
              value={lift}
              onChange={(value) => {
                cancel();
                curve.setParameters({ lift: value });
                setLift(value);
              }}
            />
          </div>
        </div>
      )}
      <div className="plot-toolbar">
        <div className="plot-actions">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                if (playing) pause();
                else {
                  (await motion()).play();
                  setPlaying(true);
                  frame.current = requestAnimationFrame(poll);
                }
              } catch (error) {
                if (live.current) setError(String(error));
              } finally {
                if (live.current) setBusy(false);
              }
            }}
          >
            {playing ? (ko ? "일시정지" : "Pause") : ko ? "재생" : "Play"}
          </Button>
          <Button disabled={busy} onClick={() => void seek(0)}>
            {ko ? "처음으로" : "Rewind"}
          </Button>
        </div>
        <div className="plot-field">
          <label id="scene-time">
            {ko ? "장면 애니메이션 시간" : "Scene animation time"}:{" "}
            {time.toFixed(2)} s
          </label>
          <Slider
            ariaLabelledByForHandle="scene-time"
            min={0}
            max={6}
            step={0.02}
            value={time}
            onChange={(value) => void seek(value)}
          />
        </div>
      </div>
      <p className="plot-note">
        {ko
          ? "곡면 또는 곡선을 클릭해 선택하십시오. 곡선 높이를 음수로 낮추면 곡면 뒤에 가려지는 부분을 확인할 수 있습니다."
          : "Click the surface or curve to select it. Lower the curve lift below zero to inspect occlusion behind the surface."}
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
