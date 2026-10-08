import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.ottenauer-motorradfreunde.de",
  base: "/",
  integrations: [
    sitemap({
      // The legal pages retain their noindex; draft routes are not published.
      filter: (page) => new URL(page).pathname === "/",
    }),
  ],
  output: "static",
  build: {
    inlineStylesheets: "auto",
  },
});
