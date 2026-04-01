const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const geoip = require("geoip-lite");
const {
  validateLogin,
  validateOrder,
  validateContent,
  validateCredentials,
  validateTelegram,
  validateBootstrap
} = require("../server/validate");

const DEFAULT_CONTENT = {
  siteName: "OrzuIT",
  siteLogo: "/logo.svg",
  home: {
    title: "Webentwicklung für KMU: performante Websites & skalierbare Web-Apps",
    subtitle: "Websites und digitale Produkte mit klarem Fokus auf Performance, UX und planbare Release-Zyklen",
    intro:
      "Als Webentwicklungspartner für KMU liefern wir messbare Ergebnisse: schnelle Ladezeiten, suchmaschinenfreundliche Struktur und Beratung von der Konzeption bis zum Go-live.",
    ctaText: "Leistungen & Ablauf ansehen",
    ctaLink: "/services"
  },
  services: [],
  about: { text: "", mission: "" },
  contacts: { email: "", phone: "", address: "", telegram: "", workingHours: "" },
  projectCategories: [],
  projects: []
};

let pool;
let initPromise;

function db() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function query(text, params) {
  return db().query(text, params);
}

async function initDb() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS telegram_settings (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        chat_id TEXT,
        bot_token TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        service TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        page TEXT NOT NULL,
        ip TEXT,
        country TEXT,
        referrer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await query("CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);");
    await query("CREATE INDEX IF NOT EXISTS idx_analytics_page ON analytics(page);");

    const adminCount = await query("SELECT COUNT(*)::int AS count FROM admins");
    if (adminCount.rows[0].count === 0) {
      const username = process.env.ADMIN_LOGIN || "admin";
      const password = process.env.ADMIN_PASSWORD || "tdigital2026";
      const passwordHash = await bcrypt.hash(password, 12);
      await query("INSERT INTO admins (username, password_hash) VALUES ($1, $2)", [username, passwordHash]);
    }
    const contentRow = await query("SELECT id FROM site_content WHERE id = 1");
    if (!contentRow.rows.length) {
      await query("INSERT INTO site_content (id, data) VALUES (1, $1::jsonb)", [JSON.stringify(DEFAULT_CONTENT)]);
    }
    const tgRow = await query("SELECT id FROM telegram_settings WHERE id = 1");
    if (!tgRow.rows.length) {
      await query("INSERT INTO telegram_settings (id, chat_id, bot_token) VALUES (1, NULL, NULL)");
    }
  })();
  return initPromise;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function getClientIp(req) {
  const forwarded = req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"]);
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "unknown";
}

function jwtSecret() {
  return process.env.JWT_SECRET || "change-this-jwt-secret-in-production";
}

function createAdminToken(admin) {
  return jwt.sign({ sub: admin.id, username: admin.username }, jwtSecret(), { expiresIn: "12h" });
}

function verifyAdminToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), jwtSecret());
  } catch {
    return null;
  }
}

async function requireAdmin(req, res) {
  const payload = verifyAdminToken(req);
  if (!payload) {
    sendJson(res, 401, { error: "Unauthorized." });
    return null;
  }
  const result = await query("SELECT * FROM admins WHERE id = $1 LIMIT 1", [payload.sub]);
  if (!result.rows[0]) {
    sendJson(res, 401, { error: "Unauthorized." });
    return null;
  }
  return result.rows[0];
}

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function routeFromReq(req) {
  const p = req.query.path;
  if (Array.isArray(p)) return p.join("/");
  if (typeof p === "string") return p.replace(/^\/+/, "");
  return "";
}

async function handle(req, res) {
  await initDb();
  const route = routeFromReq(req);

  if (route === "content" && req.method === "GET") {
    const r = await query("SELECT data FROM site_content WHERE id = 1");
    res.setHeader("Cache-Control", "public, max-age=60");
    return sendJson(res, 200, { content: r.rows[0] ? r.rows[0].data : DEFAULT_CONTENT });
  }

  if (route === "analytics" && req.method === "POST") {
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON." });
    }
    const pageRaw = typeof body.page === "string" ? body.page.trim() : "";
    const page = (pageRaw || "/").slice(0, 2048);
    const refRaw = typeof body.referrer === "string" ? body.referrer.trim() : "";
    const referrer = refRaw ? refRaw.slice(0, 2048) : null;
    const ip = getClientIp(req);
    const geo = ip && ip !== "unknown" ? geoip.lookup(ip) : null;
    const country = geo && geo.country ? geo.country : null;
    await query("INSERT INTO analytics (page, ip, country, referrer) VALUES ($1,$2,$3,$4)", [page, ip, country, referrer]);
    return sendJson(res, 200, { ok: true });
  }

  if (route === "order" && req.method === "POST") {
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Ungültige Daten." });
    }
    const validation = validateOrder(body);
    if (!validation.valid) return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
    const data = validation.data;
    const orderResult = await query(
      "INSERT INTO orders (name,email,phone,service,message) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [data.name, data.email, data.phone, data.service, data.message]
    );
    const orderId = orderResult.rows[0] && orderResult.rows[0].id;

    const envChatId = process.env.TELEGRAM_CHAT_ID || null;
    const envToken = process.env.TELEGRAM_BOT_TOKEN || null;
    const settings = await query("SELECT chat_id, bot_token FROM telegram_settings WHERE id = 1");
    const dbChatId = settings.rows[0] ? settings.rows[0].chat_id : null;
    const dbToken = settings.rows[0] ? settings.rows[0].bot_token : null;
    const chatId = envChatId || dbChatId;
    const botToken = envToken || dbToken;

    if (chatId && botToken) {
      const lines = ["🆕 <b>Neue Anfrage / Bestellung</b>", ""];
      if (data.service) lines.push("<b>Leistung:</b> " + escapeHtml(String(data.service)));
      if (data.name) lines.push("<b>Name:</b> " + escapeHtml(String(data.name)));
      if (data.email) lines.push("<b>E-Mail:</b> " + escapeHtml(String(data.email)));
      if (data.phone) lines.push("<b>Telefon:</b> " + escapeHtml(String(data.phone)));
      if (data.message) lines.push("", "<b>Nachricht:</b>", escapeHtml(String(data.message)));
      const text = lines.join("\n");
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
        });
      } catch {
        // Do not fail order due to telegram delivery.
      }
    }
    return sendJson(res, 200, { ok: true, orderId });
  }

  if (route === "auth/login" && req.method === "POST") {
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON payload." });
    }
    const validation = validateLogin(body);
    if (!validation.valid) return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
    const { username, password } = validation.data;
    const r = await query("SELECT * FROM admins WHERE username = $1 LIMIT 1", [username]);
    const admin = r.rows[0];
    if (!admin) return sendJson(res, 401, { error: "Invalid credentials." });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return sendJson(res, 401, { error: "Invalid credentials." });
    const token = createAdminToken(admin);
    return sendJson(res, 200, { token, user: { id: admin.id, username: admin.username } });
  }

  if (route === "auth/me" && req.method === "GET") {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    return sendJson(res, 200, { user: { id: admin.id, username: admin.username } });
  }

  if (route === "admin/content") {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (req.method === "GET") {
      const c = await query("SELECT data FROM site_content WHERE id = 1");
      return sendJson(res, 200, { content: c.rows[0] ? c.rows[0].data : DEFAULT_CONTENT });
    }
    if (req.method === "PUT") {
      let body = {};
      try {
        body = await readJson(req);
      } catch {
        return sendJson(res, 400, { error: "Invalid JSON payload." });
      }
      const validation = validateContent(body);
      if (!validation.valid) return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
      const saved = await query(
        "UPDATE site_content SET data = $1::jsonb, updated_at = NOW() WHERE id = 1 RETURNING data, updated_at",
        [JSON.stringify(validation.data)]
      );
      return sendJson(res, 200, { content: saved.rows[0].data, updatedAt: saved.rows[0].updated_at });
    }
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (route === "admin/orders" && req.method === "GET") {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const orders = await query(
      "SELECT id,name,email,phone,service,message,created_at FROM orders ORDER BY created_at DESC"
    );
    return sendJson(res, 200, { orders: orders.rows });
  }

  if (route === "admin/analytics" && req.method === "GET") {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const from = typeof req.query.from === "string" ? req.query.from : "";
    const to = typeof req.query.to === "string" ? req.query.to : "";
    const page = typeof req.query.page === "string" ? req.query.page : "";
    const groupBy = req.query.groupBy === "week" ? "week" : "day";
    const conditions = [];
    const params = [];
    let i = 1;
    if (from) {
      conditions.push(`created_at >= $${i++}`);
      params.push(from);
    }
    if (to) {
      conditions.push(`created_at < $${i++}::date + interval '1 day'`);
      params.push(to);
    }
    if (page) {
      conditions.push(`page = $${i++}`);
      params.push(page);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const total = await query(`SELECT COUNT(*)::int AS total FROM analytics ${where}`, params);
    const pageViews = await query(
      `SELECT page, COUNT(*)::int AS views FROM analytics ${where} GROUP BY page ORDER BY views DESC`,
      params
    );
    const byCountry = await query(
      `SELECT COALESCE(country, '(unbekannt)') AS country, COUNT(*)::int AS views
       FROM analytics ${where} GROUP BY country ORDER BY views DESC LIMIT 15`,
      params
    );
    const dateExpr = groupBy === "week" ? "date_trunc('week', created_at)::date" : "created_at::date";
    const byTime = await query(
      `SELECT ${dateExpr} AS date, COUNT(*)::int AS views
       FROM analytics ${where} GROUP BY 1 ORDER BY 1 ASC LIMIT 90`,
      params
    );
    return sendJson(res, 200, {
      total: total.rows[0].total,
      pageViews: pageViews.rows,
      byCountry: byCountry.rows,
      byTime: byTime.rows
    });
  }

  if (route === "admin/telegram") {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method === "GET") {
      const settings = await query("SELECT chat_id, bot_token FROM telegram_settings WHERE id = 1");
      const row = settings.rows[0] || { chat_id: null, bot_token: null };
      const envChatId = process.env.TELEGRAM_CHAT_ID || null;
      const envToken = process.env.TELEGRAM_BOT_TOKEN || null;
      const chatId = envChatId || row.chat_id || null;
      const botToken = envToken || row.bot_token || null;
      return sendJson(res, 200, {
        chatId,
        botTokenMasked: botToken ? `${String(botToken).slice(0, 8)}***` : "",
        configured: Boolean(chatId && botToken),
        chatIdFromEnv: Boolean(envChatId),
        botTokenFromEnv: Boolean(envToken)
      });
    }

    if (req.method === "PUT") {
      let body = {};
      try {
        body = await readJson(req);
      } catch {
        return sendJson(res, 400, { error: "Invalid JSON payload." });
      }
      const validation = validateTelegram(body);
      if (!validation.valid) return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
      if (process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_BOT_TOKEN) {
        return sendJson(res, 200, { configured: true, botTokenMasked: "" });
      }
      const { chatId, botToken } = validation.data;
      await query(
        "UPDATE telegram_settings SET chat_id = $1, bot_token = $2, updated_at = NOW() WHERE id = 1",
        [chatId || null, botToken || null]
      );
      return sendJson(res, 200, { configured: Boolean(chatId && botToken), botTokenMasked: botToken ? `${botToken.slice(0, 8)}***` : "" });
    }
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (route === "admin/credentials" && req.method === "PUT") {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON payload." });
    }
    const validation = validateCredentials(body);
    if (!validation.valid) return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
    const { currentPassword, newUsername, newPassword } = validation.data;
    const ok = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!ok) return sendJson(res, 401, { error: "Current password is incorrect." });
    const exists = await query("SELECT id FROM admins WHERE username = $1 AND id <> $2 LIMIT 1", [newUsername, admin.id]);
    if (exists.rows.length) return sendJson(res, 409, { error: "Username already exists." });
    const nextHash = await bcrypt.hash(newPassword, 12);
    await query("UPDATE admins SET username = $2, password_hash = $3, updated_at = NOW() WHERE id = $1", [admin.id, newUsername, nextHash]);
    return sendJson(res, 200, { ok: true });
  }

  if (route === "admin/bootstrap" && req.method === "POST") {
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON payload." });
    }
    const validation = validateBootstrap(body);
    if (!validation.valid) return sendJson(res, 400, { error: "Validation failed.", details: validation.errors });
    const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "";
    if (!expectedSecret || validation.data.secret !== expectedSecret) {
      return sendJson(res, 401, { error: "Invalid bootstrap secret." });
    }
    const admin = await query("SELECT * FROM admins ORDER BY id ASC LIMIT 1");
    if (!admin.rows[0]) return sendJson(res, 500, { error: "No admin found." });
    const nextHash = await bcrypt.hash(validation.data.password, 12);
    await query(
      "UPDATE admins SET username = $2, password_hash = $3, updated_at = NOW() WHERE id = $1",
      [admin.rows[0].id, validation.data.username, nextHash]
    );
    return sendJson(res, 200, { ok: true });
  }

  if (route === "telegram/send" && req.method === "POST") {
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON payload." });
    }
    const message = String(body.message || "").trim();
    if (!message) return sendJson(res, 400, { error: "Message is required." });
    const envChatId = process.env.TELEGRAM_CHAT_ID || null;
    const envToken = process.env.TELEGRAM_BOT_TOKEN || null;
    const settings = await query("SELECT chat_id, bot_token FROM telegram_settings WHERE id = 1");
    const chatId = envChatId || (settings.rows[0] ? settings.rows[0].chat_id : null);
    const botToken = envToken || (settings.rows[0] ? settings.rows[0].bot_token : null);
    if (!chatId || !botToken) return sendJson(res, 400, { error: "Telegram is not configured." });
    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) return sendJson(res, 502, { error: "Telegram send failed." });
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 502, { error: "Telegram request error." });
    }
  }

  return sendJson(res, 404, { error: "Not found." });
}

module.exports = async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (e) {
    return sendJson(res, 500, { error: "Internal server error.", message: e.message });
  }
};
