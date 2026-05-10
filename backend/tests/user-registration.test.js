// tests/user-registration.test.js
const { Pool } = require('pg');
const { randomUUID: uuidv4 } = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
});

const query = (text, params) => pool.query(text, params);

// --- Helpers ---

console.log('DB URL:', process.env.DATABASE_URL);

const selfRegisteredUser = (overrides = {}) => ({
  firstname: 'Anna',
  lastname: 'Müller',
  email: `anna_${uuidv4()}@example.com`,
  password_hash: 'hashed_pw_123',
  grade: '3',
  auth_type: 'password',
  created_by: 'self',
  ...overrides,
});

const teacherCreatedUser = (overrides = {}) => ({
  firstname: 'Max',
  lastname: 'Schmidt',
  email: null,
  password_hash: null,
  grade: '4',
  auth_type: 'qr',
  created_by: 'teacher',
  ...overrides,
});

const insertUser = ({ firstname, lastname, email, password_hash, grade, auth_type, created_by }) =>
  query(
    `INSERT INTO users (firstname, lastname, email, password_hash, grade, auth_type, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [firstname, lastname, email, password_hash, grade, auth_type, created_by]
  );

// --- Setup / Teardown ---

beforeAll(async () => {
  await query('SELECT 1');
});

afterEach(async () => {
  await query(`DELETE FROM users WHERE firstname IN ('Anna', 'Max')`);
});

afterAll(async () => {
  await pool.end();
});

// ─────────────────────────────────────────────
// Self-registered users
// ─────────────────────────────────────────────

describe('Self-registered users', () => {
  test('inserts successfully with all required fields', async () => {
    const user = selfRegisteredUser();
    const { rows } = await insertUser(user);

    expect(rows[0]).toMatchObject({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      grade: user.grade,
      auth_type: 'password',
      created_by: 'self',
    });
    expect(rows[0].id).toBeDefined();
    expect(rows[0].qr_token).toBeDefined(); // auto-generated
  });

  test('fails without an email', async () => {
    await expect(insertUser(selfRegisteredUser({ email: null })))
      .rejects.toThrow(/self_registered_requires_email/);
  });

  test('fails without a password_hash', async () => {
    await expect(insertUser(selfRegisteredUser({ password_hash: null })))
      .rejects.toThrow(/self_registered_requires_email|password_auth_requires_hash/);
  });

  test('fails with an invalid grade', async () => {
    await expect(insertUser(selfRegisteredUser({ grade: '5' })))
      .rejects.toThrow(/check/i);
  });

  test('fails with a duplicate email', async () => {
    const user = selfRegisteredUser();
    await insertUser(user);
    await expect(insertUser(selfRegisteredUser({ email: user.email })))
      .rejects.toThrow(/unique/i);
  });

  test('fails with an invalid auth_type', async () => {
    await expect(insertUser(selfRegisteredUser({ auth_type: 'magic_link' })))
      .rejects.toThrow(/check/i);
  });
});

// ─────────────────────────────────────────────
// Teacher-created users
// ─────────────────────────────────────────────

describe('Teacher-created users', () => {
  test('inserts successfully with only firstname, lastname, and grade', async () => {
    const user = teacherCreatedUser();
    const { rows } = await insertUser(user);

    expect(rows[0]).toMatchObject({
      firstname: user.firstname,
      lastname: user.lastname,
      email: null,
      password_hash: null,
      grade: '4',
      auth_type: 'qr',
      created_by: 'teacher',
    });
    expect(rows[0].qr_token).toBeDefined();
  });

  test('fails without a firstname', async () => {
    await expect(insertUser(teacherCreatedUser({ firstname: null })))
      .rejects.toThrow(/not.null/i);
  });

  test('fails without a lastname', async () => {
    await expect(insertUser(teacherCreatedUser({ lastname: null })))
      .rejects.toThrow(/not.null/i);
  });

  test('fails without a grade', async () => {
    await expect(insertUser(teacherCreatedUser({ grade: null })))
      .rejects.toThrow(/not.null/i); // if grade is NOT NULL, else adjust accordingly
  });

  test('fails with an invalid grade', async () => {
    await expect(insertUser(teacherCreatedUser({ grade: '6' })))
      .rejects.toThrow(/check/i);
  });
});

// ─────────────────────────────────────────────
// Teacher-created user adds credentials later
// ─────────────────────────────────────────────

describe('Teacher-created user adds credentials later', () => {
  test('can add email and password and switch to password auth', async () => {
    const { rows } = await insertUser(teacherCreatedUser());
    const userId = rows[0].id;

    const email = `max_${uuidv4()}@example.com`;
    const { rows: updated } = await query(
      `UPDATE users
       SET email = $1, password_hash = $2, auth_type = 'password'
       WHERE id = $3
       RETURNING *`,
      [email, 'hashed_pw_456', userId]
    );

    expect(updated[0].email).toBe(email);
    expect(updated[0].password_hash).toBe('hashed_pw_456');
    expect(updated[0].auth_type).toBe('password');
  });

  test('cannot switch to password auth without a password_hash', async () => {
    const { rows } = await insertUser(teacherCreatedUser());
    const userId = rows[0].id;

    await expect(
      query(`UPDATE users SET auth_type = 'password' WHERE id = $1`, [userId])
    ).rejects.toThrow(/password_auth_requires_hash/);
  });
});