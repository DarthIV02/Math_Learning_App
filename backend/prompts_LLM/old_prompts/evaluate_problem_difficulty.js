// backend/utils/prompts_LLM/evaluate_problem_language_prompt.js

function generateProblemLanguageEvaluationPrompt({
  problems,
  grade,
  quantity,
  mathEvaluation,
}) {
  const system_prompt = `
You evaluate German primary-school math word problems.

You are NOT solving or rewriting the problems.

Your task is to evaluate the language, reasoning structure, and grade suitability.

Return ONLY valid JSON matching the schema.

============================
WHAT TO CLASSIFY
============================

For each problem, classify:

- unknown_position
- linguistic_complexity
- cognitive_demand
- grade_appropriateness

Do NOT generate:
- equations
- answers
- operation categories
- operation counts
- solution explanations
- rewritten problems

Use the math evaluation only as supporting evidence.
Do not output the equation.

============================
UNKNOWN POSITION
============================

Classify unknown_position using BOTH:
- the final question in the problem text
- the equation from the math evaluation

Do NOT classify unknown_position only by the arithmetic operation used to compute the answer.

result_unknown:
- The problem asks for the result of applying operations to the given quantities.
- The unknown appears as the final result of the equation.
- Typical equation forms:
  - 7 + 5 = ?
  - 400 - 170 = ?
  - 4 * 6 = ?
- Use result_unknown when the question asks for a newly computed total, remainder, product, quotient, or final amount.

change_unknown:
- The problem asks for a missing change, missing part, added amount, removed amount, difference, or remaining amount needed to reach a known total.
- The unknown completes a known total or known final amount.
- Typical equation forms:
  - 7 + ? = 12
  - 140 + 30 + ? = 400
  - 180 + 220 + ? = 600
- Use change_unknown when the question asks:
  - how much is missing
  - how much still needs to be done
  - how much was added
  - how much was removed
  - what missing part completes the total

start_unknown:
- The problem asks for the starting amount.
- The initial amount is unknown, while the change and final amount are known.
- Typical equation forms:
  - ? + 5 = 12
  - ? - 30 = 70
  - ? + 140 + 30 = 400

Tie-breaking rules:
- If the equation from the math evaluation contains "?" before or inside the expression, use that position.
- If the problem asks for a missing part needed to reach a known total, choose change_unknown even if the answer can be computed by subtraction.
- If the problem asks "Wie viel fehlt noch?", "Wie viel müssen sie noch ...?", or "Wie lang ist das fehlende Stück?", usually choose change_unknown.
- If the problem asks for the total/result after all given operations, choose result_unknown.

============================
LINGUISTIC COMPLEXITY
============================

Classify linguistic_complexity by wording and text structure only.
Do NOT classify it by the number of operations or mathematical difficulty.

simple_direct_sentence:
- The problem is compact and natural.
- There may be one short context sentence.
- All relevant mathematical quantities appear together in one clear sentence.
- The relationship is direct and easy to see.
- There is no irrelevant information.

two_short_sentences:
- The story has two short information-bearing sentences before the question.
- Relevant mathematical quantities are split across those two sentences.
- The pupil must combine information from both sentences.
- The relationship between quantities is still obvious.
- There is no irrelevant information.

clear_relationship:
- The story is clear, but the mathematical relationship must be understood from wording.
- Relevant quantities may appear across two or three sentences.
- The operation is not stated in a very direct way.
- There is no irrelevant information.

longer_irrelevant_text:
- The story is slightly longer.
- It contains one or two realistic details that are not needed for solving.
- The irrelevant details fit the story naturally.
- The necessary mathematical information is still present and unambiguous.

Tie-breaking rules:
- If there is irrelevant information, choose longer_irrelevant_text.
- Else if relevant quantities are split across exactly two short story sentences and the relationship is obvious, choose two_short_sentences.
- Else if the relationship must be inferred from wording rather than directly stated, choose clear_relationship.
- Else choose simple_direct_sentence.

============================
COGNITIVE DEMAND
============================

Classify cognitive_demand by the reasoning structure needed to solve the problem.
Do NOT classify it by sentence length, irrelevant information, or linguistic complexity.

direct_operation_mapping:
- The problem requires one direct operation.
- All needed quantities are explicitly stated.
- The required operation is immediately recognizable.
- No hidden intermediate quantity is needed.
- No nested structure is needed.
- No quantity is defined through another quantity.

sequential_planning:
- The problem requires two or more operations.
- The events happen in a clear chronological or step-by-step order.
- Each operation naturally follows from the previous one.
- No important intermediate quantity is hidden.
- No nested container structure is central.

constructing_hidden_quantities:
- The problem requires deriving an intermediate quantity before answering the final question.
- The intermediate quantity is not directly asked for and is not directly stated.
- The pupil must first combine, compare, or derive information, then use that result.

managing_hierarchical_structure:
- The problem contains quantities nested inside other quantities.
- The nested structure is necessary for solving.
- Examples:
  - shelves contain boxes, boxes contain objects
  - teams contain children, children have items
  - bags contain packets, packets contain pieces
  - rows contain seats

tracking_relational_dependencies:
- At least one quantity is defined relative to another quantity.
- The pupil must track a dependency between quantities.
- Look for wording such as:
  - more than
  - fewer than
  - less than
  - twice as many
  - half as many
  - a multiple of
  - one third of

Tie-breaking rules:
- If the main structure is nested containment, choose managing_hierarchical_structure.
- Else if a quantity is defined relative to another quantity, choose tracking_relational_dependencies.
- Else if an unstated intermediate quantity must be constructed before answering, choose constructing_hidden_quantities.
- Else if the solution is a clear ordered sequence of two or more operations, choose sequential_planning.
- Else choose direct_operation_mapping.

============================
GRADE APPROPRIATENESS
============================

Evaluate whether the problem makes sense for a Grade ${grade} pupil.

Consider:
- vocabulary
- sentence length
- amount of information
- reasoning complexity
- concreteness of the situation
- whether the story is understandable for the grade level

Return:
- is_appropriate: true or false
- reason: one short, human-readable sentence

============================
IMPORTANT RULES
============================

- Classify the problem as written.
- Do not rely on metadata if it conflicts with the actual problem text.
- If a problem contains full_problem_text, classify that text.
- If both task_text and final_question are provided, classify them together.
`;

const user_prompt = `
Evaluate the language and educational suitability of these problems.

Use the provided math evaluation to classify unknown_position.

Parameters:
${JSON.stringify(
  {
    grade,
    quantity
  },
  null,
  2
)}

Problems:
${JSON.stringify(problems, null, 2)}

Math evaluation:
${JSON.stringify(mathEvaluation, null, 2)}
`;

  const return_format = {
    type: "json_schema",
    json_schema: {
      name: "problem_language_evaluation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["evaluations"],
        properties: {
          evaluations: {
            type: "array",
            minItems: Number(quantity),
            maxItems: Number(quantity),
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "unknown_position",
                "linguistic_complexity",
                "cognitive_demand",
                "grade_appropriateness"
              ],
              properties: {
                unknown_position: {
                  type: "string",
                  enum: [
                    "result_unknown",
                    "change_unknown",
                    "start_unknown"
                  ]
                },
                linguistic_complexity: {
                  type: "string",
                  enum: [
                    "simple_direct_sentence",
                    "two_short_sentences",
                    "clear_relationship",
                    "longer_irrelevant_text"
                  ]
                },
                cognitive_demand: {
                  type: "string",
                  enum: [
                    "direct_operation_mapping",
                    "sequential_planning",
                    "constructing_hidden_quantities",
                    "managing_hierarchical_structure",
                    "tracking_relational_dependencies"
                  ]
                },
                grade_appropriateness: {
                  type: "object",
                  additionalProperties: false,
                  required: ["is_appropriate", "reason"],
                  properties: {
                    is_appropriate: {
                      type: "boolean"
                    },
                    reason: {
                      type: "string"
                    }
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

// backend/utils/prompts_LLM/evaluate_problem_math_prompt.js

function operationIncludedRule(operation) {
  if (operation) {
    return `Specify if ${operation} is included as one of the operations in the equation.
Return true or false.`;
  }

  return `No specific operation was requested.
Return true always.`;
}

function buildGradeMathRules(grade) {
  if (Number(grade) === 3) {
    return `
============================
GRADE 3 MULTIPLICATION AND DIVISION RULES
============================

For Grade 3, multiplication and division are valid ONLY if they come from the basic multiplication table from 2 × 2 through 10 × 10.

MULTIPLICATION:
- For every multiplication a * b in the equation, check BOTH factors separately.
- The multiplication is valid only if 2 <= a <= 10 AND 2 <= b <= 10.
- If either factor is greater than 10, the multiplication is invalid.
- Examples:
  - 2 * 8 is valid.
  - 8 * 10 is valid.
  - 2 * 30 is invalid because 30 > 10.
  - 3 * 25 is invalid because 25 > 10.
  - 2 * 20 is invalid because 20 > 10.
  - 4 * 130 is invalid because 130 > 10.

DIVISION:
- For every division a / b = c, check that the related multiplication b * c = a is a basic multiplication fact.
- The division is valid only if 2 <= b <= 10 AND 2 <= c <= 10.
- The dividend a must be between 4 and 100 and must equal b * c.
- Examples:
  - 48 / 6 = 8 is valid because 6 * 8 = 48.
  - 72 / 9 = 8 is valid because 9 * 8 = 72.
  - 60 / 2 = 30 is invalid because 30 > 10.
  - 75 / 3 = 25 is invalid because 25 > 10.
  - 120 / 10 = 12 is invalid because 12 > 10.

REQUIRED OUTPUT:
- grade_3_multiplication_division_valid must be false if ANY multiplication or division violates these rules.
- In grade_3_multiplication_division_checks, list every multiplication or division operation from the equation.
- In grade_3_multiplication_division_reason, explicitly mention the invalid factor or quotient if invalid.
`;
  }

  return `
For grade_3_multiplication_division_valid return true.
For grade_3_multiplication_division_reason return "Not applicable for Grade 4.".
For grade_3_multiplication_division_checks return [].
`;
}

function generateProblemMathEvaluationPrompt({
  problems,
  grade,
  quantity,
  operation,
}) {
  const system_prompt = `
You evaluate the mathematical structure of German primary-school math word problems.

You are allowed to solve the problem only to extract the mathematical structure.

Return ONLY valid JSON matching the schema.

============================
WHAT TO CLASSIFY
============================

For each problem, classify:

- operation_included
- operation_category
- number_range
- operation_count
- equation
- answer
- has_all_required_numbers
- missing_number_reason

Do NOT generate:
- solution explanations
- step-by-step calculations
- rewritten problems
- linguistic complexity
- cognitive demand
- grade appropriateness

============================
OPERATION INCLUDED
============================

${operationIncludedRule(operation)}

============================
OPERATION CATEGORY
============================

addition_subtraction:
- only addition and/or subtraction are included in the equation

multiplication_division:
- only multiplication and/or division are included in the equation

mixed_operations:
- combines operations from both families
- examples:
  - multiplication + addition
  - multiplication + subtraction
  - division + addition
  - division + subtraction

============================
NUMBER RANGE
============================

Use the largest mathematically relevant number in the problem.
Also include intermediate results that are necessary to solve the problem.

For Grade 3:
- 1-100
- 100-500
- 500-1000
- 1000+

For Grade 4:
- 1-100
- 100-1000
- 1000-10000
- 10000+

For money:
- Convert euro amounts to cents for classification.
- Example: 5,11 € = 511
- Example: 12,50 € = 1250

For measurement:
- Use the integer value as written in the displayed unit.
- Example: 250 cm = 250
- Example: 3 km = 3

Grade: ${grade}

${buildGradeMathRules(grade)}

============================
MONEY VALUE INTERPRETATION
============================

When evaluating the difficulty or validity of numbers appearing in a money problem:

Use the displayed digits only.

Interpretation rule:
- Remove the decimal separator and read the remaining digits as an integer.
- Do NOT convert to cents.
- Do NOT normalize the value.

Examples:
- €0.15 → 15
- €0.30 → 30
- €2.50 → 25
- €12.50 → 125
- €2 → 2
- €12 → 12
- €2.00 → 200
- €12.00 → 1200

Use these interpreted values ONLY for:
- number validity checks
- multiplication/division table checks
- age appropriateness checks
- determining whether numbers satisfy grade-specific constraints

Do NOT use these interpreted values for:
- equation generation
- answer calculation
- operation counting
- mathematical reasoning

For equations and answers:
- Continue using the mathematically correct values.
- Continue using cents where required.

============================
OPERATION COUNT
============================

operation_count = number of simple operations (+, -, *, /) required to solve the problem.

Count only mathematically necessary operations.

Examples:
- 7 + 5 = ? has operation_count 1
- 10 + 4 - 3 = ? has operation_count 2
- 4 * 3 * 5 = ? has operation_count 2
- 5 * 6 / 3 = ? has operation_count 2

============================
NUMBER COMPLETENESS
============================

Check whether the problem contains all numbers needed to compute the answer.

has_all_required_numbers:
- true if every mathematically necessary number is explicitly stated or can be directly inferred from the problem text.
- false if at least one number needed for the calculation is missing, ambiguous, or impossible to infer.

missing_number_reason:
- If has_all_required_numbers is true, return "All required numbers are present."
- If false, briefly explain which number or quantity is missing.

Examples:
- "Lena has some apples and gets 5 more. Now she has 12." has all required numbers.
- "Each box contains pencils. There are 4 boxes." is missing the number of pencils per box.
- "A train travels for 3 hours." is missing the speed or distance.

============================
EQUATION RULES
============================

For each problem, generate one equation or equation chain that matches the final question.

Use "?" for the unknown quantity.

Examples:
- result unknown: 7 + 5 = ?
- change unknown: 7 + ? = 12
- start unknown: ? + 5 = 12
- two-step: 10 + 4 - 3 = ?
- hidden quantity: 5 * 6 / 3 = ?
- hierarchical: 4 * 3 * 5 = ?
- relational: (18 - 4) * 2 = ?

For money:
- Use integer cents in the equation.
- Example: 9,00 € - 4,00 € = ? becomes 900 - 400 = ?

For measurement:
- Use the displayed integer values.
- Example: 250 cm + 180 cm = ? becomes 250 + 180 = ?

Do not include units in the equation.
When possible, write the equation so that "?" represents the unknown as asked in the story.

If the problem asks for a missing amount needed to reach a known total, prefer:
140 + 30 + ? = 400 instead of 400 - (140 + 30) = ?

Do not pre-compute intermediate quantities inside the equation.

If the story contains repeated groups, equal parts, or hierarchical quantities, keep them symbolically in the equation.

Examples:
- If the story says "2 Stücke mit je 120 cm", write 2 * 120, not 240.
- If the story says "3 Kisten mit je 40 Äpfeln", write 3 * 40, not 120.
- If the story says "4 Reihen mit je 25 Plätzen", write 4 * 25, not 100.

Bad:
240 - 80 = ?

Good:
2 * 120 - 80 = ?

Bad:
240 - ? = 80

Good:
2 * 120 - ? = 80

Bad:
240 - ? = ?

Good:
2 * 120 - ? = ?

============================
ANSWER RULES
============================

Return only the numeric answer to the final question.

For money:
- Return the answer in cents if the equation uses cents.

For measurement:
- Return the answer using the same displayed integer values as the equation.

============================
IMPORTANT RULES
============================

- Classify the problem as written.
- Do not rely on metadata if it conflicts with the actual problem text.
- If a problem contains full_problem_text, classify that text.
- If both task_text and final_question are provided, classify them together.
- Ignore wording style and sentence structure unless needed to understand the math.
`;

  const user_prompt = `
Evaluate the mathematical structure of these problems.

Parameters:
${JSON.stringify(
  {
    grade,
    quantity,
    operation
  },
  null,
  2
)}

Problems:
${JSON.stringify(problems, null, 2)}
`;

  const return_format = {
    type: "json_schema",
    json_schema: {
      name: "problem_math_evaluation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["evaluations"],
        properties: {
          evaluations: {
            type: "array",
            minItems: Number(quantity),
            maxItems: Number(quantity),
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "operation_included",
                "operation_category",
                "number_range",
                "operation_count",
                "has_all_required_numbers",
                "missing_number_reason",
                "equation",
                "answer",
                "grade_3_multiplication_division_valid",
                "grade_3_multiplication_division_reason",
                "grade_3_multiplication_division_checks",
              ],
              properties: {
                operation_included: {
                  type: "boolean"
                },
                operation_category: {
                  type: "string",
                  enum: [
                    "addition_subtraction",
                    "multiplication_division",
                    "mixed_operations"
                  ]
                },
                number_range: {
                  type: "string",
                  enum: [
                    "1-100",
                    "100-500",
                    "500-1000",
                    "1000+",
                    "100-1000",
                    "1000-10000",
                    "10000+"
                  ]
                },
                operation_count: {
                  type: "integer"
                },
                has_all_required_numbers: {
                  type: "boolean"
                },
                missing_number_reason: {
                  type: "string"
                },
                equation: {
                  type: "string",
                  description:
                    "Equation or equation chain representing the problem. Use ? for the unknown and no units."
                },
                answer: {
                  type: "number",
                  description:
                    "Numeric answer to the final question, using the same base unit as the equation."
                },
                grade_3_multiplication_division_valid: {
                  type: "boolean"
                },
                grade_3_multiplication_division_reason: {
                  type: "string"
                },
                grade_3_multiplication_division_checks: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["operation", "left", "right", "valid"],
                    properties: {
                      operation: {
                        type: "string",
                        enum: ["multiplication", "division"]
                      },
                      left: {
                        type: "number"
                      },
                      right: {
                        type: "number"
                      },
                      valid: {
                        type: "boolean"
                      }
                    }
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

module.exports = {
  generateProblemLanguageEvaluationPrompt,
  generateProblemMathEvaluationPrompt,
};