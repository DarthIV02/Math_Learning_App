const db = require('../db/pool');
const { recordAttempt } = require('./attemptService');

async function submitAttempts(user_id, attempts) {
  const results = [];

  for (const attempt of attempts) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const recorded = await recordAttempt(client, user_id, attempt);
      await client.query('COMMIT');
      results.push({ ok: true, attempt: recorded });
    } catch (err) {
      await client.query('ROLLBACK');
      results.push({ ok: false, error: err.message, problem_id: attempt.problem_id });
    } finally {
      client.release();
    }
  }

  return results;
}

module.exports = { submitAttempts };