// backend/utils/prompts_LLM/parseAnswerLayout.js
//
// Deterministically extracts everything that does NOT require language
// understanding from a GSM8K-style worked solution, e.g.:
//
//   Question: Natalia sold clips to 48 of her friends in April, and then
//   she sold half as many clips in May. How many clips did Natalia sell
//   altogether in April and May?
//   Answer Layout:
//   Natalia sold 48/2 = <<48/2=24>>24 clips in May.
//   Natalia sold 48+24 = <<48+24=72>>72 clips altogether in April and May.
//   #### 72
//
// This covers: final_result, baseline_complexity.mathematical
// (number_of_steps, operations_used), and number_range.
// It intentionally does NOT attempt topic / primary_unit / extracted_variables
// naming — those require reading the prose and should stay with the LLM.

const OP_NAME = {
  "+": "addition",
  "-": "subtraction",
  "*": "multiplication",
  "/": "division",
};

// Mirrors:
// INSERT INTO unknown_positions (name, difficulty_label, score)
// VALUES
// ('result_unknown', 'easy', 1),
// ('change_unknown', 'medium', 2),
// ('start_unknown', 'hard', 3);
const UNKNOWN_POSITION_DIFFICULTY = {
  result_unknown: { difficulty_label: "easy", score: 1 },
  change_unknown: { difficulty_label: "medium", score: 2 },
  start_unknown: { difficulty_label: "hard", score: 3 },
};

/**
 * Deterministically maps an LLM-classified unknown_position to its
 * difficulty_label and score, per the unknown_positions lookup table.
 * No LLM call needed for this -- it's a fixed 1:1 mapping.
 *
 * @param {string} unknownPosition - "result_unknown" | "change_unknown" | "start_unknown"
 * @returns {{ difficulty_label: string, score: number } | null}
 */
function getUnknownPositionDifficulty(unknownPosition) {
  return UNKNOWN_POSITION_DIFFICULTY[unknownPosition] || null;
}

/**
 * Deterministically classifies which operation_category a set of operations
 * falls into, matching the operation_categories lookup table. No LLM needed --
 * it's a pure function of which operation names were used.
 *
 * @param {string[]} operationsUsed - e.g. ["division", "addition"]
 * @returns {"addition_subtraction"|"multiplication_division"|"mixed_operations"}
 */
function classifyOperationCategory(operationsUsed) {
  const additive = new Set(["addition", "subtraction"]);
  const multiplicative = new Set(["multiplication", "division"]);

  const hasAdditive = (operationsUsed || []).some((op) => additive.has(op));
  const hasMultiplicative = (operationsUsed || []).some((op) => multiplicative.has(op));

  if (hasAdditive && hasMultiplicative) return "mixed_operations";
  if (hasMultiplicative) return "multiplication_division";
  return "addition_subtraction";
}

const NUMBER_RANGE_BUCKETS = [
  { max: 100, label: "1-100" },
  { max: 500, label: "100-500" },
  { max: 1000, label: "500-1000" },
  { max: Infinity, label: "1000-10000" },
];

function classifyNumberRange(maxNumber) {
  const bucket = NUMBER_RANGE_BUCKETS.find((b) => maxNumber <= b.max);
  return bucket ? bucket.label : "1000-10000";
}

function parseNumber(raw) {
  if (raw === undefined || raw === null) return NaN;
  return parseFloat(String(raw).replace(/,/g, "").trim());
}

/**
 * Parses a single problem's answer layout text (the part containing
 * <<expr=result>> annotations and a trailing #### line).
 *
 * @param {string} answerLayoutText
 * @returns {{
 *   final_result: number|null,
 *   baseline_complexity: { mathematical: { number_of_steps: number, operations_used: string[] } },
 *   number_range: string,
 *   steps: { expr: string, result: number }[],
 * }}
 */
function parseAnswerLayout(answerLayoutText) {
  if (!answerLayoutText || typeof answerLayoutText !== "string") {
    return {
      final_result: null,
      baseline_complexity: { mathematical: { number_of_steps: 0, operations_used: [] } },
      number_range: null,
      steps: [],
    };
  }

  const calcRegex = /<<([^=<>]+)=([^<>]+)>>/g;
  const steps = [];
  let match;

  while ((match = calcRegex.exec(answerLayoutText)) !== null) {
    const expr = match[1].trim();
    const result = parseNumber(match[2]);
    steps.push({ expr, result });
  }

  const finalMatch = answerLayoutText.match(/####\s*([\-\d.,]+)/);
  const final_result = finalMatch
    ? parseNumber(finalMatch[1])
    : steps.length
    ? steps[steps.length - 1].result
    : null;

  const operationsUsedInOrder = [];
  const seenOps = new Set();
  let number_of_steps = 0;
  const allNumbers = [];

  for (const { expr, result } of steps) {
    const opsInExpr = expr.match(/[+\-*/]/g) || [];
    number_of_steps += opsInExpr.length;

    for (const op of opsInExpr) {
      const name = OP_NAME[op];
      if (name && !seenOps.has(name)) {
        seenOps.add(name);
        operationsUsedInOrder.push(name);
      }
    }

    const numsInExpr = expr.match(/\d+(\.\d+)?/g) || [];
    for (const n of numsInExpr) allNumbers.push(parseNumber(n));
    if (!Number.isNaN(result)) allNumbers.push(result);
  }

  if (final_result !== null && !Number.isNaN(final_result)) {
    allNumbers.push(final_result);
  }

  const maxNumber = allNumbers.length ? Math.max(...allNumbers) : 0;
  const number_range = classifyNumberRange(maxNumber);

  return {
    final_result: Number.isNaN(final_result) ? null : final_result,
    number_of_steps,
    operations_used: operationsUsedInOrder,
    number_range,
    steps,
  };
}

/**
 * Convenience batch helper: given an array of problems, each with an
 * `answer_layout` (or `full_problem_text` containing the annotations),
 * returns the deterministic fields for each, in the same order.
 *
 * @param {Array<{answer_layout?: string, full_problem_text?: string}>} problems
 */
function parseAnswerLayoutBatch(problems) {
  return problems.map((p) =>
    parseAnswerLayout(p.answer || p.question || "")
  );
}

module.exports = {
  parseAnswerLayout,
  parseAnswerLayoutBatch,
  classifyNumberRange,
  classifyOperationCategory,
  getUnknownPositionDifficulty,
  UNKNOWN_POSITION_DIFFICULTY,
};