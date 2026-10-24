import { useEffect, useRef, useState } from "react";
import { Button, Select, Slider } from "antd";
import type { Plot, Timeline } from "../vendor/typeplot/index.js";

export default function MotionControls({
  plot,
  locale,
  spatial,
}: {
  plot: Plot;
  locale: "en" | "ko";
  spatial: boolean;
}) {
  const ko = locale === "ko",
    timeline = useRef<Timeline | undefined>(undefined),
    frame = useRef(0);
  const [target, setTarget] = useState<
    "function" | "content" | "axes" | "root"
  >("function");
  const preparing = useRef<Promise<Timeline> | undefined>(undefined),
    generation = useRef(0);
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [fov, setFov] = useState(() => (plot.getCamera().fov * 180) / Math.PI),
    [distance, setDistance] = useState(() => plot.getCamera().distance);
  const phaseKey = "phase" in plot.parameters() ? "phase" : "heightScale";
  const [parameter, setParameter] = useState(() => plot.parameters()[phaseKey]);
  function snapshot() {
    if (!live.current) return;
    const current = timeline.current;
    if (current) setTime(Math.min(6, current.time));
    setPlaying(current?.state === "playing");
    setParameter(plot.parameters()[phaseKey]);
    const camera = plot.getCamera();
    setFov((camera.fov * 180) / Math.PI);
    setDistance(camera.distance);
  }
  const live = useRef(true),
    last = useRef(0);
  function poll(now: number) {
    frame.current = 0;
    if (!live.current) return;
    if (now - last.current > 100) {
      last.current = now;
      snapshot();
    }
    if (timeline.current?.state === "playing")
      frame.current = requestAnimationFrame(poll);
    else snapshot();
  }
  async function motion(): Promise<Timeline> {
    if (timeline.current) return timeline.current;
    if (!preparing.current) {
      const version = generation.current;
      preparing.current = (async () => {
        const {
          parallel,
          multiplyMatrices,
          rotationMatrix,
          translationMatrix,
        } = await import("../vendor/typeplot/index.js");
        if (!live.current || version !== generation.current)
          throw new Error("Motion was cancelled.");
        const camera = plot.getCamera(),
          route = spatial ? target : "function";
        const clips = [];
        if (route !== "axes")
          clips.push(
            plot.transition(
              {
                parameters: {
                  [phaseKey]: phaseKey === "phase" ? 2 * Math.PI : 1.5,
                },
                ...(route !== "content"
                  ? {
                      camera: {
                        rotation: [camera.rotation[0] + 1.2, 0.6],
                        distance: 3.6,
                        fov: Math.PI / 3,
                      },
                    }
                  : {}),
              },
              { duration: 6 },
            ),
          );
        if (route !== "function") {
          const node = plot.scene[route];
          const transform = multiplyMatrices(
            node.getTransform(),
            multiplyMatrices(
              translationMatrix(0, route === "content" ? 0.65 : 0, 0),
              rotationMatrix(0.85, [0, 0, 1]),
            ),
          );
          clips.push(
            node.transition(
              { transform, opacity: route === "content" ? 0.45 : 1 },
              { duration: 6 },
            ),
          );
        }
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
  function pause() {
    timeline.current?.pause();
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    snapshot();
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
    timeline.current = undefined;
    preparing.current = undefined;
    return () => {
      generation.current++;
      live.current = false;
      if (frame.current) cancelAnimationFrame(frame.current);
      timeline.current?.cancel();
    };
  }, [plot, spatial]);
  return (
    <div className="plot-motion">
      {spatial && (
        <div className="plot-toolbar">
          <div className="plot-field">
            <label htmlFor="motion-target">
              {ko ? "애니메이션 대상" : "Animation target"}
            </label>
            <Select
              id="motion-target"
              value={target}
              disabled={busy}
              options={[
                {
                  value: "function",
                  label: ko ? "함수와 카메라" : "Function and camera",
                },
                {
                  value: "content",
                  label: ko ? "곡면 이동·페이드" : "Move and fade surface",
                },
                {
                  value: "axes",
                  label: ko ? "좌표계만 회전" : "Rotate coordinate frame",
                },
                { value: "root", label: ko ? "전체 장면" : "Whole scene" },
              ]}
              onChange={async (value) => {
                pause();
                setBusy(true);
                try {
                  if (timeline.current) await timeline.current.seek(0);
                  timeline.current?.cancel();
                  timeline.current = undefined;
                  setTime(0);
                  setTarget(value);
                } catch (error) {
                  if (live.current) setError(String(error));
                } finally {
                  if (live.current) setBusy(false);
                }
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
          <label id="timeline-label">
            {ko ? "애니메이션 시간" : "Animation time"}: {time.toFixed(2)} s
          </label>
          <Slider
            min={0}
            max={6}
            step={0.02}
            value={time}
            ariaLabelledByForHandle="timeline-label"
            onChange={(value) => void seek(value)}
          />
        </div>
      </div>
      <details className="plot-style-options">
        <summary>
          {ko ? "함수와 카메라 조절" : "Function and camera controls"}
        </summary>
        <div className="plot-toolbar">
          <div className="plot-field">
            <label id="surface-parameter">
              {phaseKey === "phase"
                ? ko
                  ? "위상"
                  : "Phase"
                : ko
                  ? "높이 배율"
                  : "Height scale"}
              : {parameter.toFixed(2)}
            </label>
            <Slider
              min={phaseKey === "phase" ? 0 : 0.25}
              max={phaseKey === "phase" ? 2 * Math.PI : 2}
              step={0.02}
              value={parameter}
              ariaLabelledByForHandle="surface-parameter"
              onChange={(value) => {
                pause();
                plot.setParameters({ [phaseKey]: value });
                setParameter(value);
                timeline.current?.cancel();
                timeline.current = undefined;
              }}
            />
          </div>
          <div className="plot-field">
            <label id="camera-fov">
              {ko ? "시야각" : "Field of view"}: {fov.toFixed(0)}°
            </label>
            <Slider
              min={25}
              max={80}
              step={1}
              value={fov}
              ariaLabelledByForHandle="camera-fov"
              onChange={(value) => {
                pause();
                plot.setCamera({ fov: (value * Math.PI) / 180 });
                setFov(value);
              }}
            />
          </div>
          <div className="plot-field">
            <label id="camera-distance">
              {ko ? "카메라 거리" : "Camera distance"}: {distance.toFixed(2)}
            </label>
            <Slider
              min={2}
              max={6}
              step={0.05}
              value={distance}
              ariaLabelledByForHandle="camera-distance"
              onChange={(value) => {
                pause();
                plot.setCamera({ distance: value });
                setDistance(value);
              }}
            />
          </div>
        </div>
      </details>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
