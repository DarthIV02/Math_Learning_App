const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth');
const progressService = require('../services/progressService');

router.post('/', authMiddleware, async (req, res) => {
  const { attempts } = req.body;

  if (!Array.isArray(attempts) || attempts.length === 0) {
    return res.status(400).json({ error: 'attempts must be a non-empty array' });
  }

  const invalid = attempts.some(
    (a) =>
      typeof a.problem_id !== 'number' ||
      typeof a.is_correct !== 'boolean' ||
      typeof a.time_spent_seconds !== 'number'
  );

  if (invalid) {
    return res.status(400).json({ error: 'Invalid attempt shape' });
  }

  try {
    const count = await progressService.saveAttempts(req.user.id, attempts);
    res.json({ saved: count });
  } catch (err) {
    console.error('Progress flush error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;