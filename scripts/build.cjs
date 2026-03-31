#!/usr/bin/env node
/**
 * Vercel / CI build: validates assets, route map vs vercel.json, runs unit tests.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");

const requiredFiles = [
  "vercel.json",
  "package.json",
  "index.html",
  "main.js",
  "styles.css",
  "content.js",
  "api/content.js",
  "api/order.js",
  "api/_lib/validate.js",
  "public/site.webmanifest",
  "public/logo.svg",
  "public/favicon.svg",
  "robots.txt",
  "sitemap.xml"
];

let failed = false;
for (const rel of requiredFiles) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error("[build] Missing required file:", rel);
    failed = true;
  }
}
if (failed) {
  process.exit(1);
}

/** Validate vercel.json rewrites point to existing HTML and cover every public page. */
function validateRoutes() {
  const vercelPath = path.join(root, "vercel.json");
  const raw = fs.readFileSync(vercelPath, "utf8");
  let vercel;
  try {
    vercel = JSON.parse(raw);
  } catch (e) {
    console.error("[build] Invalid JSON in vercel.json:", e.message);
    process.exit(1);
  }

  const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];

  for (const rule of rewrites) {
    const dest = rule.destination;
    if (!dest || typeof dest !== "string") continue;
    const source = typeof rule.source === "string" ? rule.source : "";
    const isApiPassThrough = source === "/api/(.*)" && dest === "/api/$1";
    const isStaticPassThrough = source === "/(.*\\..*)" && dest === "/$1";
    if (!isApiPassThrough && !isStaticPassThrough) {
      if (!dest.endsWith(".html")) {
        console.error("[build] Rewrite destination must be a .html file:", rule);
        process.exit(1);
      }
      const abs = path.join(root, dest.replace(/^\//, ""));
      if (!fs.existsSync(abs)) {
        console.error("[build] Missing rewrite target:", dest);
        process.exit(1);
      }
    }
  }

  const htmlFiles = fs.readdirSync(root).filter((n) => n.endsWith(".html"));
  const rewriteSources = new Set(
    rewrites.map((r) => (typeof r.source === "string" ? r.source.replace(/\/$/, "") : ""))
  );

  for (const file of htmlFiles) {
    const base = file.replace(/\.html$/i, "");
    if (base.toLowerCase() === "index") continue;
    const expectedSource = `/${base}`;
    if (!rewriteSources.has(expectedSource)) {
      console.error(
        "[build] Page",
        file,
        "has no matching vercel.json rewrite with source",
        JSON.stringify(expectedSource)
      );
      process.exit(1);
    }
  }

  console.log("[build] Route map OK:", rewrites.length, "rewrites match", htmlFiles.length, "HTML files.");
}

validateRoutes();

const testsDir = path.join(root, "tests");
if (!fs.existsSync(testsDir)) {
  console.error("[build] Missing tests/ directory.");
  process.exit(1);
}
const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith(".test.cjs"))
  .map((f) => path.join("tests", f));
if (!testFiles.length) {
  console.error("[build] No *.test.cjs files in tests/.");
  process.exit(1);
}
const test = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: root,
  stdio: "inherit"
});

if (test.status !== 0) {
  process.exit(test.status ?? 1);
}

console.log("[build] OK — assets, routes, and tests passed.");
