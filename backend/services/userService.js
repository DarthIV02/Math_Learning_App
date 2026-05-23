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
    `SELECT id, display_name, auth_type, username, qr_token, coins, created_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

async function getUserWithStats(id) {
  const user = await db.query(
    `SELECT id, display_name, auth_type, username, coins, created_at
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

async function getUserById(id) {
  const result = await db.query(
    `SELECT *
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
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
    grade: user.grade
  };
}

async function updateAvatar(userId, avatarUrl) {
  const result = await db.query(
    `UPDATE users
     SET avatar_url = $1
     WHERE id = $2
     RETURNING id, firstname, lastname, email, grade, avatar_url`,
    [avatarUrl, userId]
  );

  if (!result.rows.length) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function awardProblemCoins(userId, problemId, amount) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const existingReward = await client.query(
      `SELECT id
       FROM coin_rewards
       WHERE user_id = $1 AND problem_id = $2`,
      [userId, problemId]
    );

    if (existingReward.rows.length) {
      const user = await client.query(
        `SELECT id, firstname, lastname, email, grade, coins
         FROM users
         WHERE id = $1`,
        [userId]
      );

      await client.query('COMMIT');
      return user.rows[0];
    }

    await client.query(
      `INSERT INTO coin_rewards (user_id, problem_id, amount)
       VALUES ($1, $2, $3)`,
      [userId, problemId, amount]
    );

    const updatedUser = await client.query(
      `UPDATE users
       SET coins = COALESCE(coins, 0) + $1
       WHERE id = $2
       RETURNING id, firstname, lastname, email, grade, coins`,
      [amount, userId]
    );

    await client.query('COMMIT');

    return updatedUser.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getUserProfileStats(userId) {
  const result = await db.query(
    `
    WITH solved_days AS (
      SELECT DISTINCT DATE(attempted_at) AS solved_date
      FROM attempts
      WHERE user_id = $1
        AND is_correct = true
    ),
    numbered_days AS (
      SELECT
        solved_date,
        solved_date + ROW_NUMBER() OVER (ORDER BY solved_date DESC)::int AS streak_group
      FROM solved_days
      WHERE solved_date <= CURRENT_DATE
    ),
    current_streak AS (
      SELECT COUNT(*) AS streak
      FROM numbered_days
      WHERE streak_group = (
        SELECT CURRENT_DATE + 1
        FROM solved_days
        WHERE solved_date = CURRENT_DATE
        UNION
        SELECT CURRENT_DATE
        FROM solved_days
        WHERE solved_date = CURRENT_DATE - INTERVAL '1 day'
          AND NOT EXISTS (
            SELECT 1 FROM solved_days WHERE solved_date = CURRENT_DATE
          )
        LIMIT 1
      )
    ),
    solved_tasks AS (
      SELECT COUNT(DISTINCT problem_id) AS solved_tasks
      FROM attempts
      WHERE user_id = $1
        AND is_correct = true
    )
    SELECT
      u.coins,
      COALESCE((SELECT streak FROM current_streak), 0)::int AS streak,
      COALESCE((SELECT solved_tasks FROM solved_tasks), 0)::int AS solved_tasks
    FROM users u
    WHERE u.id = $1
    `,
    [userId]
  );

  if (!result.rows.length) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function getCurrentUserProfile(id) {
  const result = await db.query(
    `
    WITH solved_tasks AS (
      SELECT COUNT(DISTINCT problem_id)::int AS solved_tasks
      FROM attempts
      WHERE user_id = $1
        AND is_correct = true
    ),
    solved_days AS (
      SELECT DISTINCT DATE(attempted_at) AS solved_date
      FROM attempts
      WHERE user_id = $1
        AND is_correct = true
    ),
    streak_days AS (
      SELECT solved_date
      FROM solved_days
      WHERE solved_date <= CURRENT_DATE
      ORDER BY solved_date DESC
    )
    SELECT
      u.*,
      COALESCE((SELECT solved_tasks FROM solved_tasks), 0) AS solved_tasks,
      COALESCE((
        SELECT COUNT(*)::int
        FROM streak_days sd
        WHERE NOT EXISTS (
          SELECT 1
          FROM generate_series(sd.solved_date + INTERVAL '1 day', CURRENT_DATE, INTERVAL '1 day') d(day)
          WHERE NOT EXISTS (
            SELECT 1 FROM solved_days WHERE solved_date = d.day::date
          )
        )
      ), 0) AS streak
    FROM users u
    WHERE u.id = $1
    `,
    [id]
  );

  if (!result.rows.length) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { createQrUser, listUsers, getUserWithStats, 
  getUserById, updateUser, updateAvatar, awardProblemCoins, 
  getUserProfileStats, getCurrentUserProfile, deleteUser };