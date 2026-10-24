import { useEffect, useState } from "react";
import type { Figure, DataPick } from "../vendor/typeplot/data.js";
import type { Plot, PlotPick, PickEvent } from "../vendor/typeplot/index.js";
export default function PickReadout({
  plot,
  figure,
  locale,
}: {
  plot?: Plot;
  figure?: Figure;
  locale: "en" | "ko";
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue("");
    let last = 0;
    const update = (text: string) => {
      const now = performance.now();
      if (text && now - last < 80) return;
      last = now;
      setValue(text);
    };
    const gpu = (event: PickEvent<PlotPick>) =>
      update(
        event.result
          ? `${event.result.objectId ? `${event.result.objectId} · ` : ""}x ${event.result.point[0].toFixed(3)} · y ${event.result.point[1].toFixed(3)} · z ${event.result.point[2].toFixed(3)}`
          : "",
      );
    const data = (event: PickEvent<DataPick>) =>
      update(
        event.result
          ? `x ${event.result.x.toFixed(3)} · y ${event.result.y.toFixed(3)}${event.result.value === undefined ? "" : ` · ${locale === "ko" ? "값" : "value"} ${event.result.value.toFixed(3)}`}`
          : "",
      );
    plot?.on("hover", gpu).on("click", gpu);
    figure?.axes.forEach((ax) => ax.on("hover", data).on("click", data));
    return () => {
      plot?.off("hover", gpu).off("click", gpu);
      figure?.axes.forEach((ax) => ax.off("hover", data).off("click", data));
    };
  }, [plot, figure, locale]);
  return (
    <output className="plot-readout" aria-live="off">
      {value ||
        (locale === "ko"
          ? "그래프 위에 포인터를 올리거나 눌러 값을 확인하십시오."
          : "Hover or click the plot to inspect values.")}
    </output>
  );
}
