const router = require('express').Router();
const problemService = require('../services/problemService');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const problems = await problemService.listProblems({
      operation: req.query.operation,
      theme: req.query.theme,
      difficulty_label: req.query.difficulty,
      grade: req.query.grade,
      limit: req.query.limit ?? 7,
      user_id: req.user.id,
      unsolvedOnly: req.query.unsolvedOnly === 'true',
      is_assessment: req.query.is_assessment === 'true',

      number_range: req.query.number_range ?? null,
      operation_category: req.query.operation_category ?? null, // fixed param name
      unknown_position: req.query.unknown_position ?? null,
      linguistic_complexity: req.query.linguistic_complexity ?? null,
      cognitive_demand: req.query.cognitive_demand ?? null,
    });
    res.json(problems);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/generation-status', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.query;
    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }
    const status = await problemService.getGenerationStatus(requestId, req.user.id);
    res.json(status);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/assessment', authMiddleware, async (req, res) => {
  try {
    const { grade } = req.query;
    const problems = await problemService.getAssessmentProblems(grade);
    res.json(problems);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const problem = await problemService.getProblemsByIds([req.params.id], req.query.include_tips === 'true');
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