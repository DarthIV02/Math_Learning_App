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

console.log('DB URL:', process.env.DATABASE_URL);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const makeClass = (overrides = {}) => ({
  name: `Klasse_${uuidv4()}`,
  grade: '3',
  ...overrides,
});

const selfRegisteredUser = (overrides = {}) => ({
  firstname: 'Anna',
  lastname: 'Müller',
  email: `anna_${uuidv4()}@example.com`,
  password_hash: 'hashed_pw_123',
  grade: '3',
  class_id: null,
  auth_type: 'password',
  created_by: 'self',
  ...overrides,
});

const teacherCreatedUser = (classId, overrides = {}) => ({
  firstname: 'Max',
  lastname: 'Schmidt',
  email: `student_${uuidv4()}`,
  password_hash: 'hashed_generated_pw',
  grade: '3',
  class_id: classId,
  auth_type: 'qr',
  created_by: 'teacher',
  ...overrides,
});

const anonymousUser = (overrides = {}) => ({
  firstname: 'Gast',
  lastname: `guest_${uuidv4()}`,
  email: `guest_${uuidv4()}`,
  password_hash: null,
  grade: '3',
  class_id: null,
  auth_type: 'anonymous',
  created_by: 'self',
  ...overrides,
});

const insertClass = ({ name, grade }) =>
  query(
    `INSERT INTO classes (name, grade)
     VALUES ($1, $2)
     RETURNING *`,
    [name, grade]
  );

const insertUser = ({
  firstname,
  lastname,
  email,
  password_hash,
  grade,
  class_id,
  auth_type,
  created_by,
}) =>
  query(
    `INSERT INTO users
      (firstname, lastname, email, password_hash, grade, class_id, auth_type, created_by)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      firstname,
      lastname,
      email,
      password_hash,
      grade,
      class_id,
      auth_type,
      created_by,
    ]
  );

// ─────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────

beforeAll(async () => {
  await query('SELECT 1');
});

afterEach(async () => {
  await query(`
    DELETE FROM users
    WHERE email LIKE 'student_%'
       OR email LIKE 'guest_%'
       OR email LIKE '%@example.com'
  `);

  await query(`DELETE FROM classes WHERE name LIKE 'Klasse_%'`);
});

afterAll(async () => {
  await pool.end();
});

// ─────────────────────────────────────────────
// Classes
// ─────────────────────────────────────────────

describe('Classes', () => {
  test('inserts class successfully', async () => {
    const klass = makeClass();
    const { rows } = await insertClass(klass);

    expect(rows[0]).toMatchObject({
      name: klass.name,
      grade: klass.grade,
    });

    expect(rows[0].id).toBeDefined();
  });

  test('fails with duplicate class name', async () => {
    const klass = makeClass();

    await insertClass(klass);

    await expect(
      insertClass({
        name: klass.name,
        grade: '4',
      })
    ).rejects.toThrow(/unique/i);
  });

  test('fails without class name', async () => {
    await expect(
      insertClass(makeClass({ name: null }))
    ).rejects.toThrow(/not.null/i);
  });

  test('fails with invalid grade', async () => {
    await expect(
      insertClass(makeClass({ grade: '5' }))
    ).rejects.toThrow(/check/i);
  });
});

// ─────────────────────────────────────────────
// Self-registered users
// ─────────────────────────────────────────────

describe('Self-registered users', () => {
  test('inserts successfully without class_id', async () => {
    const user = selfRegisteredUser();
    const { rows } = await insertUser(user);

    expect(rows[0]).toMatchObject({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      grade: user.grade,
      class_id: null,
      auth_type: 'password',
      created_by: 'self',
    });

    expect(rows[0].id).toBeDefined();
    expect(rows[0].qr_token).toBeDefined();
  });

  test('fails without email', async () => {
    await expect(
      insertUser(selfRegisteredUser({ email: null }))
    ).rejects.toThrow(/not.null/i);
  });

  test('fails without password_hash', async () => {
    await expect(
      insertUser(selfRegisteredUser({ password_hash: null }))
    ).rejects.toThrow(/self_registered_requires_password|password_auth_requires_hash/i);
  });

  test('fails with duplicate email', async () => {
    const user = selfRegisteredUser();

    await insertUser(user);

    await expect(
      insertUser(selfRegisteredUser({ email: user.email }))
    ).rejects.toThrow(/unique/i);
  });

  test('fails with invalid grade', async () => {
    await expect(
      insertUser(selfRegisteredUser({ grade: '5' }))
    ).rejects.toThrow(/check/i);
  });

  test('fails with invalid auth_type', async () => {
    await expect(
      insertUser(selfRegisteredUser({ auth_type: 'magic_link' }))
    ).rejects.toThrow(/check/i);
  });
});

// ─────────────────────────────────────────────
// Teacher-created QR users
// ─────────────────────────────────────────────

describe('Teacher-created QR users', () => {
  test('inserts teacher-created QR user with class_id and QR token', async () => {
    const { rows: classRows } = await insertClass(makeClass());
    const classId = classRows[0].id;

    const user = teacherCreatedUser(classId);
    const { rows } = await insertUser(user);

    expect(rows[0]).toMatchObject({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password_hash: user.password_hash,
      grade: user.grade,
      class_id: classId,
      auth_type: 'qr',
      created_by: 'teacher',
    });

    expect(rows[0].id).toBeDefined();
    expect(rows[0].qr_token).toBeDefined();
    expect(rows[0].qr_generated_at).toBeDefined();
  });

  test('QR token is unique for each teacher-created student', async () => {
    const { rows: classRows } = await insertClass(makeClass());
    const classId = classRows[0].id;

    const { rows: rows1 } = await insertUser(teacherCreatedUser(classId));
    const { rows: rows2 } = await insertUser(teacherCreatedUser(classId));

    expect(rows1[0].qr_token).toBeDefined();
    expect(rows2[0].qr_token).toBeDefined();
    expect(rows1[0].qr_token).not.toBe(rows2[0].qr_token);
  });

  test('can find QR user by qr_token for login', async () => {
    const { rows: classRows } = await insertClass(makeClass());
    const classId = classRows[0].id;

    const { rows } = await insertUser(teacherCreatedUser(classId));
    const qrToken = rows[0].qr_token;

    const loginResult = await query(
      `SELECT id, firstname, lastname, email, grade, auth_type
       FROM users
       WHERE qr_token = $1 AND auth_type = 'qr'`,
      [qrToken]
    );

    expect(loginResult.rows).toHaveLength(1);
    expect(loginResult.rows[0]).toMatchObject({
      id: rows[0].id,
      firstname: rows[0].firstname,
      lastname: rows[0].lastname,
      email: rows[0].email,
      grade: rows[0].grade,
      auth_type: 'qr',
    });
  });

  test('does not find QR login user with invalid qr_token', async () => {
    const loginResult = await query(
      `SELECT id
       FROM users
       WHERE qr_token = $1 AND auth_type = 'qr'`,
      [uuidv4()]
    );

    expect(loginResult.rows).toHaveLength(0);
  });

  test('allows multiple students in the same class', async () => {
    const { rows: classRows } = await insertClass(makeClass());
    const classId = classRows[0].id;

    const user1 = teacherCreatedUser(classId, {
      firstname: 'Max',
      email: `student_${uuidv4()}`,
    });

    const user2 = teacherCreatedUser(classId, {
      firstname: 'Lisa',
      email: `student_${uuidv4()}`,
    });

    const { rows: rows1 } = await insertUser(user1);
    const { rows: rows2 } = await insertUser(user2);

    expect(rows1[0].class_id).toBe(classId);
    expect(rows2[0].class_id).toBe(classId);
  });

  test('fails if class_id does not exist', async () => {
    const fakeClassId = uuidv4();

    await expect(
      insertUser(teacherCreatedUser(fakeClassId))
    ).rejects.toThrow(/foreign key/i);
  });

  test('fails without firstname', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    await expect(
      insertUser(teacherCreatedUser(classRows[0].id, { firstname: null }))
    ).rejects.toThrow(/not.null/i);
  });

  test('fails without lastname', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    await expect(
      insertUser(teacherCreatedUser(classRows[0].id, { lastname: null }))
    ).rejects.toThrow(/not.null/i);
  });

  test('fails without email username', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    await expect(
      insertUser(teacherCreatedUser(classRows[0].id, { email: null }))
    ).rejects.toThrow(/not.null/i);
  });

  test('fails with duplicate email username', async () => {
    const { rows: classRows } = await insertClass(makeClass());
    const classId = classRows[0].id;

    const user = teacherCreatedUser(classId);

    await insertUser(user);

    await expect(
      insertUser(teacherCreatedUser(classId, { email: user.email }))
    ).rejects.toThrow(/unique/i);
  });

  test('fails with invalid grade', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    await expect(
      insertUser(teacherCreatedUser(classRows[0].id, { grade: '6' }))
    ).rejects.toThrow(/check/i);
  });
});

// ─────────────────────────────────────────────
// Anonymous guest users
// ─────────────────────────────────────────────

describe('Anonymous guest users', () => {
  test('inserts anonymous guest user without password_hash', async () => {
    const user = anonymousUser();
    const { rows } = await insertUser(user);

    expect(rows[0]).toMatchObject({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password_hash: null,
      grade: '3',
      class_id: null,
      auth_type: 'anonymous',
      created_by: 'self',
    });

    expect(rows[0].id).toBeDefined();
  });

  test('anonymous guest user still gets a qr_token by default', async () => {
    const user = anonymousUser();
    const { rows } = await insertUser(user);

    expect(rows[0].qr_token).toBeDefined();
  });

  test('fails anonymous guest with duplicate generated email', async () => {
    const user = anonymousUser();

    await insertUser(user);

    await expect(
      insertUser(anonymousUser({ email: user.email }))
    ).rejects.toThrow(/unique/i);
  });

  test('fails anonymous guest with invalid grade', async () => {
    await expect(
      insertUser(anonymousUser({ grade: '7' }))
    ).rejects.toThrow(/check/i);
  });

  test('anonymous user does not require password_hash even when created_by is self', async () => {
    const user = anonymousUser({
      password_hash: null,
      created_by: 'self',
      auth_type: 'anonymous',
    });

    const { rows } = await insertUser(user);

    expect(rows[0].auth_type).toBe('anonymous');
    expect(rows[0].created_by).toBe('self');
    expect(rows[0].password_hash).toBe(null);
  });
});

// ─────────────────────────────────────────────
// Auth constraints
// ─────────────────────────────────────────────

describe('Auth constraints', () => {
  test('qr auth allows password_hash', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    const user = teacherCreatedUser(classRows[0].id, {
      auth_type: 'qr',
      password_hash: 'hashed_generated_pw',
    });

    const { rows } = await insertUser(user);

    expect(rows[0].auth_type).toBe('qr');
    expect(rows[0].password_hash).toBe('hashed_generated_pw');
  });

  test('qr auth also allows null password_hash', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    const user = teacherCreatedUser(classRows[0].id, {
      auth_type: 'qr',
      password_hash: null,
    });

    const { rows } = await insertUser(user);

    expect(rows[0].auth_type).toBe('qr');
    expect(rows[0].password_hash).toBe(null);
  });

  test('password auth requires password_hash', async () => {
    await expect(
      insertUser(
        selfRegisteredUser({
          auth_type: 'password',
          password_hash: null,
        })
      )
    ).rejects.toThrow(/self_registered_requires_password|password_auth_requires_hash/i);
  });

  test('anonymous auth does not require password_hash', async () => {
    const user = anonymousUser({
      auth_type: 'anonymous',
      password_hash: null,
    });

    const { rows } = await insertUser(user);

    expect(rows[0].auth_type).toBe('anonymous');
    expect(rows[0].password_hash).toBe(null);
  });

  test('cannot switch qr user to password auth without password_hash', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    const { rows } = await insertUser(
      teacherCreatedUser(classRows[0].id, {
        auth_type: 'qr',
        password_hash: null,
      })
    );

    await expect(
      query(
        `UPDATE users
         SET auth_type = 'password'
         WHERE id = $1`,
        [rows[0].id]
      )
    ).rejects.toThrow(/password_auth_requires_hash/i);
  });

  test('can switch qr user to password auth after adding password_hash', async () => {
    const { rows: classRows } = await insertClass(makeClass());

    const { rows } = await insertUser(
      teacherCreatedUser(classRows[0].id, {
        auth_type: 'qr',
        password_hash: null,
      })
    );

    const { rows: updated } = await query(
      `UPDATE users
       SET auth_type = 'password',
           password_hash = $1
       WHERE id = $2
       RETURNING *`,
      ['new_hashed_password', rows[0].id]
    );

    expect(updated[0].auth_type).toBe('password');
    expect(updated[0].password_hash).toBe('new_hashed_password');
  });
});