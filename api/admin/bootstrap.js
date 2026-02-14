const bcrypt = require("bcryptjs");
const { getPrimaryAdmin, updateAdminCredentials } = require("../_lib/db");
const { sendJson, readJson } = require("../_lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "";
  if (!bootstrapSecret) {
    return sendJson(res, 403, { error: "Bootstrap is disabled." });
  }

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON payload." });
  }

  const secret = String(body.secret || "");
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (secret !== bootstrapSecret) {
    return sendJson(res, 401, { error: "Invalid secret." });
  }
  if (!username || password.length < 6) {
    return sendJson(res, 400, { error: "Username is required and password must be at least 6 characters." });
  }

  const admin = await getPrimaryAdmin();
  if (!admin) {
    return sendJson(res, 500, { error: "Admin record not found." });
  }

  const hash = await bcrypt.hash(password, 12);
  const updated = await updateAdminCredentials(admin.id, username, hash);
  return sendJson(res, 200, { success: true, user: updated });
};

