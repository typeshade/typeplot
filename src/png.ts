/** PNG encoding only: pixels have already been rendered by TypeShade and read from a GPU texture. */
export async function encodePng(
  bytes: Uint8Array,
  width: number,
  height: number,
): Promise<Blob> {
  const rows = new Uint8Array((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    rows.set(
      bytes.subarray(y * width * 4, (y + 1) * width * 4),
      y * (width * 4 + 1) + 1,
    );
  const compressed = new Uint8Array(
    await new Response(
      new Blob([rows]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const encoder = new TextEncoder();
  function chunk(kind: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
    const result = new Uint8Array(data.length + 12),
      view = new DataView(result.buffer);
    view.setUint32(0, data.length);
    result.set(encoder.encode(kind), 4);
    result.set(data, 8);
    let crc = 0xffffffff;
    for (let i = 4; i < data.length + 8; i++) {
      crc ^= result[i];
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    view.setUint32(data.length + 8, (crc ^ 0xffffffff) >>> 0);
    return result;
  }
  const header = new Uint8Array(13),
    view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 6;
  return new Blob(
    [
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", compressed),
      chunk("IEND", new Uint8Array()),
    ],
    { type: "image/png" },
  );
}
