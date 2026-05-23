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
// Problems
// ─────────────────────────────────────────────

describe('Problems', () => {
  test('creates problem successfully', async () => {
    const problem = await insertProblem();

    expect(problem.id).toBeDefined();
    expect(problem.question_text).toMatch(/Test problem/);
    expect(problem.grade).toBe(3);
    expect(problem.difficulty).toBe(1);
    expect(problem.correct_answers).toMatchObject({ Äpfel: 5 });
  });

  test('fails without question_text', async () => {
    await expect(
      insertProblem({ question_text: null })
    ).rejects.toThrow(/not null|null value/i);
  });

  test('fails with invalid grade', async () => {
    await expect(
      insertProblem({ grade: 5 })
    ).rejects.toThrow(/check/i);
  });

  test('fails with invalid operation_id foreign key', async () => {
    await expect(
      insertProblem({ operation_id: 999999 })
    ).rejects.toThrow(/foreign key/i);
  });

  test('listProblems filters by grade, difficulty, operation and theme', async () => {
    const target = await insertProblem({
      grade: 3,
      difficulty: 2,
      operation_id: 1,
      theme_id: 4,
    });

    await insertProblem({
      grade: 4,
      difficulty: 2,
      operation_id: 1,
      theme_id: 4,
    });

    const problems = await problemService.listProblems({
      grade: 3,
      difficulty: 2,
      operation_id: 1,
      theme_id: 4,
      limit: 20,
    });

    const ids = problems.map((p) => p.id);

    expect(ids).toContain(target.id);
    expect(problems.every((p) => p.grade === 3)).toBe(true);
    expect(problems.every((p) => p.difficulty === 2)).toBe(true);
  });

  test('getProblem returns operation and theme names', async () => {
    const created = await insertProblem({
      operation_id: 1,
      theme_id: 4,
    });

    const problem = await problemService.getProblem(created.id, true);

    expect(problem.id).toBe(created.id);
    expect(problem.operation_name).toBeDefined();
    expect(problem.theme_name).toBeDefined();
    expect(problem.tips).toBeDefined();
  });

  test('getProblem fails for missing problem', async () => {
    await expect(
      problemService.getProblem(999999999)
    ).rejects.toThrow(/Problem not found/i);
  });
});

// ─────────────────────────────────────────────
// Unsolved problem filtering
// ─────────────────────────────────────────────

describe('Unsolved problem filtering', () => {
  test('excludes problems already solved correctly by the user', async () => {
    const user = await insertUser();

    const solvedProblem = await insertProblem({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
    });

    const unsolvedProblem = await insertProblem({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
    });

    await saveAttempts(user.id, [
      {
        problem_id: solvedProblem.id,
        answer_given: 'correct',
        is_correct: true,
        time_spent_seconds: 10,
        score: 100,
      },
    ]);

    const problems = await problemService.listProblems({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
      user_id: user.id,
      unsolvedOnly: true,
      limit: 50,
    });

    const ids = problems.map((p) => p.id);

    expect(ids).not.toContain(solvedProblem.id);
    expect(ids).toContain(unsolvedProblem.id);
  });

  test('does not exclude problem if previous attempt was incorrect', async () => {
    const user = await insertUser();

    const problem = await insertProblem({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
    });

    await saveAttempts(user.id, [
      {
        problem_id: problem.id,
        answer_given: 'wrong',
        is_correct: false,
        time_spent_seconds: 10,
        score: 0,
      },
    ]);

    const problems = await problemService.listProblems({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
      user_id: user.id,
      unsolvedOnly: true,
      limit: 50,
    });

    const ids = problems.map((p) => p.id);

    expect(ids).toContain(problem.id);
  });

  test('correct attempt by another user does not hide problem', async () => {
    const userA = await insertUser();
    const userB = await insertUser();

    const problem = await insertProblem({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
    });

    await saveAttempts(userA.id, [
      {
        problem_id: problem.id,
        answer_given: 'correct',
        is_correct: true,
        time_spent_seconds: 10,
        score: 100,
      },
    ]);

    const problems = await problemService.listProblems({
      grade: 3,
      difficulty: 1,
      operation_id: 1,
      theme_id: 4,
      user_id: userB.id,
      unsolvedOnly: true,
      limit: 50,
    });

    const ids = problems.map((p) => p.id);

    expect(ids).toContain(problem.id);
  });
});