import { useEffect, useState } from "react";

export default function LiveCode({
  code,
  ready,
}: {
  code: string;
  ready: boolean;
}) {
  const [highlighted, setHighlighted] = useState({ code: "", html: "" });
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const idle = window.requestIdleCallback?.(
      () => {
        void run();
      },
      { timeout: 1000 },
    );
    const timer =
      idle === undefined
        ? window.setTimeout(() => {
            void run();
          }, 0)
        : undefined;
    async function run() {
      try {
        const { highlight } = await import("./highlight-code");
        if (!cancelled) setHighlighted({ code, html: highlight(code) });
      } catch {
        // Plain, escaped code remains readable if highlighting cannot load.
      }
    }
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [code, ready]);
  return highlighted.code === code && highlighted.html ? (
    <code dangerouslySetInnerHTML={{ __html: highlighted.html }} />
  ) : (
    <code>{code}</code>
  );
}
