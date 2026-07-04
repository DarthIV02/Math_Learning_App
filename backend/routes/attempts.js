const router = require('express').Router();
const attemptService = require('../services/attemptService');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  const { problem_id, answer_given, time_spent_seconds } = req.body;
  if (!problem_id || answer_given === undefined)
    return res.status(400).json({ error: 'problem_id and answer_given are required' });
  try {
    const attempt = await attemptService.submitAttempt(req.user.id, problem_id, answer_given, time_spent_seconds);
    res.status(201).json(attempt);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const attempts = await attemptService.getAttemptsForUser(req.user.id);
    res.json(attempts);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/me/mastery', authMiddleware, async (req, res) => {
  try {
    const profile = await masteryService.getProfileForUser(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;