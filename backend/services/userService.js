const db = require('../db');

async function createQrUser(display_name) {
  const result = await db.query(
    `INSERT INTO users (display_name, auth_type, qr_generated_at)
     VALUES ($1, 'qr', NOW())
     RETURNING id, display_name, qr_token, qr_generated_at`,
    [display_name]
  );
  return result.rows[0];
}

async function listUsers() {
  const result = await db.query(
    `SELECT id, display_name, auth_type, username, qr_token, created_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

async function getUserWithStats(id) {
  const user = await db.query(
    `SELECT id, display_name, auth_type, username, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (!user.rows.length) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const stats = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE is_correct) AS correct,
       COUNT(*) AS total,
       ROUND(AVG(time_spent_seconds)) AS avg_time_seconds,
       SUM(score) AS total_score
     FROM attempts WHERE user_id = $1`,
    [id]
  );

  return { ...user.rows[0], stats: stats.rows[0] };
}

async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { createQrUser, listUsers, getUserWithStats, deleteUser };