const { Analytics, Admin } = require("../_lib/models");
const { verifyAdminToken } = require("../_lib/auth");
const { sendJson } = require("../_lib/http");
const logger = require("../_lib/logger");

module.exports = async function handler(req, res) {
  const payload = verifyAdminToken(req);
  if (!payload) {
    return sendJson(res, 401, { error: "Unauthorized." });
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin) {
    return sendJson(res, 401, { error: "Unauthorized." });
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const url = new URL(req.url || "", "http://localhost");
  const from = url.searchParams.get("from") || null;
  const to = url.searchParams.get("to") || null;
  const pageFilter = url.searchParams.get("page") || null;
  const groupBy = url.searchParams.get("groupBy") === "week" ? "week" : "day";

  try {
    const [total, pageViews, byCountry, byTime] = await Promise.all([
      Analytics.getTotalVisits(from, to, pageFilter),
      Analytics.getPageViews(from, to),
      Analytics.getByCountry(from, to, pageFilter),
      Analytics.getByTime(from, to, pageFilter, groupBy)
    ]);

    return sendJson(res, 200, {
      total,
      pageViews,
      byCountry,
      byTime
    });
  } catch (error) {
    logger.error("Analytics fetch failed", { message: error.message });
    return sendJson(res, 500, { error: "Failed to load analytics." });
  }
};
