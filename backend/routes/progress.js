const router = require('express').Router();
const progressService = require('../services/progressService');
const { authMiddleware } = require('../middleware/auth');

// sendBeacon can't set an Authorization header, so the client embeds the
// token in the body instead. Promote it to a header before authMiddleware runs.
function resolveAuth(req, res, next) {
  if (!req.headers.authorization && req.body?.token) {
    req.headers.authorization = `Bearer ${req.body.token}`;
  }
  next();
}

router.post('/', resolveAuth, authMiddleware, async (req, res) => {
  const { attempts } = req.body;
  if (!Array.isArray(attempts) || !attempts.length) {
    return res.status(400).json({ error: 'attempts array is required' });
  }
  try {
    const results = await progressService.submitAttempts(req.user.id, attempts);
    res.status(201).json({ results });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;