// services/target_profile_service.js
const db = require('../db');
const {
  DIMENSION_TABLES,
  getUserAbilities,
  pickWeakestDimensions,
  pickOverallDifficultyLabel,
  inverseSigmoid,
  clampScore,
} = require('./masteryService');

const TARGET_SUCCESS_PROB = 0.65;
const WEAK_DIMENSION_COUNT = 2;
const LABEL_TO_SCORE = { easy: 1, medium: 2, hard: 3 };

// Topic is theme XOR operation — never both, never neither (barring empty tables).
async function pickTopic(grade) {
  const useOperationMode = Math.random() < 0.5;
  if (useOperationMode) {
    const operationTopic = await pickOperationTopic();
    if (operationTopic) return operationTopic;
    // fall through if no operations are configured, or the chosen one
    // has no linked operation_categories
  }
  return pickThemeTopic();
}

// pickTopic and its helpers — only pickThemeTopic/pickOperationTopic change

async function pickThemeTopic() {
  const result = await db.query(`SELECT id, name FROM themes WHERE name NOT LIKE '%other%' ORDER BY RANDOM() LIMIT 1`);
  const theme = result.rows[0];
  return {
    mode: 'theme',
    theme_id: theme?.id ?? null,
    theme_name: theme?.name ?? null,
    operation_id: null,
    operation_name: null,
    allowedOperationCategoryIds: null,
  };
}

async function pickOperationTopic() {
  const opResult = await db.query(
    `SELECT id, name FROM operations ORDER BY RANDOM() LIMIT 1`
    );
  const operation = opResult.rows[0];
  if (!operation) return null;

  const catResult = await db.query(
    `SELECT operation_category_id FROM operation_category_operations WHERE operation_id = $1`,
    [operation.id]
  );
  const allowedOperationCategoryIds = catResult.rows.map(r => r.operation_category_id);
  if (!allowedOperationCategoryIds.length) return null;

  return {
    mode: 'operation',
    theme_id: null,
    theme_name: null,
    operation_id: operation.id,
    operation_name: operation.name,
    allowedOperationCategoryIds,
  };
}

// Generic: best-matching row in a dimension table for a desired score,
// optionally restricted to a set of ids (used for operation-constrained
// operation_category picks) and/or a grade (number_ranges only).
async function pickDimensionRowByScore(table, desiredScore, { grade = null, idFilter = null } = {}) {
  const isGradeScoped = table === 'number_ranges';
  const conditions = [];
  const params = [];

  if (isGradeScoped) {
    conditions.push(`grade = $${params.length + 1}`);
    params.push(grade);
  }
  if (idFilter) {
    conditions.push(`id = ANY($${params.length + 1}::int[])`);
    params.push(idFilter);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = (await db.query(`SELECT id, score, name FROM ${table} ${whereClause}`, params)).rows;
  if (!rows.length) return null; // constraint matched nothing (e.g. bad idFilter)

  rows.sort((a, b) => Math.abs(a.score - desiredScore) - Math.abs(b.score - desiredScore));
  const bestDistance = Math.abs(rows[0].score - desiredScore);
  const ties = rows.filter(r => Math.abs(r.score - desiredScore) === bestDistance);

  const pick = ties[Math.floor(Math.random() * Math.min(ties.length, 3))];
  return { id: pick.id, score: pick.score, name: pick.name };
}

async function getBaselineProfile(grade, difficultyLabel, allowedOperationCategoryIds) {
  const params = [grade, difficultyLabel];
  let query = `SELECT * FROM difficulty_profiles WHERE grade = $1 AND difficulty_label = $2`;

  if (allowedOperationCategoryIds) {
    query += ` AND operation_category_id = ANY($3::int[])`;
    params.push(allowedOperationCategoryIds);
  }
  query += ` ORDER BY RANDOM() LIMIT 1`;

  let result = await db.query(query, params);

  if (!result.rows.length && allowedOperationCategoryIds) {
    // no preset combo matches this exact operation — fall back to any
    // preset at this label, then override operation_category_id below
    result = await db.query(
      `SELECT * FROM difficulty_profiles WHERE grade = $1 AND difficulty_label = $2
       ORDER BY RANDOM() LIMIT 1`,
      [grade, difficultyLabel]
    );
  }

  if (!result.rows.length) {
    const err = new Error(`No difficulty_profile configured for grade ${grade}/${difficultyLabel}`);
    err.status = 500;
    throw err;
  }
  return result.rows[0];
}

async function getTargetProfile(user_id, grade) {
  const abilities = await getUserAbilities(user_id);
  const difficultyLabel = pickOverallDifficultyLabel(abilities);
  const weakDimensions = pickWeakestDimensions(abilities, WEAK_DIMENSION_COUNT);
  const topic = await pickTopic(grade);

  const baseline = await getBaselineProfile(
    grade,
    difficultyLabel,
    topic.mode === 'operation' ? topic.allowedOperationCategoryIds : null
  );

  if (topic.mode === 'operation' && !topic.allowedOperationCategoryIds.includes(baseline.operation_category_id)) {
    const fixed = await pickDimensionRowByScore(
      'operation_categories',
      LABEL_TO_SCORE[difficultyLabel],
      { idFilter: topic.allowedOperationCategoryIds }
    );
    if (fixed) baseline.operation_category_id = fixed.id;
  }

  const dimensionIds = {};

  for (const [categoryType, table] of Object.entries(DIMENSION_TABLES)) {
    const idKey = `${categoryType}_id`;
    const idFilter = categoryType === 'operation_category' && topic.mode === 'operation'
      ? topic.allowedOperationCategoryIds
      : null;

    if (weakDimensions.includes(categoryType) || categoryType === 'operation_category') {
      const targetScore = clampScore(
        (abilities[categoryType]?.ability ?? 0) - inverseSigmoid(TARGET_SUCCESS_PROB) + 2
      );
      const picked = await pickDimensionRowByScore(table, targetScore, { grade, idFilter });
      dimensionIds[idKey] = picked ? picked.id : baseline[idKey];
      dimensionIds[categoryType] = picked ? picked.name : baseline[categoryType];
    }
  }

  return {
    theme_id: topic.theme_id,
    theme: topic.theme_name,
    operation_id: topic.operation_id,
    operation: topic.operation_name,
    grade,
    ...dimensionIds,
    difficulty: difficultyLabel,
    targeted_dimensions: weakDimensions,
  };
}

module.exports = { getTargetProfile, TARGET_SUCCESS_PROB, WEAK_DIMENSION_COUNT };