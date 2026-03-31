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
