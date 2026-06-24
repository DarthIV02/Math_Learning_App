// backend/utils/prompts_LLM/fix_problem_from_evaluation_prompt.js

function formatExpectedActual(check) {
  return `Expected: ${check.expected}
Actual: ${check.actual}`;
}

function normalizeComparisons(comparison) {
  if (Array.isArray(comparison)) {
    return comparison;
  }

  if (Array.isArray(comparison?.evaluations)) {
    return comparison.evaluations;
  }

  if (comparison && typeof comparison === "object") {
    return [comparison];
  }

  return [];
}

function buildUnknownPositionRepairRule(comparison) {
  const match = comparison.matching?.unknown_position;
  const mismatch = comparison.not_matching?.unknown_position;

  if (match) {
    return `
UNKNOWN POSITION:
- This refers to what the question is asking for.
- The unknown_position is correct: ${match.actual}.
- Do NOT change what the final question is asking for.
- Keep the same unknown structure.
`;
  }

  if (mismatch) {
    let definition = "";

if (mismatch.expected === "change_unknown") {
  definition = `
- The problem should ask for a missing change, missing part, spent amount, added amount, removed amount, missing distance, missing group count, or missing divisor.
- The unknown must be the missing quantity inside the equation, not just the final result.
- Preserve the intended operation_category and operation_count.
- If the problem is a one-operation division problem, change_unknown should usually ask for the missing number of groups or missing divisor.

Valid one-operation division change_unknown example:
- "Es gibt 48 Springseile. Jede Gruppe bekommt 6 Springseile. Wie viele Gruppen erhalten Springseile?"
- Equation: 48 / ? = 6

Do NOT change it into a leftover/remainder question if operation_count is 1.
Bad:
- "Wie viele Springseile bleiben übrig?"
- This creates or suggests subtraction/remainder, not the intended division unknown.

Examples but do not restrict to these:
  - Wie viele Gruppen erhalten Springseile?
  - Wie viele Kinder bekommen jeweils 4 Bücher?
  - Wie viele fehlen noch?
  - Wie viel kam dazu?
  - Wie viele wurden weggenommen?
`;
} else if (mismatch.expected === "start_unknown") {
      definition = `
- The problem should ask for the starting amount.
- The story may need to mention the final amount and the change.
- Examples but do not restrict to these:
  - Wie viel Geld hatte er zuerst?
  - Wie viele waren am Anfang da?
  - Wie lang war die Strecke ursprünglich?
`;
    } else if (mismatch.expected === "result_unknown") {
      definition = `
- The problem should ask for the final result.
- Examples but do not restrict to these:
  - Wie viel bleibt übrig?
  - Wie viele sind es insgesamt?
  - Wie lang ist die Strecke zusammen?
`;
    }

    return `
UNKNOWN POSITION:
- This refers to what the question is asking for.
- The problem asks for the wrong thing.

${definition}

- The unknown_position is wrong.
${formatExpectedActual(mismatch)}

- Rewrite the final question so the main unknown matches ${mismatch.expected}.
- Preserve the intended operation_category and operation_count.
- Do not change a one-operation division problem into a leftover or remainder question.
- Make the smallest possible change.
`;
  }

  return "";
}

function buildNumberRangeRepairRule(comparison) {
  const match = comparison.matching?.number_range;
  const mismatch = comparison.not_matching?.number_range;

  if (match) {
    return `
NUMBER RANGE:
- The number_range is correct: ${match.actual}.
- Do NOT change existing relevant values unless necessary to fix another failed criterion.
- Any new or changed relevant number, including intermediate results, must stay inside this range.
`;
  }

  if (mismatch) {
    return `
NUMBER RANGE:
- The number_range is wrong.
${formatExpectedActual(mismatch)}
- Adjust the relevant values so the largest relevant number and ANY NECESSARY intermediate results fit ${mismatch.expected}.
- Make the smallest possible numerical changes.
`;
  }

  return "";
}

const LINGUISTIC_COMPLEXITY_REQUIREMENTS = {
  simple_direct_sentence: `
- The fixed problem must be compact and natural.
- Use one short context sentence to explain what is happening.
- Then use one clear sentence that contains all relevant mathematical quantities.
- Keep the relationship direct and easy to see.
- Do not include irrelevant information.
- Do not include equations or intermediate results in the text.
`,

  two_short_sentences: `
- The fixed problem must be compact and natural.
- Use two short story sentences before the question.
- Split the relevant mathematical information across the two sentences.
- The pupil should combine information from both sentences to solve the problem.
- Keep the relationship between the quantities obvious.
- Do not include irrelevant information.
- Do not include equations or intermediate results in the text.
`,

  clear_relationship: `
- The fixed problem must be a clear story where the relationship between quantities is understood from the wording.
- The relevant quantities may appear across two or three sentences.
- Do not make the operation as direct as a simple "gets more" or "takes away" sentence.
- Keep the story understandable for the grade level.
- Do not include irrelevant information.
- Do not include equations or intermediate results in the text.
`,

  longer_irrelevant_text: `
- The fixed problem must be a slightly longer story before the question.
- Include one or two realistic details that are not needed for solving.
- The relevant mathematical information should still be easy to find.
- The pupil should identify which information is needed and which is extra.
- Do not include equations or intermediate results in the text.
`
};

const LINGUISTIC_COMPLEXITY_PROBLEMS = {
  simple_direct_sentence: `
- The current problem was classified as simple_direct_sentence.
- This means it is too direct or too compact for the intended linguistic complexity.
- It likely presents the mathematical information too clearly in one place.
`,

  two_short_sentences: `
- The current problem was classified as two_short_sentences.
- This means the relevant information is split across two short sentences with an obvious relationship.
- It may be too clean, too short, or not indirect enough for the intended category.
`,

  clear_relationship: `
- The current problem was classified as clear_relationship.
- This means the relationship must be understood from wording, but there is no irrelevant information.
- It may be too indirect for simpler categories or not long/irrelevant enough for longer_irrelevant_text.
`,

  longer_irrelevant_text: `
- The current problem was classified as longer_irrelevant_text.
- This means it contains realistic but irrelevant information.
- It may be too long, overloaded, or require filtering extra details.
`
};

function buildLinguisticComplexityRepairRule(comparison) {
  const mismatch = comparison.not_matching?.linguistic_complexity;
  const match = comparison.matching?.linguistic_complexity;

  if (match) {
    return `
LINGUISTIC COMPLEXITY:
- The linguistic_complexity is correct: ${match.actual}.
- Preserve the current wording structure as much as possible.
`;
  }

  if (!mismatch) return "";

  const expectedRequirements =
    LINGUISTIC_COMPLEXITY_REQUIREMENTS[mismatch.expected] || "";

  const currentProblem =
    LINGUISTIC_COMPLEXITY_PROBLEMS[mismatch.actual] || "";

  return `
LINGUISTIC COMPLEXITY:
- The linguistic_complexity is wrong.
${formatExpectedActual(mismatch)}

What is currently wrong:
${currentProblem}

What the fixed problem needs:
${expectedRequirements}

Repair instruction:
- Rewrite the problem so it matches ${mismatch.expected}.
- Fix only the wording structure needed for linguistic complexity.
- Do not change the mathematical structure unless another failed criterion requires it.
- Remove or add text only as needed.
- Keep the problem as close as possible to the original.
`;
}

const COGNITIVE_DEMAND_REQUIREMENTS = {
  direct_operation_mapping: `
- The fixed problem should require one direct operation.
- All quantities should be stated explicitly.
- The required operation should be immediately recognizable.
- Avoid hidden quantities.
- Avoid nested structures.
- Avoid dependency chains between quantities.
`,

  sequential_planning: `
- The fixed problem should require two or more operations.
- The events should happen in a clear chronological order.
- Each operation should naturally follow from the previous one.
- The pupil should solve the problem step by step.
- Avoid hidden quantities.
`,

  constructing_hidden_quantities: `
- The fixed problem should require constructing an intermediate quantity before answering the final question.
- The intermediate quantity should not be directly stated.
- The pupil must first combine or derive information before solving the actual question.
- The hidden quantity should be naturally embedded in the story.
`,

  managing_hierarchical_structure: `
- The fixed problem should contain quantities nested inside other quantities.
- Use clear hierarchical structures such as:
  - shelves containing boxes
  - boxes containing items
  - teams containing children
  - bags containing objects
  - rows containing seats
- The hierarchy should be necessary for solving the problem.
`,

  tracking_relational_dependencies: `
- At least one quantity should be defined through another quantity.
- Use relationships such as:
  - more than
  - fewer than
  - twice as many
  - half as many
  - a multiple of
- The pupil must track these relationships to determine the required quantities.
- The dependency chain should remain understandable for the grade level.
`
};

const COGNITIVE_DEMAND_PROBLEMS = {
  direct_operation_mapping: `
- The current problem was classified as direct_operation_mapping.
- This means it is too direct or too simple for the intended reasoning demand.
- It likely uses one immediately recognizable operation with explicit quantities.
`,

  sequential_planning: `
- The current problem was classified as sequential_planning.
- This means it requires multiple steps in a clear chronological order.
- It may lack hidden quantities, nested structures, or relational dependencies.
`,

  constructing_hidden_quantities: `
- The current problem was classified as constructing_hidden_quantities.
- This means an intermediate quantity must be derived before answering.
- It may not contain the intended hierarchy or relational dependency.
`,

  managing_hierarchical_structure: `
- The current problem was classified as managing_hierarchical_structure.
- This means the solution depends on nested quantities, such as bags containing packets containing objects.
- It may be too hierarchical if another reasoning type was intended.
`,

  tracking_relational_dependencies: `
- The current problem was classified as tracking_relational_dependencies.
- This means at least one quantity is defined through another quantity.
- It may rely too much on relationships such as more than, fewer than, twice as many, or half as many.
`
};

function buildCognitiveDemandRepairRule(comparison) {
  const mismatch = comparison.not_matching?.cognitive_demand;
  const match = comparison.matching?.cognitive_demand;

  if (match) {
    return `
COGNITIVE DEMAND:
- The cognitive_demand is correct: ${match.actual}.
- Preserve the reasoning structure.
`;
  }

  if (!mismatch) return "";

  const expectedRequirements =
    COGNITIVE_DEMAND_REQUIREMENTS[mismatch.expected] || "";

  const currentProblem =
    COGNITIVE_DEMAND_PROBLEMS[mismatch.actual] || "";

  return `
COGNITIVE DEMAND:
- The cognitive_demand is wrong.
${formatExpectedActual(mismatch)}

What is currently wrong:
${currentProblem}

What the fixed problem needs:
${expectedRequirements}

Repair instruction:
- Rewrite the problem so the reasoning structure matches ${mismatch.expected}.
- Fix only the reasoning structure needed for cognitive demand.
- Do not change the final unknown unless unknown_position is also wrong.
- Do not change the number range unless number_range is also wrong or a new required value is needed.
- Coordinate this with operation_category and operation_count if they also failed.
- Keep the problem as close as possible to the original.
`;
}

function buildOperationCategoryRepairRule(comparison) {
  const mismatch = comparison.not_matching?.operation_category;
  const match = comparison.matching?.operation_category;

  if (match) {
    return `
OPERATION CATEGORY:
- The operation_category is correct: ${match.actual}.
- Preserve the mathematical operation family.
`;
  }

  if (!mismatch) return "";

  return `
OPERATION CATEGORY:
- The operation_category is wrong.
${formatExpectedActual(mismatch)}

Repair instruction:
- Modify the mathematical relationship so it matches ${mismatch.expected}.
- If expected is mixed_operations, the solution must combine an operation (addition/subtraction) with another from (multiplication/division). At least 1 from each group.
- Do not change the final unknown unless unknown_position is also wrong.
`;
}

function buildOperationCountRepairRule(comparison) {
  const mismatch = comparison.not_matching?.operation_count;
  const match = comparison.matching?.operation_count;

  if (match) {
    return `
OPERATION COUNT:
- The operation_count is correct: ${match.actual}.
- Preserve the number of required operations.
`;
  }

  if (!mismatch) return "";

  return `
OPERATION COUNT:
- The operation_count is wrong.
${formatExpectedActual(mismatch)}

Repair instruction:
- Add or remove mathematically necessary values so the problem requires exactly ${mismatch.expected} simple operations.
- Coordinate this with the expected operation_category.
- Do not add unnecessary irrelevant information just to increase operation count.
`;
}

function buildValidityRepairRules(comparison) {
  const checks = comparison.validity_checks || {};
  let rules = "";

  if (checks.grade_appropriate && !checks.grade_appropriate.passed) {
    rules += `
GRADE APPROPRIATENESS:
- The problem was flagged as not grade-appropriate.
- Reason: ${checks.grade_appropriate.actual?.reason || "No reason provided."}
- Simplify wording, reduce overload, and make the story suitable for the target grade.
`;
  }

  if (checks.has_all_required_numbers && !checks.has_all_required_numbers.passed) {
    rules += `
REQUIRED NUMBERS:
- The problem does not contain all numbers needed to compute the answer.
- Reason: ${checks.has_all_required_numbers.reason}
- Add the missing required number with the smallest possible change.
`;
  }

  if (checks.equation_has_one_unknown && !checks.equation_has_one_unknown.passed) {
    rules += `
UNKNOWN SYMBOL CHECK:
- The equation should contain exactly one unknown.
- Current equation: ${checks.equation_has_one_unknown.equation}
- Fix the problem so there is exactly one final unknown.
`;
  }

  if (
    checks.equation_operation_count_matches &&
    !checks.equation_operation_count_matches.passed
  ) {
    rules += `
EQUATION OPERATION COUNT CHECK:
- The equation operation count does not match the evaluated operation_count.
- Current equation: ${checks.equation_operation_count_matches.equation}
- Fix the mathematical structure so the equation and operation_count agree.
`;
  }

  return rules;
}

function buildGrade3MultiplicationDivisionRepairRule(grade, comparison) {
  if (Number(grade) !== 3) {
    return "";
  }

  const checks = comparison.validity_checks || {};
  const grade3Check = checks.grade_3_multiplication_division_valid;

  if (grade3Check && grade3Check.passed) {
    return `
GRADE 3 MULTIPLICATION/DIVISION:
- The multiplication/division facts are valid for Grade 3.
- Preserve this.
`;
  }

  return `
GRADE 3 MULTIPLICATION/DIVISION:

- Grade 3 multiplication and division must come from the basic multiplication tables.
- Every multiplication fact must use factors between 2 and 10.
- Every division fact must correspond to a multiplication-table fact between 2 × 2 and 10 × 10.

MONEY VALUES:
- If money values are causing the violation, remove decimals and rewrite the values as whole cents.
- Keep the visible digits within the multiplication tables.

Examples:

Invalid:
- 6 × 0,30 €
- Visible digits: 6 × 30

Possible repair:
- 6 × 3 Cent

Invalid:
- 4 × 2,50 €
- Visible digits: 4 × 25

Possible repair:
- 4 × 5 Cent

Invalid:
- 75 Cent ÷ 3
- Visible digits: 75 ÷ 3

Possible repair:
- 24 Cent ÷ 3

REPAIR INSTRUCTION:
- Prefer changing only the offending monetary values.
- Convert euro amounts with decimals into whole-cent amounts if needed.
- Keep multiplication and division facts within the basic tables from 2 × 2 to 10 × 10.
- Preserve operation_category, operation_count, unknown_position, and cognitive_demand whenever possible.
- Make the smallest possible change.
`;
}

function generateProblemRepairPrompt({
  problems,
  parameters,
  comparison,
  quantity,
  grade,
}) {
  const comparisons = normalizeComparisons(comparison);

  const repairInstructionsByProblem = comparisons
    .map((singleComparison, index) => {
      return `
============================
REPAIR INSTRUCTIONS FOR PROBLEM ${index}
============================

${buildUnknownPositionRepairRule(singleComparison)}
${buildNumberRangeRepairRule(singleComparison)}
${buildLinguisticComplexityRepairRule(singleComparison)}
${buildCognitiveDemandRepairRule(singleComparison)}
${buildOperationCategoryRepairRule(singleComparison)}
${buildOperationCountRepairRule(singleComparison)}
${buildValidityRepairRules(singleComparison)}
${buildGrade3MultiplicationDivisionRepairRule(grade, singleComparison)}

`;
    })
    .join("\n");

  const system_prompt = `
You revise German primary-school math word problems.

Your task is to minimally fix each problem so it matches the intended parameters.

Return ONLY valid JSON matching the schema.

============================
IMPORTANT PRINCIPLE
============================

Make the smallest possible changes.

Do NOT rewrite the whole problem unless necessary.
Do NOT solve the problem.
Do NOT include equations or answers in the final problem text.
Keep the story natural and suitable for German primary-school pupils.

IMPORTANT PARAMETER MEANING

- quantity means the number of problems to return.
- quantity does NOT mean the number of numbers, values, objects, quantities, or givens inside each problem.
- Do not add extra numbers just to satisfy quantity.
- The number of numerical values inside a problem is controlled only by the mathematical structure, operation_count, and cognitive_demand.

============================
TARGET PARAMETERS
============================

${JSON.stringify(parameters, null, 2)}

============================
EVALUATION RESULT
============================

${JSON.stringify(comparison, null, 2)}

============================
REPAIR INSTRUCTIONS BY PROBLEM
============================

${repairInstructionsByProblem}

============================
FINAL RULES
============================

- Apply each problem's repair instructions only to that same problem_index.
- Preserve every parameter that already matched.
- Fix every parameter that did not match.
- If two repair instructions conflict, prioritize:
  1. unknown_position
  2. operation_category
  3. operation_count
  4. cognitive_demand
  5. linguistic_complexity
  6. number_range
  7. grade appropriateness
- Keep all relevant numbers within the intended number_range.
- The final problem must contain all numbers needed to compute the answer.
- The final problem should ask exactly one question.
`;

  const user_prompt = `
Fix these problems with the smallest possible changes.

Problems:
${JSON.stringify(problems, null, 2)}
`;

  const return_format = {
    type: "json_schema",
    json_schema: {
      name: "problem_repair",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["problems"],
        properties: {
          problems: {
            type: "array",
            minItems: Number(quantity),
            maxItems: Number(quantity),
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "problem_index",
                "original_full_problem_text",
                "fixed_full_problem_text",
                "minimal_changes_made"
              ],
              properties: {
                problem_index: {
                  type: "integer"
                },
                original_full_problem_text: {
                  type: "string"
                },
                fixed_full_problem_text: {
                  type: "string"
                },
                minimal_changes_made: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return { system_prompt, user_prompt, return_format };
}

module.exports = generateProblemRepairPrompt;