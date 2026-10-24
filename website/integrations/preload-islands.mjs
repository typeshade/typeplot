import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

/** Discover critical imports from Rollup, never from a list of chunk hashes. */
export default function preloadIslands() {
  const imports = new Map();
  const runtime = new Set(),
    fallback = new Set();
  return {
    name: "typeplot-preload-islands",
    hooks: {
      "astro:config:setup"({ updateConfig }) {
        const { webgl2 } = JSON.parse(
          readFileSync(
            new URL(
              "../src/vendor/typeplot/browser-load.json",
              import.meta.url,
            ),
            "utf8",
          ),
        );
        updateConfig({
          vite: {
            plugins: [
              {
                name: "typeplot-client-imports",
                generateBundle(_options, bundle) {
                  for (const entry of Object.values(bundle))
                    if (
                      entry.type === "chunk" &&
                      entry.fileName.startsWith("_astro/")
                    ) {
                      imports.set(
                        `/${entry.fileName}`,
                        entry.imports.map((name) => `/${name}`),
                      );
                      if (
                        entry.moduleIds.some((id) =>
                          /\/vendor\/typeplot\/[^/]+\.js$/.test(id),
                        )
                      )
                        runtime.add(`/${entry.fileName}`);
                      if (
                        entry.moduleIds.some((id) =>
                          webgl2.some((name) =>
                            id.endsWith(`/vendor/typeplot/${name}`),
                          ),
                        )
                      )
                        fallback.add(`/${entry.fileName}`);
                    }
                },
              },
            ],
          },
        });
      },
      async "astro:build:done"({ dir }) {
        async function visit(directory) {
          for (const entry of await readdir(directory, {
            withFileTypes: true,
          })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) {
              await visit(path);
              continue;
            }
            if (!entry.name.endsWith(".html")) continue;
            const html = await readFile(path, "utf8"),
              critical = new Set();
            function include(url) {
              if (!imports.has(url) || critical.has(url)) return;
              critical.add(url);
              imports.get(url).forEach(include);
            }
            for (const [tag] of html.matchAll(/<astro-island\b[^>]*>/g)) {
              if (!/\bclient="load"/.test(tag)) continue;
              for (const [, url] of tag.matchAll(
                /\b(?:component|renderer)-url="([^"]+)"/g,
              ))
                include(url);
            }
            for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
              if (!/\btype="module"/.test(tag)) continue;
              const url = tag.match(/\bsrc="([^"]+)"/)?.[1];
              if (url) include(url);
            }
            // Fetch the small fallback backend alongside an immediate chart's
            // UI, without creating a second context or forcing a backend.
            if ([...critical].some((url) => runtime.has(url)))
              fallback.forEach(include);
            // Visibility/idle islands and dynamic imports stay deferred.
            const existing = new Set(
              [
                ...html.matchAll(
                  /<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"[^>]*>/g,
                ),
              ].map((match) => match[1]),
            );
            const links = [...critical]
              .filter((url) => !existing.has(url))
              .map((url) => `<link rel="modulepreload" href="${url}">`)
              .join("");
            if (links)
              await writeFile(path, html.replace("</head>", `${links}</head>`));
          }
        }
        await visit(fileURLToPath(dir));
      },
    },
  };
}
