const { getOrders, getAdminById } = require("../_lib/db");
const { verifyAdminToken } = require("../_lib/auth");
const { sendJson } = require("../_lib/http");

module.exports = async function handler(req, res) {
  const payload = verifyAdminToken(req);
  if (!payload) {
    return sendJson(res, 401, { error: "Unauthorized." });
  }

  const admin = await getAdminById(payload.sub);
  if (!admin) {
    return sendJson(res, 401, { error: "Unauthorized." });
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const orders = await getOrders();
    return sendJson(res, 200, { orders });
  } catch (error) {
    return sendJson(res, 500, { error: "Failed to load orders." });
  }
};
