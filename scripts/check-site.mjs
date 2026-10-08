import assert from "node:assert/strict";
import { readFile, access, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createHash } from "node:crypto";
import {
  anniversaryEndsAt,
  anniversaryHistory,
  isAnniversaryOver,
} from "../src/config/anniversary.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.resolve(root, process.argv[2] || "dist");
const home = await readFile(path.join(dist, "index.html"), "utf8");
const site = "https://www.ottenauer-motorradfreunde.de";
const anniversaryExpired = isAnniversaryOver(
  process.env.OMF_BUILD_TIME ?? new Date(),
);
assert(home.includes(`data-anniversary-ends-at="${anniversaryEndsAt}"`));
assert(home.includes(`data-anniversary-expired="${anniversaryExpired}"`));
const body = home.slice(home.indexOf("<body>"));
assert.equal(
  [...body.matchAll(/data-anniversary-event(?:=|\s|>)/g)].length,
  anniversaryExpired ? 0 : 4,
);
assert.equal(
  [...body.matchAll(/data-anniversary-pending(?:=|\s|>)/g)].length,
  anniversaryExpired ? 0 : 2,
);
assert.equal(
  [...body.matchAll(/data-anniversary-history(?:=|\s|>)/g)].length,
  1,
);
assert(home.includes(".anniversary-expired [data-anniversary-event]"));
assert(home.includes(".anniversary-expired [data-anniversary-pending]"));
const heroButton = body.match(
  /<a\b[^>]*data-anniversary-cta[^>]*>([^<]*)<\/a>/,
);
assert(heroButton, "Hero button missing");
assert.equal(
  attributes(heroButton[0]).href,
  anniversaryExpired ? "#geschichte" : "#jubilaeum",
);
assert.equal(
  heroButton[1].trim(),
  anniversaryExpired ? "Unsere Geschichte" : "50 Jahre OMF",
);
assert.equal(body.includes('id="jubilaeum"'), !anniversaryExpired);
assert.equal(body.includes('href="#jubilaeum"'), !anniversaryExpired);
assert.equal(body.includes("Nächster großer Termin"), !anniversaryExpired);
assert(body.includes('<div class="year">2026</div>'));
assert(
  body.includes(
    anniversaryExpired
      ? anniversaryHistory
      : "Das Jubiläum wird im Oktober in der Merkurhalle Ottenau gefeiert.",
  ),
);
if (anniversaryExpired) assert(!body.includes("Das Jubiläum wird im Oktober"));
function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name,
      value.replaceAll("&amp;", "&"),
    ]),
  );
}

function metadata(html) {
  return new Map(
    [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => {
      const values = attributes(tag);
      return [values.name || values.property, values.content];
    }),
  );
}

const meta = metadata(home);
const title = home.match(/<title>([^<]+)<\/title>/)?.[1];
assert.equal(
  title,
  "Ottenauer Motorradfreunde e. V. | Motorradverein in Gaggenau",
);
assert(meta.get("description")?.includes("Gaggenau-Ottenau"));
assert(!/noindex/i.test(meta.get("robots") || ""));
assert.equal(meta.get("og:title"), title);
assert.equal(meta.get("og:description"), meta.get("description"));
assert.equal(meta.get("og:site_name"), "Ottenauer Motorradfreunde e. V.");
assert.equal(meta.get("og:url"), `${site}/`);
assert.equal(meta.get("twitter:card"), "summary_large_image");
assert.equal(meta.get("twitter:title"), title);
assert.equal(meta.get("twitter:description"), meta.get("description"));
assert.equal(meta.get("twitter:image"), meta.get("og:image"));
assert.equal(meta.get("twitter:image:alt"), meta.get("og:image:alt"));
assert(
  home.includes(`<link rel="canonical" href="${site}/"`),
  "Homepage canonical must use the custom domain",
);
assert(
  home.includes(`content="${site}/v9/assets/gemeinschaft-2016-1920.webp"`),
  "Open Graph image must use the custom domain",
);
const socialImage = new URL(meta.get("og:image"));
const socialImageMetadata = await sharp(
  path.join(dist, socialImage.pathname),
).metadata();
assert.equal(socialImage.origin, site);
assert.equal(socialImageMetadata.width, Number(meta.get("og:image:width")));
assert.equal(socialImageMetadata.height, Number(meta.get("og:image:height")));
assert.equal(meta.get("og:image:type"), `image/${socialImageMetadata.format}`);

const jsonLd = [
  ...home.matchAll(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  ),
].map(([, json]) => JSON.parse(json));
assert.equal(jsonLd.length, 1, "Homepage must provide structured data");
assert.equal(jsonLd[0]["@context"], "https://schema.org");
const graph = jsonLd[0]["@graph"];
assert(Array.isArray(graph));
const organization = graph.find((entry) => entry["@type"] === "Organization");
const website = graph.find((entry) => entry["@type"] === "WebSite");
assert(organization && website, "Organization and WebSite must both exist");
assert.equal(new Set(graph.map((entry) => entry["@id"])).size, graph.length);
assert.equal(organization.name, "Ottenauer Motorradfreunde e. V.");
assert.equal(organization.url, `${site}/`);
assert.equal(organization.location["@type"], "Place");
assert.equal(organization.location.name, "Gaggenau-Ottenau");
assert.deepEqual(organization.sameAs, [
  "https://www.instagram.com/omf19762026/",
]);
assert.equal(
  organization.address,
  undefined,
  "Do not publish an unconfirmed address",
);
const logo = new URL(organization.logo);
assert.equal(logo.origin, site);
const logoMetadata = await sharp(path.join(dist, logo.pathname)).metadata();
assert(logoMetadata.width >= 112 && logoMetadata.height >= 112);
assert.equal(website.url, `${site}/`);
assert.equal(website.name, organization.name);
assert.equal(website.inLanguage, "de-DE");
assert.equal(website.publisher["@id"], organization["@id"]);
const removed = [
  "nachwuchs-presseausschnitt",
  "erste-hilfe-gruppenfoto",
  "veranstaltung.webp",
  "jubilaeum-hero.webp",
];

const htmlPages = new Map();
const localReferences = [];

async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (/\.(html|css|js|xml|txt)$/.test(entry.name)) {
      const body = await readFile(file, "utf8");
      assert(
        !body.includes("emfau88.github.io"),
        `${file} uses the old domain`,
      );
      assert(!body.includes("/motorrad/"), `${file} uses the old base path`);
      for (const name of removed)
        assert(!body.includes(name), `${file} still references ${name}`);
      if (entry.name.endsWith(".html")) {
        htmlPages.set(file, body);
        const route = path
          .relative(dist, file)
          .split(path.sep)
          .join("/")
          .replace(/index\.html$/, "");
        assert(
          body.includes(`<link rel="canonical" href="${site}/${route}"`),
          `Incorrect canonical in ${file}`,
        );
        for (const [, url] of body.matchAll(/(?:src|href)="([^"]+)"/g)) {
          localReferences.push([url, file]);
        }
        for (const [, sourceSet] of body.matchAll(/srcset="([^"]+)"/g)) {
          for (const entry of sourceSet.split(",")) {
            localReferences.push([entry.trim().split(/\s+/)[0], file]);
          }
        }
      } else if (entry.name.endsWith(".css")) {
        for (const [, url] of body.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          localReferences.push([url, file]);
        }
      }
    }
  }
}
await inspect(dist);
assert.deepEqual(
  [...htmlPages.keys()]
    .map((file) => path.relative(dist, file).split(path.sep).join("/"))
    .sort(),
  ["datenschutz/index.html", "impressum/index.html", "index.html"],
  "Only the finished homepage and legal pages may be published",
);

for (const [reference, source] of localReferences) {
  const base = new URL(
    path.relative(dist, source).split(path.sep).join("/"),
    `${site}/`,
  );
  const url = new URL(reference.replaceAll("&amp;", "&"), base);
  if (url.origin !== site) continue;
  let local = path.join(dist, decodeURIComponent(url.pathname));
  if ((await stat(local)).isDirectory()) local = path.join(local, "index.html");
  await access(local);
  if (url.hash && local.endsWith(".html")) {
    assert(
      htmlPages
        .get(local)
        ?.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
      `Missing anchor target for ${reference} in ${source}`,
    );
  }
}

const sitemapIndex = await readFile(
  path.join(dist, "sitemap-index.xml"),
  "utf8",
);
assert(sitemapIndex.includes("<sitemapindex"));
const sitemapFiles = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)];
assert(sitemapFiles.length > 0, "Sitemap index must reference a sitemap");
const sitemapPages = [];
for (const [, reference] of sitemapFiles) {
  const url = new URL(reference);
  assert.equal(url.origin, site);
  const sitemap = await readFile(path.join(dist, url.pathname), "utf8");
  assert(sitemap.includes("<urlset"));
  sitemapPages.push(
    ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, page]) => page),
  );
}
const indexablePages = [...htmlPages.entries()]
  .filter(([, html]) => !/noindex/i.test(metadata(html).get("robots") || ""))
  .map(
    ([file]) =>
      new URL(
        path
          .relative(dist, file)
          .split(path.sep)
          .join("/")
          .replace(/index\.html$/, ""),
        `${site}/`,
      ).href,
  );
assert.deepEqual(sitemapPages.sort(), indexablePages.sort());
assert.deepEqual(sitemapPages, [`${site}/`]);

const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
assert(/^User-agent:\s*\*\s*$/im.test(robots));
assert(/^Allow:\s*\/\s*$/im.test(robots));
assert(
  !/^Disallow:[^\r\n]*\S/im.test(robots),
  "Noindex pages must remain crawlable",
);
assert(robots.includes(`Sitemap: ${site}/sitemap-index.xml`));
for (const route of ["impressum", "datenschutz"]) {
  assert(
    home.includes(`href="/${route}/"`),
    `${route} missing from homepage footer`,
  );
  const html = await readFile(path.join(dist, route, "index.html"), "utf8");
  assert.equal(metadata(html).get("robots"), "noindex");
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
assert.equal(home.includes("Rückblick: 40 Jahre OMF"), !anniversaryExpired);
assert(home.includes("vereinsgeschichte-1280.webp"));
assert.equal(home.includes('data-count="seconds"'), !anniversaryExpired);
assert.equal(home.includes('id="countdown-status"'), !anniversaryExpired);
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
if (!anniversaryExpired) {
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
  assert(home.includes("https://www.openstreetmap.org/export/embed.html?"));
  assert(
    home.includes(
      "https://www.google.com/maps/dir/?api=1&amp;destination=Merkurhalle",
    ),
  );
} else {
  for (const reference of [
    "venue-map-frame",
    "data-map-load",
    "merkurhalle-map-preview.png",
    "Furtwänglerstraße 15",
    "Anfahrt zur Merkurhalle",
    "openstreetmap.org/export/embed.html",
    "google.com/maps/dir/",
    "17.–18. Oktober 2026",
  ]) {
    assert(!body.includes(reference), `Expired event reference: ${reference}`);
  }
}
assert(/class="footer-badge"[\s\S]*?omf-logo-transparent-v2\.png/.test(home));
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
assert.equal(
  [...home.matchAll(/data-photo-caption=/g)].length,
  anniversaryExpired ? 4 : 5,
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
  "Site checks passed: SEO, JSON-LD, sitemap, robots, local links/assets, photos, legal routes, Instagram and opt-in map.",
);
