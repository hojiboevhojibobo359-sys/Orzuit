/**
 * Generates PNG favicons from public/favicon.svg and public/logo.svg (optional sharp).
 * Run: npm run icons  (requires devDependency sharp)
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const faviconSvg = path.join(publicDir, "favicon.svg");
const logoSvg = path.join(publicDir, "logo.svg");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.warn("[icons] sharp not installed — skip PNG generation (SVG icons still work).");
    process.exit(0);
  }

  if (!fs.existsSync(faviconSvg)) {
    console.error("[icons] Missing public/favicon.svg");
    process.exit(1);
  }

  const svg = fs.readFileSync(faviconSvg);
  const logoBuf = fs.existsSync(logoSvg) ? fs.readFileSync(logoSvg) : svg;

  const sizes = [
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["favicon-48x48.png", 48],
    ["favicon.png", 64],
    ["apple-touch-icon.png", 180],
    ["android-chrome-192x192.png", 192],
    ["android-chrome-512x512.png", 512]
  ];

  for (const [name, size] of sizes) {
    const buf =
      name === "apple-touch-icon.png" || name.startsWith("android-")
        ? await sharp(logoBuf).resize(size, size).png({ compressionLevel: 9, effort: 10 }).toBuffer()
        : await sharp(svg).resize(size, size).png({ compressionLevel: 9, effort: 10 }).toBuffer();
    fs.writeFileSync(path.join(publicDir, name), buf);
    console.log("[icons] wrote", name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
