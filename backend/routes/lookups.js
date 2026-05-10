const router = require('express').Router();
const taxonomy = require('../services/taxonomyService');
const { authMiddleware } = require('../middleware/auth');

function crudRoutes(table, extraFields = []) {
  return [
    async (req, res, next) => {
      if (req.method === 'GET' && !req.params.id) {
        try { res.json(await taxonomy.list(table)); }
        catch (err) { res.status(500).json({ error: err.message }); }
      } else next();
    }
  ];
}

// ── Operations ──────────────────────────────────────────
router.get('/operations', async (req, res) => {
  try { res.json(await taxonomy.list('operations')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/operations', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try { res.status(201).json(await taxonomy.create('operations', { name })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/operations/:id', authMiddleware, async (req, res) => {
  try { await taxonomy.remove('operations', req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Themes ───────────────────────────────────────────────
router.get('/themes', async (req, res) => {
  try { res.json(await taxonomy.list('themes')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/themes', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try { res.status(201).json(await taxonomy.create('themes', { name })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/themes/:id', authMiddleware, async (req, res) => {
  try { await taxonomy.remove('themes', req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Objects ──────────────────────────────────────────────
router.get('/objects', async (req, res) => {
  try { res.json(await taxonomy.list('objects')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/objects', authMiddleware, async (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try { res.status(201).json(await taxonomy.create('objects', { name, icon: icon ?? null })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/objects/:id', authMiddleware, async (req, res) => {
  try { await taxonomy.remove('objects', req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;