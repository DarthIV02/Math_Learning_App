const router = require('express').Router();
const assessmentService = require('../services/assessmentService');
const { authMiddleware } = require('../middleware/auth');

router.post('/submit', authMiddleware, async (req, res) => {
  const { attempts } = req.body;
  try {
    const results = await assessmentService.submitAssessment(req.user.id, attempts);
    res.status(201).json({ results });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;