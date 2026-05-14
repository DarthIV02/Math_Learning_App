const express = require('express');
const router = express.Router();
const { generateCredentialPdf } = require('../services/pdfService');

const {
  loginOrRegister,
  qrLogin,
  anonymousLogin,
  logout,
  registerStudent,
  registerClass,
} = require('../services/authService');

const { authMiddleware } = require('../middleware/auth');

// ─────────────────────────────────────────────
// Self registration
// ─────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, grade } = req.body;

    if (!email || !password || !grade) {
      return res.status(400).json({
        error: 'Email, password and grade are required',
      });
    }

    const result = await registerStudent({
      firstName,
      lastName,
      email,
      password,
      grade,
    });

    res.status(201).json(result);

  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Teacher class registration
// ─────────────────────────────────────────────

router.post('/register_class', async (req, res) => {
  try {
    const { className, grade, students } = req.body;

    if (!className || !grade) {
      return res.status(400).json({
        error: 'Class name and grade are required',
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        error: 'At least one student is required',
      });
    }

    const result = await registerClass({
      className,
      grade,
      students,
    });

    const pdfBuffer = await generateCredentialPdf({
      classInfo: result.class,
      students: result.students,
    });

    const safeClassName = result.class.name.replace(/[^a-z0-9]/gi, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeClassName}_credentials.pdf"`
    );

    res.send(pdfBuffer);

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Class name already exists',
      });
    }

    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Username/email + password login
// ─────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Username/email and password are required',
      });
    }

    const { created, payload } = await loginOrRegister(
      email,
      password
    );

    res.status(created ? 201 : 200).json(payload);

  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// QR login
// ─────────────────────────────────────────────

router.post('/qr', async (req, res) => {
  try {
    const { qr_token } = req.body;

    if (!qr_token) {
      return res.status(400).json({
        error: 'QR token is required',
      });
    }

    const payload = await qrLogin(qr_token);

    res.json(payload);

  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Anonymous login
// ─────────────────────────────────────────────

router.post('/anonymous', async (req, res) => {
  try {
    const { display_name } = req.body;

    const payload = await anonymousLogin(display_name);

    res.json(payload);

  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await logout(req.user.id);

    res.json({
      message: 'Logged out',
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;