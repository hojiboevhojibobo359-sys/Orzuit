#!/usr/bin/env node
/**
 * Vercel / CI build:
 * - validates critical files
 * - auto-detects framework and verifies root entrypoint
 * - validates vercel.json for dangerous route overrides
 * - runs unit tests
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
  "api/[...path].js",
  "server/validate.js",
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

function detectFramework(pkg) {
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
  if (deps.next) return "next";
  if (deps.vite) return "vite";
  return "static";
}

function existsAny(paths) {
  return paths.some((p) => fs.existsSync(path.join(root, p)));
}

function validateEntrypoint() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const framework = detectFramework(pkg);

  if (framework === "next") {
    const hasAppRouter = existsAny(["app/page.tsx", "app/page.ts", "app/page.jsx", "app/page.js"]);
    const hasPagesRouter = existsAny([
      "pages/index.tsx",
      "pages/index.ts",
      "pages/index.jsx",
      "pages/index.js"
    ]);
    if (!hasAppRouter && !hasPagesRouter) {
      console.error(
        "[build] Next.js detected but neither app/page.* nor pages/index.* exists."
      );
      process.exit(1);
    }
    console.log("[build] Framework detected: Next.js");
    return;
  }

  if (framework === "vite") {
    if (!fs.existsSync(path.join(root, "index.html"))) {
      console.error("[build] Vite detected but index.html is missing in project root.");
      process.exit(1);
    }
    console.log("[build] Framework detected: Vite");
    return;
  }

  if (!fs.existsSync(path.join(root, "index.html"))) {
    console.error("[build] Static site detected but index.html is missing in project root.");
    process.exit(1);
  }
  console.log("[build] Framework detected: static HTML");
}

/** Validate vercel.json does not override root or all routes dangerously. */
function validateVercelConfig() {
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
  const redirects = Array.isArray(vercel.redirects) ? vercel.redirects : [];
  const routes = Array.isArray(vercel.routes) ? vercel.routes : [];

  const allRules = [...rewrites, ...redirects, ...routes];
  for (const rule of allRules) {
    const source = typeof rule.source === "string" ? rule.source : "";
    const src = source.trim();
    if (src === "/" || src === "/:path*") {
      console.error("[build] Dangerous top-level route override found in vercel.json:", rule);
      process.exit(1);
    }
  }

  for (const rule of rewrites) {
    const source = typeof rule.source === "string" ? rule.source : "";
    const dest = typeof rule.destination === "string" ? rule.destination : "";
    if (!source || !dest) continue;
    const isSafeFallback =
      source === "/(.*)" &&
      (/^\/api\/page(\?|$)/.test(dest) || /^\/api\?path=page(&|$)/.test(dest));
    if (source === "/(.*)" && /^\/api/.test(dest) && !isSafeFallback) {
      console.error("[build] Dangerous catch-all rewrite to /api detected:", rule);
      process.exit(1);
    }
  }

  console.log("[build] vercel.json route safety OK.");
}

validateEntrypoint();
validateVercelConfig();

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

console.log("[build] OK — assets, framework entrypoint, route safety, and tests passed.");
