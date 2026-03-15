const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { defaultContent } = require("./defaultContent");

let pool;
let initPromise;

function getPool() {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
  });
  return pool;
}

async function query(text, params) {
  const db = getPool();
  return db.query(text, params);
}

async function initDatabase() {
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

    const adminCount = await query("SELECT COUNT(*)::int AS count FROM admins;");
    if (adminCount.rows[0].count === 0) {
      const username = process.env.ADMIN_LOGIN || "admin";
      const password = process.env.ADMIN_PASSWORD || "tdigital2026";
      const passwordHash = await bcrypt.hash(password, 12);
      await query("INSERT INTO admins (username, password_hash) VALUES ($1, $2);", [username, passwordHash]);
    }

    const contentRow = await query("SELECT id FROM site_content WHERE id = 1;");
    if (!contentRow.rows.length) {
      await query("INSERT INTO site_content (id, data) VALUES (1, $1::jsonb);", [JSON.stringify(defaultContent)]);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS telegram_settings (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        chat_id TEXT,
        bot_token TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    const tgRow = await query("SELECT id FROM telegram_settings WHERE id = 1;");
    if (!tgRow.rows.length) {
      await query("INSERT INTO telegram_settings (id, chat_id, bot_token) VALUES (1, NULL, NULL);");
    }

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
  })();
  return initPromise;
}

async function getContent() {
  await initDatabase();
  const result = await query("SELECT data FROM site_content WHERE id = 1;");
  return result.rows[0] ? result.rows[0].data : defaultContent;
}

async function saveContent(data) {
  await initDatabase();
  const result = await query(
    `
      UPDATE site_content
      SET data = $1::jsonb, updated_at = NOW()
      WHERE id = 1
      RETURNING data, updated_at;
    `,
    [JSON.stringify(data)]
  );
  return result.rows[0];
}

async function getAdminByUsername(username) {
  await initDatabase();
  const result = await query("SELECT * FROM admins WHERE username = $1 LIMIT 1;", [username]);
  return result.rows[0] || null;
}

async function getAdminById(adminId) {
  await initDatabase();
  const result = await query("SELECT * FROM admins WHERE id = $1 LIMIT 1;", [adminId]);
  return result.rows[0] || null;
}

async function getPrimaryAdmin() {
  await initDatabase();
  const result = await query("SELECT * FROM admins ORDER BY id ASC LIMIT 1;");
  return result.rows[0] || null;
}

async function updateAdminCredentials(adminId, nextUsername, nextPasswordHash) {
  await initDatabase();
  const result = await query(
    `
      UPDATE admins
      SET username = $2, password_hash = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username;
    `,
    [adminId, nextUsername, nextPasswordHash]
  );
  return result.rows[0] || null;
}

async function getTelegramSettings() {
  await initDatabase();
  const result = await query("SELECT chat_id, bot_token FROM telegram_settings WHERE id = 1;");
  const row = result.rows[0];
  return row ? { chatId: row.chat_id || null, botToken: row.bot_token || null } : { chatId: null, botToken: null };
}

async function saveTelegramSettings(chatId, botToken) {
  await initDatabase();
  await query(
    "UPDATE telegram_settings SET chat_id = $1, bot_token = $2, updated_at = NOW() WHERE id = 1;",
    [chatId || null, botToken || null]
  );
  return getTelegramSettings();
}

async function saveOrder(body) {
  await initDatabase();
  const result = await query(
    `
      INSERT INTO orders (name, email, phone, service, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, service, message, created_at;
    `,
    [
      String(body.name || "").trim() || null,
      String(body.email || "").trim() || null,
      String(body.phone || "").trim() || null,
      String(body.service || "").trim() || null,
      String(body.message || "").trim() || ""
    ]
  );
  return result.rows[0];
}

async function getOrders() {
  await initDatabase();
  const result = await query(
    "SELECT id, name, email, phone, service, message, created_at FROM orders ORDER BY created_at DESC;"
  );
  return result.rows;
}

module.exports = {
  initDatabase,
  getContent,
  saveContent,
  getAdminByUsername,
  getAdminById,
  getPrimaryAdmin,
  updateAdminCredentials,
  getTelegramSettings,
  saveTelegramSettings,
  saveOrder,
  getOrders
};
