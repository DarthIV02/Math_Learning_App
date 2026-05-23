const { Pool } = require('pg');
const { randomUUID: uuidv4 } = require('crypto');

const problemService = require('../services/problemService');
const { saveAttempts } = require('../services/progressService');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
});

const query = (text, params) => pool.query(text, params);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  firstname: 'Test',
  lastname: 'User',
  email: `attempt_user_${uuidv4()}@example.com`,
  password_hash: null,
  grade: '3',
  class_id: null,
  auth_type: 'anonymous',
  created_by: 'self',
  ...overrides,
});

const insertUser = async (user = makeUser()) => {
  const { rows } = await query(
    `INSERT INTO users
      (firstname, lastname, email, password_hash, grade, class_id, auth_type, created_by)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      user.firstname,
      user.lastname,
      user.email,
      user.password_hash,
      user.grade,
      user.class_id,
      user.auth_type,
      user.created_by,
    ]
  );

  return rows[0];
};

const insertProblem = async (overrides = {}) => {
  const problem = {
    operation_id: 1,
    theme_id: 4,
    grade: 3,
    question_text: `Test problem ${uuidv4()}`,
    subject_object: ['Äpfel'],
    emojis: ['🍎'],
    colors: ['red'],
    correct_answers: { Äpfel: 5 },
    tips: ['Zähle die Äpfel.'],
    difficulty: 1,
    ...overrides,
  };

  const { rows } = await query(
    `INSERT INTO problems
      (operation_id, theme_id, grade, question_text,
       subject_object, emojis, colors, correct_answers, tips, difficulty)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      problem.operation_id,
      problem.theme_id,
      problem.grade,
      problem.question_text,
      problem.subject_object,
      problem.emojis,
      problem.colors,
      problem.correct_answers,
      problem.tips,
      problem.difficulty,
    ]
  );

  return rows[0];
};

// ─────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────

beforeAll(async () => {
  await query('SELECT 1');
});

afterEach(async () => {
  await query(`
    DELETE FROM attempts
    WHERE user_id IN (
      SELECT id FROM users WHERE email LIKE 'attempt_user_%@example.com'
    )
  `);

  await query(`
    DELETE FROM problems
    WHERE question_text LIKE 'Test problem %'
  `);

  await query(`
    DELETE FROM users
    WHERE email LIKE 'attempt_user_%@example.com'
  `);
});

afterAll(async () => {
  await pool.end();
});

// ─────────────────────────────────────────────
// Attempts
// ─────────────────────────────────────────────

describe('Attempts', () => {
  test('saves one correct attempt successfully', async () => {
    const user = await insertUser();
    const problem = await insertProblem();

    const count = await saveAttempts(user.id, [
      {
        problem_id: problem.id,
        answer_given: JSON.stringify({ Äpfel: 5 }),
        is_correct: true,
        time_spent_seconds: 12,
        score: 100,
      },
    ]);

    expect(count).toBe(1);

    const { rows } = await query(
      `SELECT *
       FROM attempts
       WHERE user_id = $1 AND problem_id = $2`,
      [user.id, problem.id]
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user_id: user.id,
      problem_id: problem.id,
      answer_given: JSON.stringify({ Äpfel: 5 }),
      is_correct: true,
      time_spent_seconds: 12,
      score: 100,
    });

    expect(rows[0].id).toBeDefined();
    expect(rows[0].attempted_at).toBeDefined();
  });

  test('saves multiple attempts in bulk', async () => {
    const user = await insertUser();
    const problem1 = await insertProblem();
    const problem2 = await insertProblem();

    const count = await saveAttempts(user.id, [
      {
        problem_id: problem1.id,
        answer_given: 'wrong',
        is_correct: false,
        time_spent_seconds: 8,
        score: 0,
      },
      {
        problem_id: problem2.id,
        answer_given: 'right',
        is_correct: true,
        time_spent_seconds: 14,
        score: 100,
      },
    ]);

    expect(count).toBe(2);

    const { rows } = await query(
      `SELECT *
       FROM attempts
       WHERE user_id = $1
       ORDER BY attempted_at ASC`,
      [user.id]
    );

    expect(rows).toHaveLength(2);
  });

  test('fails attempt if user_id does not exist', async () => {
    const problem = await insertProblem();

    await expect(
      saveAttempts(uuidv4(), [
        {
          problem_id: problem.id,
          answer_given: '5',
          is_correct: true,
          time_spent_seconds: 10,
          score: 100,
        },
      ])
    ).rejects.toThrow(/foreign key/i);
  });

  test('fails attempt if problem_id does not exist', async () => {
    const user = await insertUser();

    await expect(
      saveAttempts(user.id, [
        {
          problem_id: 999999999,
          answer_given: '5',
          is_correct: true,
          time_spent_seconds: 10,
          score: 100,
        },
      ])
    ).rejects.toThrow(/foreign key/i);
  });

  test('returns 0 when saving empty attempts array', async () => {
    const user = await insertUser();

    const count = await saveAttempts(user.id, []);

    expect(count).toBe(0);
  });
});