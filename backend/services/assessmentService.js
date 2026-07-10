// services/assessmentService.js
const db = require('../db/pool');
const { recordAttempt } = require('./attemptService');

const ASSESSMENT_K = 0.8;

async function submitAssessment(user_id, attempts) {
  if (!Array.isArray(attempts) || !attempts.length) {
    const err = new Error('attempts array is required');
    err.status = 400;
    throw err;
  }

  const submittedIds = attempts.map(a => a.problem_id);
  const validCheck = await db.query(
    `SELECT id FROM problems WHERE id = ANY($1) AND is_assessment = true`,
    [submittedIds]
  );
  const validIds = new Set(validCheck.rows.map(r => r.id));

  const invalid = submittedIds.filter(id => !validIds.has(id));
  if (invalid.length) {
    const err = new Error(`Invalid assessment problem ids: ${invalid.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const results = [];

  for (const attempt of attempts) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const recorded = await recordAttempt(client, user_id, attempt, { k: ASSESSMENT_K });
      await client.query('COMMIT');
      results.push({ ok: true, attempt: recorded });
    } catch (err) {
      await client.query('ROLLBACK');
      results.push({ ok: false, error: err.message, problem_id: attempt.problem_id });
    } finally {
      client.release();
    }
  }

  // Completion is about cumulative coverage, not this batch's success —
  // a user might submit answers across several small batches (queue
  // flushes, retries, page reloads), so check total distinct assessment
  // problems ever attempted by this user, not just what came in this call.
  const totalAssessmentProblems = await db.query(
    `SELECT COUNT(*)::int AS count FROM problems WHERE is_assessment = true`
  );

  const attemptedCount = await db.query(
    `SELECT COUNT(DISTINCT a.problem_id)::int AS count
     FROM attempts a
     JOIN problems p ON p.id = a.problem_id
     WHERE a.user_id = $1 AND p.is_assessment = true`,
    [user_id]
  );

  if (attemptedCount.rows[0].count >= totalAssessmentProblems.rows[0].count) {
    await db.query(`UPDATE users SET has_completed_assessment = true WHERE id = $1`, [user_id]);
  }

  return results;
}

module.exports = { submitAssessment };