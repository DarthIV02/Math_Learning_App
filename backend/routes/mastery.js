const router = require('express').Router();
const masteryService = require('../services/masteryService');
const { authMiddleware } = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await masteryService.getProfileForUser(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;