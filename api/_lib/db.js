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

    await query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INT NOT NULL DEFAULT 0,
        reset_at TIMESTAMPTZ NOT NULL
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
  })();
  return initPromise;
}

module.exports = {
  initDatabase,
  getPool,
  query
};
