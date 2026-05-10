const express = require('express');
const router = express.Router();
const { loginOrRegister, qrLogin, anonymousLogin, logout, registerStudent } = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, grade } = req.body;

    if (!email || !password || !grade) {
      return res.status(400).json({ error: 'Email, password and grade are required' });
    }

    const result = await registerStudent({ firstName, lastName, email, password, grade });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, display_name } = req.body;
    const { created, payload } = await loginOrRegister(username, password, display_name);
    res.status(created ? 201 : 200).json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/qr', async (req, res) => {
  try {
    const { qr_token } = req.body;
    const payload = await qrLogin(qr_token);
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/anonymous', async (req, res) => {
  try {
    const { display_name } = req.body;
    const payload = await anonymousLogin(display_name);
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await logout(req.user.id);
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;