import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(appRoot, "dist");

function read(relativePath) {
  return readFileSync(join(appRoot, relativePath), "utf8");
}

function pngDimensions(relativePath) {
  const file = readFileSync(join(distRoot, relativePath));
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(file.subarray(0, 8).equals(pngSignature), `${relativePath} is not a PNG`);
  assert.equal(file.toString("ascii", 12, 16), "IHDR", `${relativePath} has no IHDR`);
  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) };
}

const viteConfig = read("vite.config.ts");
assert(
  !/includeAssets\s*:/.test(viteConfig),
  "includeAssets must not duplicate public assets already owned by Workbox globPatterns",
);
assert(
  /includeManifestIcons\s*:\s*false/.test(viteConfig),
  "manifest icons must not be injected separately from Workbox globPatterns",
);

const indexHtml = read("dist/index.html");
const manifestLinks = [
  ...indexHtml.matchAll(/<link\b[^>]*\brel=["']manifest["'][^>]*>/gi),
];
assert.equal(manifestLinks.length, 1, "dist/index.html must link exactly one manifest");
assert(
  /href=["']\/manifest\.webmanifest["']/.test(manifestLinks[0][0]),
  "the authoritative manifest must be /manifest.webmanifest",
);

const manifestPath = join(distRoot, "manifest.webmanifest");
assert(existsSync(manifestPath), "dist/manifest.webmanifest is missing");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert.equal(manifest.id, "/");

for (const size of [192, 512]) {
  const icon = manifest.icons.find(
    (candidate) => candidate.sizes === `${size}x${size}` && candidate.type === "image/png",
  );
  assert(icon, `manifest is missing its ${size}x${size} PNG icon`);
  const relativePath = icon.src.replace(/^\//, "");
  assert(existsSync(join(distRoot, relativePath)), `${icon.src} is missing from dist`);
  assert.deepEqual(pngDimensions(relativePath), { width: size, height: size });
}

const swPath = join(distRoot, "sw.js");
assert(existsSync(swPath), "dist/sw.js is missing");
assert(
  readdirSync(distRoot).some((name) => /^workbox-[\w-]+\.js$/.test(name)),
  "the generated Workbox bundle is missing",
);

const sw = readFileSync(swPath, "utf8");
const precacheUrls = [
  ...sw.matchAll(/\{url:"([^"]+)",revision:(?:null|"[^"]*")\}/g),
].map((match) => match[1]);
assert(precacheUrls.length > 0, "no generated precache entries were found");

const normalizePrecacheUrl = (url) =>
  url.replace(/^\//, "").replace(/\?__WB_REVISION__=[^&]*/g, "");
const normalizedUrls = precacheUrls.map(normalizePrecacheUrl);
assert.equal(
  new Set(normalizedUrls).size,
  normalizedUrls.length,
  "generated precache contains conflicting normalized URLs",
);
assert(
  normalizedUrls.includes("assets/memories/family-tea-garden.jpg"),
  "the local family-memory fallback is missing from the generated precache",
);

const expectedGameAssets = readdirSync(join(appRoot, "public/assets/games"))
  .filter((name) => name.endsWith(".png"))
  .map((name) => `assets/games/${name}`);
for (const asset of expectedGameAssets) {
  assert(normalizedUrls.includes(asset), `${asset} is missing from the generated precache`);
}

console.log(
  `PWA build verified: 1 manifest, ${precacheUrls.length} unique precache entries, ` +
    `${expectedGameAssets.length} game assets, 192px and 512px PNG icons.`,
);
