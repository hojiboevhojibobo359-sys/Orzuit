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

module.exports = {
  initDatabase,
  getContent,
  saveContent,
  getAdminByUsername,
  getAdminById,
  getPrimaryAdmin,
  updateAdminCredentials
};
