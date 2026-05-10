const router = require('express').Router();
const problemService = require('../services/problemService');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const problems = await problemService.listProblems(req.query);
    res.json(problems);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const problem = await problemService.getProblem(req.params.id, req.query.include_tips === 'true');
    res.json(problem);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { question_text, subject_object, correct_answers } = req.body;
  if (!question_text || !subject_object || !correct_answers?.length)
    return res.status(400).json({ error: 'question_text, subject_object, and correct_answers are required' });
  try {
    const problem = await problemService.createProblem(req.body);
    res.status(201).json(problem);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const problem = await problemService.updateProblem(req.params.id, req.body);
    res.json(problem);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await problemService.deleteProblem(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;