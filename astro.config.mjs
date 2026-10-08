import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.ottenauer-motorradfreunde.de",
  base: "/",
  integrations: [sitemap()],
  output: "static",
  build: {
    inlineStylesheets: "auto",
  },
});
