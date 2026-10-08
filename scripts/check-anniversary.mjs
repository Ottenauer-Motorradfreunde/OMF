import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import {
  anniversaryEndsAt,
  anniversaryHistory,
  isAnniversaryOver,
} from "../src/config/anniversary.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const deadline = Date.parse(anniversaryEndsAt);
const before = "2026-10-18T23:59:59.999+02:00";
const after = "2026-10-19T00:00:00+02:00";
assert.equal(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "short",
    timeStyle: "medium",
    hourCycle: "h23",
  }).format(new Date(deadline)),
  "19/10/2026, 00:00:00",
);
assert.equal(deadline, Date.parse("2026-10-18T22:00:00Z"));
assert.equal(isAnniversaryOver(before), false);
for (const date of [
  after,
  "2026-10-25T00:00:00+02:00",
  "2027-01-01T00:00:00+01:00",
  "2030-10-18T23:59:59+02:00",
]) {
  assert.equal(isAnniversaryOver(date), true);
}
assert.throws(() => isAnniversaryOver("invalid"));

// Run the actual inline fallback with a controlled clock and DOM lifecycle.
const client = await readFile(
  path.join(root, "src/scripts/anniversary.js"),
  "utf8",
);
function browser(now, { loading = false, builtExpired = false } = {}) {
  let clock = now;
  const listeners = new Map();
  const timers = new Map();
  let nextTimer = 0;
  const classes = new Set();
  const element = (text, href) => ({
    textContent: text,
    attributes: new Map([
      ["href", href],
      ["data-anniversary-pending", ""],
    ]),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
  });
  const button = element(
    builtExpired ? "Unsere Geschichte" : "50 Jahre OMF",
    builtExpired ? "#geschichte" : "#jubilaeum",
  );
  const history = element(
    builtExpired
      ? anniversaryHistory
      : "Das Jubiläum wird im Oktober in der Merkurhalle Ottenau gefeiert.",
  );
  const eventNodes = builtExpired
    ? []
    : Array.from({ length: 4 }, () => ({
        removed: false,
        remove() {
          this.removed = true;
        },
      }));
  const document = {
    readyState: loading ? "loading" : "complete",
    documentElement: {
      dataset: {
        anniversaryEndsAt,
        anniversaryHistoryText: anniversaryHistory,
        anniversaryExpired: String(builtExpired),
      },
      classList: { add: (name) => classes.add(name) },
    },
    querySelectorAll: (selector) => {
      assert.equal(selector, "[data-anniversary-event]");
      return eventNodes.filter((node) => !node.removed);
    },
    querySelector: (selector) => {
      assert(
        ["[data-anniversary-cta]", "[data-anniversary-history]"].includes(
          selector,
        ),
      );
      return selector === "[data-anniversary-cta]" ? button : history;
    },
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  vm.runInNewContext(client, {
    document,
    window: {
      addEventListener: (name, callback) => listeners.set(name, callback),
    },
    Date: { parse: Date.parse, now: () => clock },
    setTimeout: (callback, delay) => {
      assert(delay > 0 && delay <= 2147483647);
      timers.set(++nextTimer, { callback, delay });
      return nextTimer;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  return {
    button,
    history,
    eventNodes,
    classes,
    timers,
    clock: (value) => {
      clock = value;
    },
    fire: (name) => {
      if (name === "DOMContentLoaded") document.readyState = "complete";
      listeners.get(name)();
    },
    tick: () => [...timers.values()][0].callback(),
    expired: () => {
      assert(classes.has("anniversary-expired"));
      assert(eventNodes.every((node) => node.removed));
      assert.equal(button.textContent, "Unsere Geschichte");
      assert.equal(button.attributes.get("href"), "#geschichte");
      assert.equal(history.textContent, anniversaryHistory);
      assert(!button.attributes.has("data-anniversary-pending"));
      assert(!history.attributes.has("data-anniversary-pending"));
      assert.equal(timers.size, 0);
    },
  };
}

const openPage = browser(deadline - 1);
assert(!openPage.classes.has("anniversary-expired"));
assert(openPage.eventNodes.every((node) => !node.removed));
assert.equal(openPage.button.textContent, "50 Jahre OMF");
assert.equal(
  openPage.history.textContent,
  "Das Jubiläum wird im Oktober in der Merkurhalle Ottenau gefeiert.",
);
assert.equal([...openPage.timers.values()][0].delay, 1);
openPage.clock(deadline);
openPage.tick();
openPage.expired();
openPage.clock(deadline - 86400000);
openPage.fire("pageshow");
openPage.expired(); // Clock rollback cannot restore removed content.

const stalePage = browser(deadline, { loading: true });
assert(
  stalePage.classes.has("anniversary-expired"),
  "Hide stale hints before the first paint",
);
assert(stalePage.eventNodes.every((node) => !node.removed));
stalePage.fire("DOMContentLoaded");
stalePage.expired();
for (const event of ["visibilitychange", "pageshow"]) {
  const sleepingPage = browser(deadline - 86400000);
  sleepingPage.clock(deadline + 86400000);
  sleepingPage.fire(event);
  sleepingPage.expired();
}
const longWait = browser(Date.parse("2026-01-01T00:00:00Z"));
assert.equal([...longWait.timers.values()][0].delay, 2147483647);
browser(deadline - 86400000, { builtExpired: true }).expired();

// Build both boundary states, then run every existing site check on each output.
for (const [name, date] of [
  ["before", before],
  ["after", after],
]) {
  const output = path.join(root, "tmp/anniversary-tests", name);
  await mkdir(output, { recursive: true });
  const options = {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, OMF_BUILD_TIME: date },
  };
  execFileSync(
    process.execPath,
    [
      path.join(root, "node_modules/astro/bin/astro.mjs"),
      "build",
      "--outDir",
      output,
    ],
    options,
  );
  execFileSync(
    process.execPath,
    [path.join(root, "scripts/check-site.mjs"), output],
    options,
  );
}
console.log(
  "Anniversary checks passed: Berlin midnight, permanent expiry, stale pages, open/suspended tabs and both static builds.",
);
