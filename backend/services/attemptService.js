const db = require('../db');
const { updateAbility, DEFAULT_K } = require('../services/masteryService');

function calculateScore(is_correct, time_spent_seconds) {
  if (!is_correct) return 0;
  return 10 + (time_spent_seconds && time_spent_seconds < 30 ? 5 : 0);
}

// correct_answers is a keyed object, e.g. { answer: "82" }
// answer_given is the raw string sent by the client, e.g. '{"answer":"82"}'
function checkAnswers(correctAnswers, answerGivenRaw) {
  let given;
  try {
    given = typeof answerGivenRaw === 'string' ? JSON.parse(answerGivenRaw) : answerGivenRaw;
  } catch {
    given = {};
  }

  return Object.entries(correctAnswers).every(([key, value]) =>
    String(given?.[key] ?? '').trim().toLowerCase() === String(value).trim().toLowerCase()
  );
}

// Core logic, reused by single-submit, batch-submit (/progress), and assessment.
// Runs inside a caller-supplied client/transaction.
async function recordAttempt(client, user_id, { problem_id, answer_given, time_spent_seconds }, options = {}) {
  const k = options.k ?? DEFAULT_K;

  const problemResult = await client.query(
    `SELECT
       correct_answers,
       number_range_id,       nr.score  AS number_range_score,
       operation_category_id, oc.score  AS operation_category_score,
       unknown_position_id,   up.score  AS unknown_position_score,
       linguistic_complexity_id, lc.score AS linguistic_complexity_score,
       cognitive_demand_id,   cd.score  AS cognitive_demand_score,
       operation_count_id,    ocnt.score AS operation_count_score
     FROM problems p
     LEFT JOIN number_ranges nr ON nr.id = p.number_range_id
     LEFT JOIN operation_categories oc ON oc.id = p.operation_category_id
     LEFT JOIN unknown_positions up ON up.id = p.unknown_position_id
     LEFT JOIN linguistic_complexities lc ON lc.id = p.linguistic_complexity_id
     LEFT JOIN cognitive_demands cd ON cd.id = p.cognitive_demand_id
     LEFT JOIN operation_counts ocnt ON ocnt.id = p.operation_count_id
     WHERE p.id = $1`,
    [problem_id]
  );

  if (!problemResult.rows.length) {
    const err = new Error(`Problem ${problem_id} not found`);
    err.status = 404;
    throw err;
  }

  const problem = problemResult.rows[0];
  const is_correct = checkAnswers(problem.correct_answers, answer_given);
  const score = calculateScore(is_correct, time_spent_seconds);

  const attemptResult = await client.query(
    `INSERT INTO attempts
       (user_id, problem_id, answer_given, is_correct, time_spent_seconds, score)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, problem_id, String(answer_given), is_correct, time_spent_seconds ?? null, score]
  );

  const dimensions = [
    ['number_range', problem.number_range_id, problem.number_range_score],
    ['operation_category', problem.operation_category_id, problem.operation_category_score],
    ['unknown_position', problem.unknown_position_id, problem.unknown_position_score],
    ['linguistic_complexity', problem.linguistic_complexity_id, problem.linguistic_complexity_score],
    ['cognitive_demand', problem.cognitive_demand_id, problem.cognitive_demand_score],
    ['operation_count', problem.operation_count_id, problem.operation_count_score],
  ];

  for (const [categoryType, categoryId, difficultyScore] of dimensions) {
    if (categoryId != null && difficultyScore != null) {
      await updateAbility(client, user_id, categoryType, is_correct, difficultyScore, k);
    }
  }

  return {
    ...attemptResult.rows[0],
    correct_answers: is_correct ? problem.correct_answers : undefined,
  };
}

async function submitAttempt(user_id, problem_id, answer_given, time_spent_seconds) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await recordAttempt(client, user_id, { problem_id, answer_given, time_spent_seconds });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getAttemptsForUser(user_id) {
  const result = await db.query(
    `SELECT a.*, p.question_text, p.difficulty_label, t.name AS theme_name
     FROM attempts a
     JOIN problems p ON p.id = a.problem_id
     LEFT JOIN themes t ON t.id = p.theme_id
     WHERE a.user_id = $1
     ORDER BY a.attempted_at DESC`,
    [user_id]
  );
  return result.rows;
}

module.exports = { submitAttempt, recordAttempt, getAttemptsForUser };