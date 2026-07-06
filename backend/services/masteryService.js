const db = require('../db');

const DEFAULT_K = 0.4; // normal gameplay learning rate

const DIMENSION_TABLES = {
  number_range: 'number_ranges',
  operation_category: 'operation_categories',
  unknown_position: 'unknown_positions',
  linguistic_complexity: 'linguistic_complexities',
  cognitive_demand: 'cognitive_demands',
  operation_count: 'operation_counts',
};

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function inverseSigmoid(p) {
  return Math.log(p / (1 - p));
}

function difficultyLogit(score) {
  return score - 2; // 1→-1 (easy), 2→0 (medium), 3→+1 (hard)
}

function clampScore(score) {
  return Math.min(3, Math.max(1, Math.round(score)));
}

async function initializeUserAbility(client, userId) {
  const dimensionTypes = [
    'number_range', 'operation_category', 'unknown_position',
    'linguistic_complexity', 'cognitive_demand', 'operation_count',
  ];

  const values = dimensionTypes.map((_, i) => `($1, $${i + 2})`).join(', ');
  await client.query(
    `INSERT INTO user_dimension_ability (user_id, category_type)
     VALUES ${values}
     ON CONFLICT DO NOTHING`,
    [userId, ...dimensionTypes]
  );
}

// Updates a single dimension's ability estimate after an attempt.
// Runs inside the caller's transaction (client).
async function updateAbility(client, userId, categoryType, isCorrect, difficultyScore, k = DEFAULT_K) {
  const difficulty = difficultyLogit(difficultyScore);

  const current = await client.query(
    `SELECT ability FROM user_dimension_ability
     WHERE user_id = $1 AND category_type = $2`,
    [userId, categoryType]
  );
  const ability = current.rows[0]?.ability ?? 0;

  const expected = sigmoid(ability - difficulty);
  const outcome = isCorrect ? 1 : 0;
  const newAbility = Number(ability) + k * (outcome - expected);

  await client.query(
    `INSERT INTO user_dimension_ability (user_id, category_type, ability, attempts_count, last_attempted_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (user_id, category_type)
     DO UPDATE SET
       ability = $3,
       attempts_count = user_dimension_ability.attempts_count + 1,
       last_attempted_at = NOW(),
       updated_at = NOW()`,
    [userId, categoryType, newAbility]
  );
}

// Raw ability rows keyed by dimension, including attempts_count —
// the shared read primitive for both the profile view and the
// target-profile/generation logic.
async function getUserAbilities(user_id) {
  const result = await db.query(
    `SELECT category_type, ability, attempts_count
     FROM user_dimension_ability WHERE user_id = $1`,
    [user_id]
  );
  return Object.fromEntries(
    result.rows.map(r => [r.category_type, { ability: Number(r.ability), attempts: r.attempts_count }])
  );
}

// Which dimensions is this user weakest in, based on current ability.
// Untouched dimensions default to neutral (0), so a brand-new user
// effectively gets a random-ish pick among ties until they've attempted anything.
function pickWeakestDimensions(abilities, n) {
  return Object.entries(DIMENSION_TABLES)
    .map(([categoryType]) => ({
      categoryType,
      ability: abilities[categoryType]?.ability ?? 0,
    }))
    .sort((a, b) => a.ability - b.ability)
    .slice(0, n)
    .map(d => d.categoryType);
}

// Overall difficulty label from average ability across *attempted*
// dimensions only — untouched dimensions shouldn't dilute a real signal.
function pickOverallDifficultyLabel(abilities) {
  const attempted = Object.values(abilities).filter(a => a.attempts > 0);
  const avgAbility = attempted.length
    ? attempted.reduce((sum, a) => sum + a.ability, 0) / attempted.length
    : 0;

  if (avgAbility < -0.5) return 'easy';
  if (avgAbility > 0.5) return 'hard';
  return 'medium';
}

async function getProfileForUser(user_id) {
  const abilityResult = await db.query(
    `SELECT category_type, ability, attempts_count, last_attempted_at
     FROM user_dimension_ability WHERE user_id = $1`,
    [user_id]
  );
  const abilityByType = Object.fromEntries(
    abilityResult.rows.map(r => [r.category_type, r])
  );

  const profile = {};

  for (const [categoryType, table] of Object.entries(DIMENSION_TABLES)) {
    const itemsResult = await db.query(`SELECT id, name, score FROM ${table} ORDER BY score`);
    const abilityRow = abilityByType[categoryType];
    const ability = abilityRow ? Number(abilityRow.ability) : 0;

    profile[categoryType] = {};
    for (const item of itemsResult.rows) {
      const difficulty = difficultyLogit(item.score);
      profile[categoryType][item.id] = {
        name: item.name,
        mastery: Number(sigmoid(ability - difficulty).toFixed(3)),
      };
    }

    profile[categoryType]._ability = ability;
    profile[categoryType]._attempts_count = abilityRow?.attempts_count ?? 0;
  }

  return profile;
}

module.exports = {
  getProfileForUser,
  initializeUserAbility,
  updateAbility,
  getUserAbilities,
  pickWeakestDimensions,
  pickOverallDifficultyLabel,
  sigmoid,
  inverseSigmoid,
  difficultyLogit,
  clampScore,
  DIMENSION_TABLES,
  DEFAULT_K,
};