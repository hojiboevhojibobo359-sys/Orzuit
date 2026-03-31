const { Order, TelegramSettings } = require("./_lib/models");
const { sendJson, readJson, getClientIp } = require("./_lib/http");
const { validateOrder } = require("./_lib/validate");
const rateLimit = require("./_lib/rateLimit");
const logger = require("./_lib/logger");

async function getTelegramCredentials() {
  const chatId = process.env.TELEGRAM_CHAT_ID || null;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || null;
  if (chatId && botToken) return { chatId, botToken };
  const settings = await TelegramSettings.get();
  return { chatId: settings.chatId, botToken: settings.botToken };
}

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOrderMessage(data) {
  const name = escapeHtml(String(data.name || "").trim());
  const email = escapeHtml(String(data.email || "").trim());
  const phone = escapeHtml(String(data.phone || "").trim());
  const service = escapeHtml(String(data.service || "").trim());
  const message = escapeHtml(String(data.message || "").trim());
  const lines = ["🆕 <b>Neue Anfrage / Bestellung</b>", ""];
  if (service) lines.push("<b>Leistung:</b> " + service);
  if (name) lines.push("<b>Name:</b> " + name);
  if (email) lines.push("<b>E-Mail:</b> " + email);
  if (phone) lines.push("<b>Telefon:</b> " + phone);
  if (message) lines.push("", "<b>Nachricht:</b>", message);
  return lines.join("\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (await rateLimit.check(req, res, "order")) return;

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    logger.warn("Order invalid JSON", { ip: getClientIp(req) });
    return sendJson(res, 400, { error: "Ungültige Daten." });
  }

  const validation = validateOrder(body);
  if (!validation.valid) {
    return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
  }

  const data = validation.data;

  let createdOrderId = null;
  try {
    const order = await Order.create(data);
    createdOrderId = order.id;
    logger.info("Order created", { orderId: order.id, ip: getClientIp(req) });
  } catch (err) {
    logger.error("Order save failed", { message: err.message, ip: getClientIp(req) });
    return sendJson(res, 500, { error: "Bestellung konnte nicht gespeichert werden." });
  }

  const { chatId, botToken } = await getTelegramCredentials();
  if (chatId && botToken) {
    const text = buildOrderMessage(data);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
      });
      const respData = await response.json().catch(() => ({}));
      if (!response.ok || !respData.ok) {
        logger.warn("Telegram send failed", { orderId: createdOrderId });
      }
    } catch (e) {
      logger.warn("Telegram request error", { message: e.message });
    }
  }

  return sendJson(res, 200, { ok: true });
};
