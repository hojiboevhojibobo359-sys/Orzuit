const { initDatabase, query } = require("../db");

async function create(fields) {
  await initDatabase();
  const result = await query(
    `INSERT INTO analytics (page, ip, country, referrer)
     VALUES ($1, $2, $3, $4)
     RETURNING id, page, ip, country, referrer, created_at`,
    [
      fields.page ?? "/",
      fields.ip ?? null,
      fields.country ?? null,
      fields.referrer ?? null
    ]
  );
  return result.rows[0];
}

function buildWhere(from, to, page) {
  const conditions = [];
  const params = [];
  let i = 1;
  if (from) {
    conditions.push(`created_at >= $${i}`);
    params.push(from);
    i++;
  }
  if (to) {
    conditions.push(`created_at < $${i}::date + interval '1 day'`);
    params.push(to);
    i++;
  }
  if (page) {
    conditions.push(`page = $${i}`);
    params.push(page);
  }
  return { where: conditions.length ? "WHERE " + conditions.join(" AND ") : "", params };
}

async function getTotalVisits(from, to, page) {
  await initDatabase();
  const { where, params } = buildWhere(from, to, page);
  const result = await query(`SELECT COUNT(*)::int AS total FROM analytics ${where}`, params);
  return result.rows[0].total;
}

async function getPageViews(from, to) {
  await initDatabase();
  const { where, params } = buildWhere(from, to, null);
  const result = await query(
    `SELECT page, COUNT(*)::int AS views FROM analytics ${where} GROUP BY page ORDER BY views DESC`,
    params
  );
  return result.rows;
}

async function getByCountry(from, to, page) {
  await initDatabase();
  const { where, params } = buildWhere(from, to, page);
  const result = await query(
    `SELECT COALESCE(country, '(unbekannt)') AS country, COUNT(*)::int AS views
     FROM analytics ${where} GROUP BY country ORDER BY views DESC LIMIT 15`,
    params
  );
  return result.rows;
}

async function getByTime(from, to, page, groupBy = "day") {
  await initDatabase();
  const { where, params } = buildWhere(from, to, page);
  const dateExpr = groupBy === "week"
    ? "date_trunc('week', created_at)::date"
    : "created_at::date";
  const result = await query(
    `SELECT ${dateExpr} AS date, COUNT(*)::int AS views
     FROM analytics ${where} GROUP BY 1 ORDER BY 1 ASC LIMIT 90`,
    params
  );
  return result.rows;
}

module.exports = {
  create,
  getTotalVisits,
  getPageViews,
  getByCountry,
  getByTime
};
