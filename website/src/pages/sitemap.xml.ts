export function GET() {
  const paths = [
    "",
    "guide/",
    "guide/gpu/",
    "api/",
    "playground/",
    "examples/",
  ];
  const urls = paths
    .flatMap((path) => [path, `ko/${path}`])
    .map((path) => `<url><loc>https://plot.typeshade.dev/${path}</loc></url>`)
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
