const { Analytics } = require("./_lib/models");
const { sendJson, readJson, getClientIp } = require("./_lib/http");
const rateLimit = require("./_lib/rateLimit");

function getCountryFromIp(ip) {
  if (!ip || ip === "unknown") return null;
  try {
    const geo = require("geoip-lite").lookup(ip);
    return geo && geo.country ? geo.country : null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (await rateLimit.check(req, res, "analytics")) return;

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON." });
  }

  const MAX_LEN = 2048;
  const pageRaw = typeof body.page === "string" ? body.page.trim() : "";
  const page = (pageRaw || "/").slice(0, MAX_LEN);
  const refRaw = typeof body.referrer === "string" ? body.referrer.trim() : "";
  const referrer = refRaw ? refRaw.slice(0, MAX_LEN) : null;

  const ip = getClientIp(req);
  const country = getCountryFromIp(ip);

  try {
    await Analytics.create({ page, ip, country, referrer });
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    return sendJson(res, 500, { error: "Could not save." });
  }
};
