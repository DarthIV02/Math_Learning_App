// backend/repositories/seedProblemRepository.js
//
// Persists one merged/assessed GSM8K row (deterministic fields from
// parseAnswerLayout.js + LLM fields from generate_baseline.js) into the
// `seed_problems` table -- kept separate from `problems`, which holds the
// production/localized/rewritten versions.

const pool = require("../db/pool");
const { getCache, getOperationCountRow } = require("../db/lookupCache");
const { classifyOperationCategory } = require("./parse_math_gsm8k");

/**
 * Given a list of external_ids for a given source, returns the subset that
 * already exist in seed_problems -- as a Set, for cheap `.has()` lookups.
 * One query for the whole batch/dataset, instead of a query per row.
 *
 * @param {string} source - e.g. "gsm8k"
 * @param {Array<string|number>} externalIds
 * @returns {Promise<Set<string>>}
 */
async function getExistingExternalIds(source, externalIds) {
  if (!externalIds || externalIds.length === 0) return new Set();

  const stringIds = externalIds.map((id) => String(id));
  const res = await pool.query(
    `SELECT external_id FROM seed_problems WHERE source = $1 AND external_id = ANY($2)`,
    [source, stringIds]
  );

  return new Set(res.rows.map((r) => r.external_id));
}

/**
 * @param {object} merged - one entry from loadGSM8K.js's `merged` array, e.g.:
 *   {
 *     question, answer,
 *     final_result, number_of_steps, operations_used, number_range, steps,
 *     topic, primary_unit, extracted_variables,
 *     unknown_position, language_complexity, cognitive_demand,
 *   }
 * @param {number} grade - 3 or 4 or null
 * @param {object} [options]
 * @param {string} [options.source="gsm8k"]
 * @param {string|number} [options.externalId] - e.g. the dataset's row_idx, for de-duping re-imports
 * @returns {Promise<number|null>} the new seed_problems.id, or null if it already existed
 */
async function saveSeedProblem(merged, grade, options = {}) {
  const { source = "gsm8k", externalId = null } = options;
  const cache = getCache();

  const operationCategoryName = classifyOperationCategory(merged.operations_used);

  const numberRangeRow = cache.numberRangesByName[merged.number_range];
  if (!numberRangeRow) {
    throw new Error(`No number_ranges row for name="${merged.number_range}"`);
  }

  const operationCategoryRow = cache.operationCategories[operationCategoryName];
  if (!operationCategoryRow) {
    throw new Error(`No operation_categories row for name="${operationCategoryName}"`);
  }

  const unknownPositionRow = cache.unknownPositions[merged.unknown_position];
  if (!unknownPositionRow) {
    throw new Error(`No unknown_positions row for name="${merged.unknown_position}"`);
  }

  const linguisticComplexityRow = cache.linguisticComplexities[merged.language_complexity];
  if (!linguisticComplexityRow) {
    throw new Error(`No linguistic_complexities row for name="${merged.language_complexity}"`);
  }

  const cognitiveDemandRow = cache.cognitiveDemands[merged.cognitive_demand];
  if (!cognitiveDemandRow) {
    throw new Error(`No cognitive_demands row for name="${merged.cognitive_demand}"`);
  }

  const operationCountRow = getOperationCountRow(merged.number_of_steps);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertRes = await client.query(
      `INSERT INTO seed_problems (
         source,
         external_id,
         grade,
         question_text,
         answer_text,
         correct_answers,
         topic,
         primary_unit,
         extracted_variables,
         number_range_id,
         operation_category_id,
         unknown_position_id,
         linguistic_complexity_id,
         cognitive_demand_id,
         operation_count_id,
         ai_full_return
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (source, external_id) DO NOTHING
       RETURNING id`,
      [
        source,
        externalId !== null ? String(externalId) : null,
        grade,
        merged.question,
        merged.answer,
        JSON.stringify({ value: merged.final_result }),
        merged.topic,
        merged.primary_unit,
        JSON.stringify(merged.extracted_variables || []),
        numberRangeRow.id,
        operationCategoryRow.id,
        unknownPositionRow.id,
        linguisticComplexityRow.id,
        cognitiveDemandRow.id,
        operationCountRow.id,
        JSON.stringify(merged),
      ]
    );

    // ON CONFLICT DO NOTHING means a re-import of an already-seen row
    // returns no rows -- treat that as "already saved", not an error.
    // (Kept as a safety net even though loadGSM8K.js now filters known
    // external_ids out before this is ever called.)
    if (insertRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const seedProblemId = insertRes.rows[0].id;

    for (const opName of merged.operations_used || []) {
      const opRow = cache.operations[opName];
      if (!opRow) continue; // defensive: skip an operation name that isn't seeded
      await client.query(
        `INSERT INTO seed_problem_operations (seed_problem_id, operation_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [seedProblemId, opRow.id]
      );
    }

    await client.query("COMMIT");
    return seedProblemId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { saveSeedProblem, getExistingExternalIds };