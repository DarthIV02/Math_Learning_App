const db = require('../db');

async function list(table) {
  const result = await db.query(`SELECT * FROM ${table} ORDER BY name`);
  return result.rows;
}

async function create(table, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const cols = keys.join(', ');
  const params = keys.map((_, i) => `$${i + 1}`).join(', ');

  const result = await db.query(
    `INSERT INTO ${table} (${cols}) VALUES (${params}) RETURNING *`,
    values
  );
  return result.rows[0];
}

async function remove(table, id) {
  await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

module.exports = { list, create, remove };