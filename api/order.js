const { getTelegramSettings, saveOrder } = require("./_lib/db");
const { sendJson, readJson } = require("./_lib/http");

async function getTelegramCredentials() {
  const chatId = process.env.TELEGRAM_CHAT_ID || null;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || null;
  if (chatId && botToken) return { chatId, botToken };
  const settings = await getTelegramSettings();
  return { chatId: settings.chatId, botToken: settings.botToken };
}

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOrderMessage(body) {
  const name = escapeHtml(String(body.name || "").trim());
  const email = escapeHtml(String(body.email || "").trim());
  const phone = escapeHtml(String(body.phone || "").trim());
  const service = escapeHtml(String(body.service || "").trim());
  const message = escapeHtml(String(body.message || "").trim());
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

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "Ungültige Daten." });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  if (!message && !name && !email) {
    return sendJson(res, 400, { error: "Bitte Name, E-Mail oder Nachricht angeben." });
  }

  try {
    await saveOrder(body);
  } catch (err) {
    return sendJson(res, 500, { error: "Bestellung konnte nicht gespeichert werden." });
  }

  const { chatId, botToken } = await getTelegramCredentials();
  if (chatId && botToken) {
    const text = buildOrderMessage(body);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        // Order already saved; log but don't fail
      }
    } catch {
      // Order already saved
    }
  }

  return sendJson(res, 200, { ok: true });
};
