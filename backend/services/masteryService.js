const db = require('../db');

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

function difficultyLogit(score) {
  return score - 2; // 1→-1 (easy), 2→0 (medium), 3→+1 (hard)
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

module.exports = { getProfileForUser, initializeUserAbility, DIMENSION_TABLES };