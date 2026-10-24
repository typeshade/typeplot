/** CSS color parsing supplies uniforms only; no host graphics context is created. */
const colors = new WeakMap<Document, Map<string, number[]>>();
export function color(value: string, document: Document): number[] {
  let cache = colors.get(document);
  if (!cache) {
    cache = new Map();
    colors.set(document, cache);
  }
  const known = cache.get(value);
  if (known) return [...known];
  const probe = document.createElement("span");
  probe.style.color = value;
  if (!probe.style.color) throw new TypeError(`Invalid CSS color: ${value}`);
  probe.style.display = "none";
  document.body.appendChild(probe);
  const resolved = document.defaultView!.getComputedStyle(probe).color;
  probe.remove();
  // Requesting the sRGB equivalent through computed style covers named and hex colors.
  const channels = resolved
    .match(/^rgba?\(([^)]+)\)$/)?.[1]
    .split(/[,\s/]+/)
    .map(Number);
  if (
    !channels ||
    channels.length < 3 ||
    channels.some((v) => !Number.isFinite(v))
  )
    throw new TypeError(`Use an sRGB CSS color: ${value}`);
  const result = [
    channels[0] / 255,
    channels[1] / 255,
    channels[2] / 255,
    channels[3] ?? 1,
  ];
  if (!value.includes("var(") && value !== "currentColor")
    cache.set(value, result);
  return [...result];
}
