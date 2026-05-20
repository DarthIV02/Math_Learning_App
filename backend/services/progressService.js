const db = require('../db'); // adjust path to your actual db file

async function saveAttempts(userId, attempts) {
  if (!attempts?.length) return 0;

  const values = [];
  const params = [];

  attempts.forEach((a, i) => {
    const base = i * 6;

    values.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    );

    params.push(
      userId,
      a.problem_id,
      a.answer_given ?? null,
      a.is_correct,
      a.time_spent_seconds,
      a.score ?? null
    );
  });

  const sql = `
    INSERT INTO attempts
      (user_id, problem_id, answer_given, is_correct, time_spent_seconds, score)
    VALUES ${values.join(', ')}
  `;

  const result = await db.query(sql, params);
  return result.rowCount;
}

module.exports = { saveAttempts };