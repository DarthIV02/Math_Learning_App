// backend/utils/prompts_LLM/generate_problem_text_prompt.js

function buildLinguisticComplexityRules(linguistic_complexity) {
  switch (linguistic_complexity) {
    case "simple_direct_sentence":
      return `
- Write a compact but natural problem.
- Use one short context sentence to explain what is happening.
- Then use one clear sentence that contains all relevant mathematical quantities.
- Keep the relationship direct and easy to see.
- Do not include irrelevant information.
- Do not include equations or intermediate results in the text.
- Do not write phrases like "also insgesamt 5 × 12 = 60".
`;

    case "two_short_sentences":
      return `
- Write a compact but natural problem.
- Use two short story sentences before the question.
- Split the relevant mathematical information across the two sentences.
- The pupil should combine information from both sentences to solve the problem.
- Keep the relationship between the quantities obvious.
- Do not include irrelevant information.
- Do not include equations or intermediate results in the text.
`;

    case "clear_relationship":
      return `
- Write a clear story where the relationship between quantities must be understood from the wording.
- The relevant quantities may appear across two or three sentences.
- Do not make the operation as direct as a simple "gets more" or "takes away" sentence.
- Keep the story understandable for the grade level.
- Do not include equations or intermediate results in the text.
`;

    case "longer_irrelevant_text":
      return `
- Write a slightly longer story before the question.
- Include one or two realistic details that are not needed for solving.
- The relevant mathematical information should still be easy to find.
- The pupil should identify which information is needed and which is extra.
- Do not include equations or intermediate results in the text.
`;

    default:
      return `
- Write a clear and age-appropriate problem.
- Make sure all needed quantities appear naturally in the text.
- Do not include equations or intermediate results in the text.
`;
  }
}

function buildCognitiveDemandRules(cognitive_demand) {
  switch (cognitive_demand) {

    case "direct_operation_mapping":
      return `
- The problem should require one direct operation.
- All quantities should be stated explicitly.
- The required operation should be immediately recognizable.
- Avoid hidden quantities.
- Avoid nested structures.
- Avoid dependency chains between quantities.
`;

    case "sequential_planning":
      return `
- The problem should require two or more operations.
- The events should happen in a clear chronological order.
- Each operation should naturally follow from the previous one.
- The pupil should solve the problem step by step.
- Avoid hidden quantities.
`;

    case "constructing_hidden_quantities":
      return `
- The problem should require constructing an intermediate quantity before answering the final question.
- The intermediate quantity should not be directly stated.
- The pupil must first combine or derive information before solving the actual question.
- The hidden quantity should be naturally embedded in the story.
`;

    case "managing_hierarchical_structure":
      return `
- The problem should contain quantities nested inside other quantities.
- Use clear hierarchical structures such as:
  - shelves containing boxes
  - boxes containing items
  - teams containing children
  - bags containing objects
  - rows containing seats
- The hierarchy should be necessary for solving the problem.
`;

    case "tracking_relational_dependencies":
      return `
- At least one quantity should be defined through another quantity.
- Use relationships such as:
  - more than
  - fewer than
  - twice as many
  - half as many
  - a multiple of
- The pupil must track these relationships to determine the required quantities.
- The dependency chain should remain understandable for the grade level.
`;

    default:
      return `
- Match the intended reasoning difficulty.
`;
  }
}

function buildGradeLanguageRules(grade) {
  if (Number(grade) === 3) {
    return `
- Write for German Grade 3 pupils.
- Use short, familiar words where possible.
- Avoid overly long sentences.
- Avoid complex subordinate clauses.
- The problem should be solvable with Grade 3 knowledge.
`;
  }

  if (Number(grade) === 4) {
    return `
- Write for German Grade 4 pupils.
- Slightly longer sentences are allowed.
- Multi-step situations are allowed.
- The problem should still be concrete and child-friendly.
`;
  }

  return `
- Write for German primary-school pupils.
`;
}

function buildGradeMathRules(grade) {
  if (Number(grade) === 3) {
    return `
============================
GRADE 3 MULTIPLICATION AND DIVISION RULES
============================

- If the problem uses multiplication, both factors must be between 2 and 10.
- Allowed multiplication facts are only from 2 × 2 up to 10 × 10.
- Do not create Grade 3 multiplication such as 12 × 4, 15 × 6, or 130 × 4.
- If the problem uses division, it must correspond to an allowed multiplication fact.
- Examples:
  - 24 ÷ 6 is allowed because 6 × 4 = 24.
  - 72 ÷ 9 is allowed because 9 × 8 = 72.
  - 120 ÷ 10 is not allowed for Grade 3 if it requires 12 × 10.
- Large values may appear in addition/subtraction, but not as multiplication factors.
`;
  }

  return "";
}

function generateProblemTextPrompt({
  quantity_relationship_plans,
  grade,
  theme,
  quantity,
  linguistic_complexity,
  cognitive_demand
}) {
  const system_prompt = `
You are writing German primary-school math word problems.

You receive structured situation plans with:
- a scenario summary
- given quantities
- a target quantity
- a relationship description
- a possible operation structure

Your task is to write the final natural-language math task.

Return ONLY valid JSON matching the schema.

============================
IMPORTANT PRINCIPLE
============================

Write the final task text, but do NOT solve it.

Do NOT include:
- the solution
- an equation
- calculation steps
- hints
- answer explanations

The output should sound like a natural German primary-school textbook problem.

IMPORTANT PARAMETER MEANING

- quantity means the number of problems to return.
- quantity does NOT mean the number of numbers, values, objects, quantities, or givens inside each problem.
- Do not add extra numbers just to satisfy quantity.
- The number of numerical values inside a problem is controlled only by the mathematical structure, operation_count, and cognitive_demand.

============================
ACTIVE PARAMETERS
============================

Grade: ${grade}
Theme: ${theme || "none"}
Quantity: ${quantity}
Linguistic complexity: ${linguistic_complexity}
Cognitive demand: ${cognitive_demand}

============================
LINGUISTIC COMPLEXITY RULES
============================

${buildLinguisticComplexityRules(linguistic_complexity)}

============================
COGNITIVE DEMAND RULES
============================

${buildCognitiveDemandRules(cognitive_demand)}

============================
GRADE LANGUAGE RULES
============================

${buildGradeLanguageRules(grade)}

${buildGradeMathRules(grade)}

============================
NUMBER AND UNIT RULES
============================

- Use display_value in the visible task text.
- Do not expose the internal integer value if display_value is different.
- Example: if value is 511 and display_value is "€5.11", write "€5.11", not "511 Cent", unless cents are more natural.
- Keep units consistent.
- Use German decimal commas for money if appropriate, e.g. "5,11 €" or "€5,11".
- Prefer natural German textbook notation, e.g. "5,11 €", "180 m", "750 g".

============================
QUESTION RULES
============================

- End with exactly one question.
- The question must ask for the target quantity.
- The question must be answerable from the given information.
- Do not ask multiple questions.
- Do not reveal the operation in the question too directly if the cognitive demand is medium or hard.

============================
OUTPUT REQUIREMENTS
============================

For each input plan, return:
- task_text
- final_question
- full_problem_text
- used_quantities
- linguistic_complexity_applied
- cognitive_demand_applied
`;

  const user_prompt = `
Write final German math word problems from these quantity relationship plans.

Parameters:
${JSON.stringify(
  {
    grade,
    theme,
    quantity,
    linguistic_complexity,
    cognitive_demand
  },
  null,
  2
)}

Quantity relationship plans:
${JSON.stringify(quantity_relationship_plans, null, 2)}
`;

  const return_format = {
    type: "json_schema",
    json_schema: {
      name: "problem_text_generation",
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
                "task_text",
                "final_question",
                "full_problem_text",
                "used_quantities",
                "linguistic_complexity_applied",
                "cognitive_demand_applied"
              ],
              properties: {
                task_text: {
                  type: "string",
                  description:
                    "The story part of the word problem without the final question."
                },
                final_question: {
                  type: "string",
                  description:
                    "Exactly one final question asking for the target quantity."
                },
                full_problem_text: {
                  type: "string",
                  description:
                    "The complete problem text: task_text plus final_question."
                },
                used_quantities: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "value",
                      "display_value",
                      "base_unit",
                      "display_unit",
                      "object"
                    ],
                    properties: {
                      value: {
                        type: "integer",
                        description:
                          "The underlying integer value used for calculation."
                      },
                      display_value: {
                        type: "string"
                      },
                      base_unit: {
                        type: "string"
                      },
                      display_unit: {
                        type: "string"
                      },
                      object: {
                        type: "string"
                      }
                    }
                  }
                },
                linguistic_complexity_applied: {
                  type: "string",
                  enum: [
                    "simple_direct_sentence",
                    "two_short_sentences",
                    "clear_relationship",
                    "longer_irrelevant_text"
                  ]
                },
                cognitive_demand_applied: {
                  type: "string",
                  enum: [
                    "direct_operation_mapping",
                    "sequential_planning",
                    "constructing_hidden_quantities",
                    "managing_hierarchical_structure",
                    "tracking_relational_dependencies"
                  ]
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

module.exports = generateProblemTextPrompt;