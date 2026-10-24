# TypePlot website

Source for https://plot.typeshade.dev. Follow TypeNN's website conventions: Astro static
routes, React islands, TailwindCSS v4, Ant Design v5, and locally served IBM Plex fonts.
English routes live at `/`; separately written Korean routes live at `/ko/`.

```sh
# From the TypePlot repository root:
npm ci
npm run build
npm run examples
npm ci --prefix website
npm run build --prefix website
npm run dev --prefix website
```

The website prebuild syncs the real built TypePlot browser runtime, declarations, and
compiled example programs into `src/vendor/typeplot/`. It records the source commit and
retains Apache-2.0 notices. The playground executes this runtime; it never evaluates
visitor-provided source. See PRODUCT.md and DESIGN.md for product and visual rules.

The shared ESM graph and font assets are synced together. The default data chart does not
load GPU example programs; selecting a GPU preset imports its runtime and program on demand.
The Playground preloads the common SDF atlas. Figures request the full Hangul atlas only
when their plotted text needs it. Hashed `/_astro/` assets use immutable caching; HTML keeps
the hosting platform's revalidation behavior. See [loading behavior](../docs/loading.md).

Cloudflare Workers serves `website/dist` as static assets through the root `wrangler.jsonc`.
The only public hostname is `plot.typeshade.dev`; workers.dev is disabled. The deployment
workflow builds the library and website on pushes to main. Local deployment uses the same
configuration with `npx wrangler deploy` and the configured Cloudflare credentials.
