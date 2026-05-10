const db = require('../db');

function calculateScore(is_correct, time_spent_seconds) {
  if (!is_correct) return 0;
  return 10 + (time_spent_seconds && time_spent_seconds < 30 ? 5 : 0);
}

async function submitAttempt(user_id, problem_id, answer_given, time_spent_seconds) {
  const problem = await db.query(
    'SELECT correct_answers FROM problems WHERE id = $1',
    [problem_id]
  );
  if (!problem.rows.length) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }

  const correct_answers = problem.rows[0].correct_answers;
  const is_correct = correct_answers
    .map(a => a.trim().toLowerCase())
    .includes(String(answer_given).trim().toLowerCase());

  const score = calculateScore(is_correct, time_spent_seconds);

  const result = await db.query(
    `INSERT INTO attempts
       (user_id, problem_id, answer_given, is_correct, time_spent_seconds, score)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, problem_id, String(answer_given), is_correct, time_spent_seconds ?? null, score]
  );

  return {
    ...result.rows[0],
    correct_answers: is_correct ? correct_answers : undefined,
  };
}

async function getAttemptsForUser(user_id) {
  const result = await db.query(
    `SELECT
       a.*,
       p.question_text, p.difficulty,
       o.name AS operation_name,
       t.name AS theme_name
     FROM attempts a
     JOIN problems p ON p.id = a.problem_id
     LEFT JOIN operations o ON o.id = p.operation_id
     LEFT JOIN themes t ON t.id = p.theme_id
     WHERE a.user_id = $1
     ORDER BY a.attempted_at DESC`,
    [user_id]
  );
  return result.rows;
}

async function getAttemptsForProblem(problem_id) {
  const result = await db.query(
    `SELECT a.*, u.display_name
     FROM attempts a
     JOIN users u ON u.id = a.user_id
     WHERE a.problem_id = $1
     ORDER BY a.attempted_at DESC`,
    [problem_id]
  );
  return result.rows;
}

module.exports = { submitAttempt, getAttemptsForUser, getAttemptsForProblem };