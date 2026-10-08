import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
const home = await readFile(path.join(dist, "index.html"), "utf8");
const site = "https://www.ottenauer-motorradfreunde.de";
assert(
  home.includes(`<link rel="canonical" href="${site}/"`),
  "Homepage canonical must use the custom domain",
);
assert(
  home.includes(`content="${site}/v9/assets/gemeinschaft-2016-1920.webp"`),
  "Open Graph image must use the custom domain",
);
const removed = [
  "nachwuchs-presseausschnitt",
  "erste-hilfe-gruppenfoto",
  "veranstaltung.webp",
  "jubilaeum-hero.webp",
];

async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (/\.(html|css|js|xml)$/.test(entry.name)) {
      const body = await readFile(file, "utf8");
      assert(
        !body.includes("emfau88.github.io"),
        `${file} uses the old domain`,
      );
      assert(!body.includes("/motorrad/"), `${file} uses the old base path`);
      for (const name of removed)
        assert(!body.includes(name), `${file} still references ${name}`);
    }
  }
}
await inspect(dist);
for (const route of ["impressum", "datenschutz"]) {
  assert(
    home.includes(`href="/${route}/"`),
    `${route} missing from homepage footer`,
  );
  const html = await readFile(path.join(dist, route, "index.html"), "utf8");
  assert(html.includes("VR 520321") || route === "datenschutz");
  assert(html.includes("Dorfstraße 139"));
  assert(html.includes("legal-document"));
  assert(!html.includes("Dokumentenplatzhalter"));
  assert(!html.includes("Vereinsbestätigung noch offen"));
  assert(!html.includes("Hinweis zum Prüfstand"));
  if (route === "datenschutz") {
    assert(html.includes('id="map-title"'));
    assert(html.includes("OpenStreetMap Foundation"));
    assert(html.includes("Karte ausblenden"));
  }
}
assert(home.includes("Das ist unser Verein"));
assert.equal([...home.matchAll(/class="story-photo"/g)].length, 3);
const tourCaption =
  "Nach 3.100 Kilometern über Dresden durch Tschechien, Polen, die Slowakei, Ungarn und Österreich wieder am Clubhaus – festgehalten direkt nach der Rückkehr.";
assert(home.includes(`<figcaption>${tourCaption}</figcaption>`));
assert(home.includes(`data-photo-caption="${tourCaption}"`));
assert(home.includes("Hier treffen wir uns zum Stammtisch"));
assert(home.includes("Rückblick: 40 Jahre OMF"));
assert(home.includes("vereinsgeschichte-1280.webp"));
assert(home.includes('data-count="seconds"'));
assert(home.includes('id="photo-viewer"'));
assert.equal([...home.matchAll(/anniversary-seal__branch--/g)].length, 2);
assert(home.includes("anniversary-seal__glint"));
const sealStyles = await readFile(
  path.join(dist, "v9/styles/main.css"),
  "utf8",
);
assert(sealStyles.includes("--bg: #eae5d9"));
assert(sealStyles.includes("scroll-margin-top: 94px"));
assert(sealStyles.includes("scroll-margin-top: 78px"));
assert(sealStyles.includes(".timeline h2"));
assert(!home.includes("design-preview.css"));
assert(!home.includes("data-design-preview"));
assert(
  !sealStyles.includes(".anniversary-seal__logo-frame::after"),
  "Logo must remain free of shine effects",
);
assert(sealStyles.includes("@keyframes seal-shine"));
assert(sealStyles.includes("@keyframes seal-glint"));
assert(sealStyles.includes("transform: translate(-65%, 65%)"));
assert(sealStyles.includes("transform: translate(65%, -65%)"));
assert(sealStyles.includes("top: 13.2%"));
assert(sealStyles.includes("left: 82%"));
assert(sealStyles.includes("prefers-reduced-motion: reduce"));
const instagramLinks = [
  ...home.matchAll(
    /<a\b[^>]*href="https:\/\/www\.instagram\.com\/omf19762026\/"[^>]*>/g,
  ),
];
assert.equal(
  instagramLinks.length,
  1,
  "Instagram must appear once in the contact area",
);
for (const [link] of instagramLinks) {
  assert(link.includes('target="_blank"'));
  assert(link.includes('rel="noopener noreferrer"'));
  assert(link.includes("neuem Tab"));
}
assert(!home.includes("instagram.com/embed"));
assert(home.includes("data-map-load"));
assert(home.includes("data-map-open"));
assert(home.includes("data-map-cancel"));
assert(home.includes("merkurhalle-map-preview.png"));
assert(/data-map-placeholder\s+hidden/.test(home));
assert(home.includes("https://www.openstreetmap.org/copyright"));
const mapPreviewMetadata = await sharp(
  path.join(dist, "v9/assets/merkurhalle-map-preview.png"),
).metadata();
assert.equal(mapPreviewMetadata.width, 706);
assert.equal(mapPreviewMetadata.height, 355);
assert(home.includes('id="venue-map-frame"'));
assert(home.includes("Furtwänglerstraße 15"));
assert(/class="footer-badge"[\s\S]*?omf-logo-transparent-v2\.png/.test(home));
assert(home.includes("https://www.openstreetmap.org/export/embed.html?"));
assert(
  !home.includes('rel="preconnect"'),
  "External map must not preconnect before consent",
);
assert.equal([...home.matchAll(/class="instagram-glyph"/g)].length, 1);
assert(!home.includes('class="footer-social"'));
for (const [link] of home.matchAll(
  /<a\b[^>]*href="https:\/\/www\.instagram\.com\/omf19762026\/"[^>]*>[\s\S]*?<\/a>/g,
)) {
  assert(
    !link.includes("↗"),
    "Instagram links must not contain arrow decorations",
  );
}
const officialGlyph = await readFile(
  path.join(dist, "v9/assets/instagram-glyph-white.svg"),
);
assert.equal(
  createHash("sha256").update(officialGlyph).digest("hex"),
  "3347813e9e8f082cdf48495818bd370ccff94b687efb8aa1c8a7b36cfcfb8291",
  "Official Instagram glyph must remain unchanged",
);
assert.equal([...home.matchAll(/data-photo-caption=/g)].length, 5);
assert(
  home.includes(
    "https://www.google.com/maps/dir/?api=1&amp;destination=Merkurhalle",
  ),
);
for (const sourceSet of home.matchAll(/srcset="([^"]+)"/g)) {
  for (const entry of sourceSet[1].split(",")) {
    const [url, width] = entry.trim().split(/\s+/);
    const local = path.join(dist, url.replace(/^\//, ""));
    await access(local);
    const metadata = await sharp(local).metadata();
    assert.equal(
      metadata.width,
      parseInt(width),
      `Wrong srcset width for ${url}`,
    );
  }
}
for (const url of home.matchAll(
  /(?:src|href)="(\/v9\/[^"?]+)(?:\?[^" ]*)?"/g,
)) {
  await access(path.join(dist, url[1].replace(/^\//, "")));
}
assert(!/<iframe|<form\b/.test(home), "Unexpected embedded service or form");
console.log(
  "Site checks passed: photos, legal routes, official Instagram glyph, footer logo and opt-in map.",
);
