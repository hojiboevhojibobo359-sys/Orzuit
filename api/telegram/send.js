const { getTelegramSettings } = require("../_lib/db");
const { sendJson, readJson } = require("../_lib/http");

async function getTelegramCredentials() {
  const chatId = process.env.TELEGRAM_CHAT_ID || null;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || null;
  if (chatId && botToken) return { chatId, botToken };
  const settings = await getTelegramSettings();
  return { chatId: settings.chatId, botToken: settings.botToken };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON payload." });
  }

  const text = typeof body.message === "string" ? body.message.trim() : (typeof body.text === "string" ? body.text.trim() : "");
  if (!text) {
    return sendJson(res, 400, { error: "Missing message or text." });
  }

  const { chatId, botToken } = await getTelegramCredentials();
  if (!chatId || !botToken) {
    return sendJson(res, 503, { error: "Telegram is not configured. Set Chat ID and Bot Token in Admin." });
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      return sendJson(res, 502, {
        error: data.description || "Telegram API error.",
        ok: false
      });
    }
    return sendJson(res, 200, { ok: true, messageId: data.result && data.result.message_id });
  } catch (error) {
    return sendJson(res, 502, { error: "Failed to send message to Telegram." });
  }
};
