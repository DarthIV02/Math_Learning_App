const db = require('../db');
const bcrypt = require('bcrypt');

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

async function updateUser(id, data) {
  const {
    firstName,
    lastName,
    email,
    grade,
    password,
  } = data;

  let passwordHash = null;

  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const result = await db.query(
    `UPDATE users
     SET
       firstname = COALESCE($1, firstname),
       lastname = COALESCE($2, lastname),
       grade = COALESCE($3, grade),
       password_hash = COALESCE($4, password_hash)
     WHERE id = $5
     RETURNING id, firstname, lastname, email, grade, auth_type`,
    [
      firstName || null,
      lastName || null,
      grade || null,
      passwordHash,
      id,
    ]
  );

  if (!result.rows.length) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const user = result.rows[0];

  return {
    id: user.id,
    firstName: user.firstname,
    lastName: user.lastname,
    displayName:
      `${user.firstname || ''} ${user.lastname || ''}`.trim() ||
      user.email,
    email: user.email,
    grade: user.grade,
  };
}

async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { createQrUser, listUsers, getUserWithStats, updateUser, deleteUser };