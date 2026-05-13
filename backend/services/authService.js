const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const crypto = require('crypto');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, display_name: user.display_name, auth_type: user.auth_type },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function formatUser(user) {
  return { 
    id: user.id,
    display_name: user.display_name,
    firstName: user.firstname,
    lastName: user.lastname,
    email: user.email,
    grade: user.grade,
  };
}

function generateUsername(firstName, lastName) {
  const cleanFirst = (firstName || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const cleanLast = (lastName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const random = crypto.randomBytes(3).toString('hex');

  return `${cleanFirst}.${cleanLast || 'user'}.${random}`;
}

function generatePassword() {
  return crypto.randomBytes(6).toString('base64url');
}

async function registerStudent({ firstName, lastName, email, password, grade }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);
  const display_name = `${firstName || ''} ${lastName || ''}`.trim() || email;

  const result = await db.query(
    `INSERT INTO users (firstname, lastname, email, password_hash, grade, auth_type, created_by)
     VALUES ($1, $2, $3, $4, $5, 'password', 'self')
     RETURNING id, firstname, lastname, email, grade, auth_type`,
    [firstName || null, lastName || null, email, hash, String(grade)]
  );

  const user = result.rows[0];
  user.display_name = display_name;

  return { token: makeToken(user), user: formatUser(user) };
}

async function registerClass({ className, grade, students }) {
  if (!className || !grade) {
    const err = new Error('Class name and grade are required');
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(students) || students.length === 0) {
    const err = new Error('At least one student is required');
    err.status = 400;
    throw err;
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const classResult = await client.query(
      `INSERT INTO classes (name, grade)
       VALUES ($1, $2)
       RETURNING id, name, grade`,
      [className, String(grade)]
    );

    const createdClass = classResult.rows[0];
    const createdStudents = [];

    for (const student of students) {
      const { firstName, lastName } = student;

      if (!firstName && !lastName) {
        continue;
      }

      let email;
      let exists = true;

      while (exists) {
        email = generateUsername(firstName, lastName);

        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        exists = existing.rows.length > 0;
      }

      const password = generatePassword();
      const hash = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO users
          (firstname, lastname, email, password_hash, grade, class_id, auth_type, created_by)
         VALUES
          ($1, $2, $3, $4, $5, $6, 'qr', 'teacher')
         RETURNING id, firstname, lastname, email, grade, class_id, auth_type, qr_token`,
        [
          firstName || null,
          lastName || null,
          email,
          hash,
          String(grade),
          createdClass.id,
        ]
      );

      createdStudents.push({
        id: result.rows[0].id,
        firstName: result.rows[0].firstname,
        lastName: result.rows[0].lastname,
        username: result.rows[0].email,
        email: result.rows[0].email,
        password,
        grade: result.rows[0].grade,
        classId: result.rows[0].class_id,
        authType: result.rows[0].auth_type,
        qrToken: result.rows[0].qr_token,
      });
    }

    if (createdStudents.length === 0) {
      const err = new Error('At least one student must have a first or last name');
      err.status = 400;
      throw err;
    }

    await client.query('COMMIT');

    return {
      class: {
        id: createdClass.id,
        name: createdClass.name,
        grade: createdClass.grade,
      },
      students: createdStudents,
    };
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') {
      err.status = 409;
      err.message = 'Class name or username already exists';
    }

    throw err;
  } finally {
    client.release();
  }
}

async function loginOrRegister(email, password) {
  const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);

  if (!existing.rows.length) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const user = existing.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  user.display_name =
    `${user.firstname || ''} ${user.lastname || ''}`.trim() ||
    user.email;

  return {
    created: false,
    payload: {
      token: makeToken(user),
      user: formatUser(user),
    },
  };
}

async function qrLogin(qr_token) {
  const result = await db.query(
    `SELECT id, display_name, auth_type FROM users
     WHERE qr_token = $1 AND auth_type = 'qr'`,
    [qr_token]
  );
  if (!result.rows.length) {
    const err = new Error('Invalid QR code');
    err.status = 401;
    throw err;
  }
  const user = result.rows[0];
  await db.query('INSERT INTO sessions (user_id) VALUES ($1)', [user.id]);
  return { token: makeToken(user), user: formatUser(user) };
}

async function anonymousLogin(display_name) {
  const result = await db.query(
    `INSERT INTO users (display_name, auth_type)
     VALUES ($1, 'anonymous')
     RETURNING id, display_name, auth_type`,
    [display_name]
  );
  const user = result.rows[0];
  return { token: makeToken(user), user: formatUser(user) };
}

async function logout(user_id) {
  await db.query(
    `UPDATE sessions SET ended_at = NOW() WHERE user_id = $1 AND ended_at IS NULL`,
    [user_id]
  );
}

module.exports = {
  registerStudent,
  registerClass,
  loginOrRegister,
  qrLogin,
  anonymousLogin,
  logout,
};