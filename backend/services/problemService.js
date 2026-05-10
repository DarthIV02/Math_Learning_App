const db = require('../db');

async function listProblems({ operation_id, theme_id, difficulty }) {
  const conditions = [];
  const values = [];

  if (operation_id) { values.push(operation_id); conditions.push(`p.operation_id = $${values.length}`); }
  if (theme_id)     { values.push(theme_id);     conditions.push(`p.theme_id = $${values.length}`); }
  if (difficulty)   { values.push(difficulty);   conditions.push(`p.difficulty = $${values.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT p.*, o.name AS operation_name, t.name AS theme_name
     FROM problems p
     LEFT JOIN operations o ON o.id = p.operation_id
     LEFT JOIN themes t ON t.id = p.theme_id
     ${where}
     ORDER BY p.problem_number ASC`,
    values
  );
  return result.rows;
}

async function getProblem(id, includeTips = false) {
  const result = await db.query(
    `SELECT
       p.id, p.problem_number, p.question_text, p.subject_object,
       p.emojis, p.colors, p.difficulty, p.operation_id, p.theme_id,
       o.name AS operation_name, t.name AS theme_name
       ${includeTips ? ', p.tips' : ''}
     FROM problems p
     LEFT JOIN operations o ON o.id = p.operation_id
     LEFT JOIN themes t ON t.id = p.theme_id
     WHERE p.id = $1`,
    [id]
  );
  if (!result.rows.length) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

async function createProblem({
  operation_id, theme_id, problem_number, question_text,
  subject_object, emojis, colors, correct_answers, tips, difficulty
}) {
  const result = await db.query(
    `INSERT INTO problems
       (operation_id, theme_id, problem_number, question_text, subject_object,
        emojis, colors, correct_answers, tips, difficulty)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      operation_id, theme_id, problem_number ?? 1, question_text,
      subject_object, emojis ?? [], colors ?? [],
      correct_answers, tips ?? [], difficulty ?? 1
    ]
  );
  return result.rows[0];
}

async function updateProblem(id, {
  operation_id, theme_id, problem_number, question_text,
  subject_object, emojis, colors, correct_answers, tips, difficulty
}) {
  const result = await db.query(
    `UPDATE problems SET
       operation_id    = COALESCE($1,  operation_id),
       theme_id        = COALESCE($2,  theme_id),
       problem_number  = COALESCE($3,  problem_number),
       question_text   = COALESCE($4,  question_text),
       subject_object  = COALESCE($5,  subject_object),
       emojis          = COALESCE($6,  emojis),
       colors          = COALESCE($7,  colors),
       correct_answers = COALESCE($8,  correct_answers),
       tips            = COALESCE($9,  tips),
       difficulty      = COALESCE($10, difficulty)
     WHERE id = $11
     RETURNING *`,
    [operation_id, theme_id, problem_number, question_text,
     subject_object, emojis, colors, correct_answers, tips, difficulty, id]
  );
  if (!result.rows.length) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

async function deleteProblem(id) {
  await db.query('DELETE FROM problems WHERE id = $1', [id]);
}

module.exports = { listProblems, getProblem, createProblem, updateProblem, deleteProblem };