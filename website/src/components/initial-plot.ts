import {
  subplots,
  linspace,
  type Axes,
  type Figure,
} from "../vendor/typeplot/data.js";

export function signalPlot(ax: Axes, frequency: number) {
  const x = linspace(0, Math.PI * 2, 200);
  const sine = ax.plot(x, (v) => Math.sin(v * frequency), { label: "Sine" });
  const cosine = ax.plot(x, (v) => Math.cos(v * frequency), {
    label: "Cosine",
    lineStyle: "--",
  });
  ax.set({
    xLabel: "Angle (radians)",
    yLabel: "Amplitude",
    grid: true,
    legend: true,
  });
  return { x, lines: [sine, cosine], frequency };
}

interface InitialPlot {
  fig: Figure;
  axes: readonly Axes[];
  signal: ReturnType<typeof signalPlot>;
  handoff(report: (error: Error) => void): void;
}
const initial = new WeakMap<HTMLElement, InitialPlot>();
const claimed = new WeakSet<HTMLElement>();

/** The small entry starts the real chart without waiting for React controls. */
export function prepareInitialPlot(target: HTMLElement, locale: string) {
  if (claimed.has(target) || initial.has(target)) return;
  let report: ((error: Error) => void) | undefined;
  let notice: HTMLParagraphElement | undefined;
  const { fig, axes } = subplots(1, 1, {
    target,
    width: 900,
    height: 440,
    toolbar: false,
    backend: "auto",
    onError(error) {
      if (report) {
        report(error);
        return;
      }
      if (!notice) {
        notice = target.ownerDocument.createElement("p");
        notice.className = "plot-error";
        notice.setAttribute("role", "alert");
        target.appendChild(notice);
      }
      notice.textContent =
        locale === "ko"
          ? `그래프를 표시하지 못했습니다: ${error.message}`
          : `Unable to render the plot: ${error.message}`;
    },
  });
  try {
    initial.set(target, {
      fig,
      axes,
      signal: signalPlot(axes[0], 1),
      handoff(callback) {
        report = callback;
        notice?.remove();
      },
    });
  } catch (error) {
    fig.destroy();
    throw error;
  }
}

/** Transfer ownership once; a later bootstrap must not create a second chart. */
export function claimInitialPlot(
  target: HTMLElement,
  report: (error: Error) => void,
) {
  claimed.add(target);
  const plot = initial.get(target);
  initial.delete(target);
  plot?.handoff(report);
  return plot;
}
