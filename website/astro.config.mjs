import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import preloadIslands from "./integrations/preload-islands.mjs";
export default defineConfig({
  site: "https://plot.typeshade.dev",
  integrations: [react(), preloadIslands()],
  vite: { plugins: [tailwindcss()] },
  build: { format: "directory" },
});
