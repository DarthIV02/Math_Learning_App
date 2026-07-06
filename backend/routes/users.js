const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const userService = require('../services/userService');
const targetProfileService = require('../services/targetProfileService');
const { authMiddleware } = require('../middleware/auth');

// ─────────────────────────────────────────────
// Avatar upload setup
// ─────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  },
});

// ─────────────────────────────────────────────
// QR user
// ─────────────────────────────────────────────

router.post('/qr', async (req, res) => {
  const { display_name } = req.body;

  if (!display_name) {
    return res.status(400).json({
      error: 'display_name is required',
    });
  }

  try {
    const user = await userService.createQrUser(display_name);
    res.status(201).json(user);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Upload current user's avatar
// POST /api/users/me/avatar
// ─────────────────────────────────────────────

router.post(
  '/me/avatar',
  authMiddleware,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Avatar file is required',
        });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await userService.updateAvatar(req.user.id, avatarUrl);

      res.json({ user });
    } catch (err) {
      res.status(err.status || 500).json({
        error: err.message,
      });
    }
  }
);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getCurrentUserProfile(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// List users
// ─────────────────────────────────────────────

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Current user's profile stats
// GET /api/users/me/stats
// ─────────────────────────────────────────────

router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await userService.getUserProfileStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Get user by ID
// ─────────────────────────────────────────────

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getUserWithStats(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Current user's target problem profile
// GET /api/users/me/target-profile
// ─────────────────────────────────────────────

router.get('/me/target-profile', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getCurrentUserProfile(req.user.id);
    const targetProfile = await targetProfileService.getTargetProfile(req.user.id, Number(user.grade));
      res.json(targetProfile);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});


// ─────────────────────────────────────────────
// Update user by ID
// ─────────────────────────────────────────────

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Award coins to current user
// POST /api/users/me/coins/award
// ─────────────────────────────────────────────

router.post('/me/coins/award', authMiddleware, async (req, res) => {
  const { problemId, amount } = req.body;

  if (!problemId || !amount) {
    return res.status(400).json({
      error: 'problemId and amount are required',
    });
  }

  try {
    const user = await userService.awardProblemCoins(
      req.user.id,
      problemId,
      amount
    );

    res.json({ user });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Delete user by ID
// ─────────────────────────────────────────────

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
    });
  }
});

module.exports = router;