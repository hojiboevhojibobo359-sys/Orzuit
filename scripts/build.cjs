#!/usr/bin/env node
/**
 * Vercel / CI build: validates required assets and runs unit tests.
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
  "public/favicon.svg"
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

console.log("[build] OK — assets present, tests passed.");

// Generate static output so Vercel always serves the correct HTML routes,
// regardless of "Root Directory" configuration in the dashboard.
//
// Vercel "Static Output API" convention:
//   .vercel/output/static/<path>/index.html  => served at /<path>
//   .vercel/output/static/index.html          => served at /
const staticOutDir = path.join(root, ".vercel", "output", "static");
const staticRootPath = path.join(root, ".vercel", "output");

fs.rmSync(staticRootPath, { recursive: true, force: true });
fs.mkdirSync(staticOutDir, { recursive: true });

function copyFile(relFrom, relTo) {
  const absFrom = path.join(root, relFrom);
  const absTo = path.join(staticOutDir, relTo);
  fs.mkdirSync(path.dirname(absTo), { recursive: true });
  fs.copyFileSync(absFrom, absTo);
}

// Copy JS/CSS assets used by HTML pages.
const assetFiles = ["styles.css", "admin.css", "main.js", "content.js", "analytics.js"];
for (const f of assetFiles) {
  const abs = path.join(root, f);
  if (fs.existsSync(abs)) {
    copyFile(f, f);
  }
}

// Copy public assets (icons, webmanifest, etc.)
const publicDir = path.join(root, "public");
if (fs.existsSync(publicDir)) {
  for (const entry of fs.readdirSync(publicDir)) {
    const abs = path.join(publicDir, entry);
    const stat = fs.statSync(abs);
    if (!stat.isFile()) continue;
    copyFile(path.join("public", entry), entry);
  }
}

// Copy all root HTML files.
const rootEntries = fs.readdirSync(root);
const htmlFiles = rootEntries.filter((n) => n.endsWith(".html"));
if (!htmlFiles.length) {
  console.error("[build] No root *.html files found for static output.");
  process.exit(1);
}

for (const file of htmlFiles) {
  const base = file.replace(/\.html$/i, "");
  const destRel =
    base.toLowerCase() === "index" ? "index.html" : path.join(base, "index.html");
  copyFile(file, destRel);
}

console.log("[build] Static output generated:", staticOutDir);
