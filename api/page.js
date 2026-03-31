const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

const pageMap = {
  "": "index.html",
  "/": "index.html",
  "/about": "about.html",
  "/services": "services.html",
  "/service": "service.html",
  "/projects": "projects.html",
  "/project": "project.html",
  "/contacts": "contacts.html",
  "/founder": "founder.html",
  "/admin": "admin.html",
  "/admin-login": "admin-login.html",
  "/admin-home": "admin-home.html",
  "/admin-services": "admin-services.html",
  "/admin-about": "admin-about.html",
  "/admin-projects": "admin-projects.html",
  "/admin-contacts": "admin-contacts.html",
  "/admin-orders": "admin-orders.html",
  "/admin-analytics": "admin-analytics.html",
  "/admin-telegram": "admin-telegram.html"
};

function safeResolve(base, rel) {
  const abs = path.resolve(base, rel);
  return abs.startsWith(path.resolve(base)) ? abs : null;
}

function serveFile(res, absFile) {
  const ext = path.extname(absFile).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const file = fs.readFileSync(absFile);
  res.setHeader("Content-Type", contentType);
  if (ext === ".html") {
    res.setHeader("Cache-Control", "public, s-maxage=300");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=3600");
  }
  res.status(200).send(file);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const root = process.cwd();
  const queryPath = typeof req.query.path === "string" ? req.query.path : "/";
  const rawPath = decodeURIComponent(queryPath).split("?")[0].split("#")[0];
  const normalized = (rawPath || "/").replace(/\/+$/, "") || "/";

  // Exact page mapping for clean URLs.
  const htmlFile = pageMap[normalized];
  if (htmlFile) {
    const abs = safeResolve(root, htmlFile);
    if (abs && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      return serveFile(res, abs);
    }
  }

  // Static file pass-through from root.
  if (/\.[a-z0-9]+$/i.test(normalized)) {
    const rel = normalized.replace(/^\//, "");
    const absRoot = safeResolve(root, rel);
    if (absRoot && fs.existsSync(absRoot) && fs.statSync(absRoot).isFile()) {
      return serveFile(res, absRoot);
    }

    // Static files inside /public are exposed at site root.
    const absPublic = safeResolve(path.join(root, "public"), rel);
    if (absPublic && fs.existsSync(absPublic) && fs.statSync(absPublic).isFile()) {
      return serveFile(res, absPublic);
    }
  }

  // Unknown route fallback: show home page instead of Vercel 404.
  const fallback = safeResolve(root, "index.html");
  if (fallback && fs.existsSync(fallback)) {
    return serveFile(res, fallback);
  }

  return res.status(404).send("Not found");
};
