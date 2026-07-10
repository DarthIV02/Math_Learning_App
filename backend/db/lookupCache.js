// backend/db/lookupCache.js
//
// Loads all the small lookup tables (operations, number_ranges,
// operation_categories, unknown_positions, linguistic_complexities,
// cognitive_demands, operation_counts) into memory once, so saving 100s of
// problems doesn't mean 100s of extra round-trip SELECTs per problem.

const db = require("./pool");

let cache = null;

function indexBy(rows, key) {
  const map = {};
  for (const row of rows) map[row[key]] = row;
  return map;
}

/**
 * Like indexBy, but keeps the FIRST row seen per key instead of the last --
 * used for lookups where multiple rows can share a name (e.g. number_ranges
 * has the same name across grade 3 and grade 4) and there's no grade to
 * disambiguate with.
 */
function indexByFirst(rows, key) {
  const map = {};
  for (const row of rows) {
    if (!(row[key] in map)) map[row[key]] = row;
  }
  return map;
}

function groupByGradeAndName(rows) {
  const map = {};
  for (const row of rows) {
    if (!map[row.grade]) map[row.grade] = {};
    map[row.grade][row.name] = row;
  }
  return map;
}

async function loadLookupCache() {
  const [
    operationsRes,
    numberRangesRes,
    operationCategoriesRes,
    unknownPositionsRes,
    linguisticComplexitiesRes,
    cognitiveDemandsRes,
    operationCountsRes,
  ] = await Promise.all([
    db.query("SELECT id, name FROM operations"),
    db.query("SELECT id, name, grade, min_value, max_value, score FROM number_ranges ORDER BY id"),
    db.query("SELECT id, name, difficulty_label, score FROM operation_categories"),
    db.query("SELECT id, name, difficulty_label, score FROM unknown_positions"),
    db.query("SELECT id, name, difficulty_label, score FROM linguistic_complexities"),
    db.query("SELECT id, name, difficulty_label, score FROM cognitive_demands"),
    db.query("SELECT id, num_operations, difficulty_label, score FROM operation_counts ORDER BY num_operations"),
  ]);

  cache = {
    operations: indexBy(operationsRes.rows, "name"),
    numberRangesByGrade: groupByGradeAndName(numberRangesRes.rows),
    numberRangesByName: indexByFirst(numberRangesRes.rows, "name"), // grade-agnostic: first matching row by id order
    operationCategories: indexBy(operationCategoriesRes.rows, "name"),
    unknownPositions: indexBy(unknownPositionsRes.rows, "name"),
    linguisticComplexities: indexBy(linguisticComplexitiesRes.rows, "name"),
    cognitiveDemands: indexBy(cognitiveDemandsRes.rows, "name"),
    operationCounts: operationCountsRes.rows, // kept sorted by num_operations
  };

  return cache;
}

function getCache() {
  if (!cache) {
    throw new Error("Lookup cache not loaded. Call loadLookupCache() before using getCache()/getOperationCountRow().");
  }
  return cache;
}

/**
 * Finds the operation_counts row for a given step count. If the exact count
 * isn't seeded (e.g. a problem needs 7 steps but only 1-5 are seeded), it
 * clamps down to the highest seeded tier at or below that count, so saving
 * never fails just because a rare step count wasn't pre-seeded.
 */
function getOperationCountRow(numOperations) {
  const rows = getCache().operationCounts;
  const exact = rows.find((r) => r.num_operations === numOperations);
  if (exact) return exact;

  const below = rows.filter((r) => r.num_operations < numOperations);
  if (below.length) return below[below.length - 1];

  return rows[0]; // numOperations is below every seeded tier (e.g. 0) -- fall back to the lowest
}

module.exports = {
  loadLookupCache,
  getCache,
  getOperationCountRow,
};