/**
 * Rate limiting for API. Uses DB for state (serverless-safe).
 * Scope = e.g. 'login' | 'order'. Returns response to send or null if allowed.
 */

const { initDatabase, query } = require("./db");
const { getClientIp } = require("./http");
const { sendJson } = require("./http");
const logger = require("./logger");

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const LIMITS = {
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  order: { max: 20, windowMs: 60 * 1000 },
  content: { max: 60, windowMs: 60 * 1000 },
  analytics: { max: 120, windowMs: 60 * 1000 },
  default: { max: 100, windowMs: DEFAULT_WINDOW_MS }
};

function getKey(req, scope) {
  const ip = getClientIp(req);
  return `rl:${scope}:${ip}`;
}

/**
 * Check rate limit and increment. If over limit, sends 429 and returns true (caller should return).
 * @param {object} req - request
 * @param {object} res - response
 * @param {string} scope - 'login' | 'order' | 'content' | 'default'
 * @returns {Promise<boolean>} - true if 429 was sent (abort handler), false if allowed
 */
async function check(req, res, scope) {
  const config = LIMITS[scope] || LIMITS.default;
  const key = getKey(req, scope);
  await initDatabase();

  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMs);

  const row = await query("SELECT count, reset_at FROM rate_limits WHERE key = $1", [key]);
  const existing = row.rows[0];

  if (!existing) {
    await query("INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, $2)", [key, resetAt]);
    return false;
  }

  const dbReset = new Date(existing.reset_at);
  if (now > dbReset) {
    await query("UPDATE rate_limits SET count = 1, reset_at = $2 WHERE key = $1", [key, resetAt]);
    return false;
  }

  const newCount = (existing.count || 0) + 1;
  await query("UPDATE rate_limits SET count = $2 WHERE key = $1", [key, newCount]);

  if (newCount > config.max) {
    logger.warn("Rate limit exceeded", { scope, key: key.replace(/^rl:[^:]+:/, ""), count: newCount });
    sendJson(res, 429, {
      error: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((dbReset - now) / 1000)
    });
    return true;
  }
  return false;
}

module.exports = { check };
