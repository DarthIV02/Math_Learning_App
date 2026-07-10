// backend/utils/prompts_LLM/generate_question_variants_prompt.js

function buildUnknownPositionRules(unknown_position) {
  switch (unknown_position) {
    case "result_unknown":
      return `
- Ask for the final result.
- Examples but don't restrict to these questions:
  - Wie viel bleibt übrig?
  - Wie viele sind es insgesamt?
  - Wie lang ist die Strecke zusammen?
`;

    case "change_unknown":
      return `
- Ask for a missing change, missing part, missing contribution, missing amount needed to reach a known total, missing group count, or missing divisor.
- The unknown must connect two known quantities.
- A known total, final amount, target amount, or complete structure must be present in the story.
- The answer should represent the missing quantity needed to complete that total.

Valid examples:

  Money:
  - Lena hat 4 € und bekommt 3 € dazu. Für das Buch braucht sie 10 €.
    Wie viel Geld fehlt noch?

  Distance:
  - Der Weg ist insgesamt 400 m lang.
    140 m und 30 m wurden bereits gelaufen.
    Wie viele Meter fehlen noch?

  Multiplication:
  - Es gibt insgesamt 48 Bücher.
    Jede Gruppe bekommt 6 Bücher.
    Wie viele Gruppen erhalten Bücher?

  Division:
  - 48 ÷ ? = 6

Invalid examples:

  - Wie viel Geld bekommt Lena nur für die Lesezeichen?
    Equation: 6 × 0.30 = ?
    This is result_unknown because no known total is involved.

  - Wie viele Meter läuft ein Kind?
    Equation: 120 ÷ 4 = ?
    This is result_unknown because the answer is the final computed quantity.

For change_unknown:
- The unknown should usually appear inside the equation:
  - 7 + ? = 12
  - 140 + 30 + ? = 400
  - 48 ÷ ? = 6
- Avoid forms where the equation is simply:
  - a + b = ?
  - a × b = ?
`;

    case "start_unknown":
      return `
- Ask for the starting amount.
- The story may need to mention the final amount and the change.
- Examples but don't restrict to these questions:
  - Wie viel Geld hatte er zuerst?
  - Wie viele waren am Anfang da?
  - Wie lang war die Strecke ursprünglich?
`;

    default:
      return `
- Choose a natural unknown position for the problem.
`;
  }
}

function buildQuestionVariationRules({
  linguistic_complexity,
  cognitive_demand,
  num_simple_operations
}) {
  return `
The variant should keep a similar difficulty level to the base problem.

Target linguistic complexity: ${linguistic_complexity}
Target cognitive demand: ${cognitive_demand}
Target number of operations: ${num_simple_operations}

Rules:
- Do not make the variant more complex than the target.
- Keep the same number of required operations when possible.
- If the original problem is direct and easy, the variant should also be direct and easy.
- Do not turn a one-step problem into a two-step problem.
- Do not introduce hidden quantities unless cognitive_demand requires it.
- Do not introduce multiplication + subtraction if the requested operation is division.
- Do not add extra target amounts like "damit jedes Kind 5 Bücher bekommt" unless the target cognitive demand allows hidden quantities.

Possible question types:
- find_total
- find_remaining
- find_missing_part
- find_starting_amount
- check_sufficiency
- find_each_amount
- find_difference
- compare_amounts
- equal_sharing
- equal_groups

For direct division with change_unknown:
- Prefer asking for the missing number of groups.
- Example: "48 Bücher werden verteilt. Jedes Kind bekommt 4 Bücher. Wie viele Kinder bekommen Bücher?"
- Equation: 48 ÷ ? = 4

For direct division with result_unknown:
- Ask for the amount per group.
- Example: "48 Bücher werden an 12 Kinder verteilt. Wie viele Bücher bekommt jedes Kind?"
- Equation: 48 ÷ 12 = ?

For direct division with start_unknown:
- Ask for the total amount.
- Example: "12 Kinder bekommen je 4 Bücher. Wie viele Bücher sind es insgesamt?"
- Equation: ? ÷ 12 = 4
`;
}

function buildOperationPreservationRules(operation, operation_category) {
  if (operation == null){
    operation = operation_category
  }

  return `
- Requested operation: ${operation}
- Each variant should preserve this operation as the main operation.
- You may change the question focus only if the problem still requires ${operation}.
- Do not create a variant that changes the main operation unless it is impossible to preserve the requested operation naturally.
- If the operation changes, set operation_changed to true and explain why.
`;
}

function generateQuestionVariantsPrompt({
  problems,
  quantity,
  variants_per_problem,
  grade,
  theme,
  unknown_position,
  operation,
  operation_category,
  linguistic_complexity,
  cognitive_demand,
  num_simple_operations
}) {
  const system_prompt = `
You create question variants for German primary-school math word problems.

You receive existing math word problems.

Your task is to create several variants of each problem by changing what is being asked.

You may slightly modify the story if needed so that the new question is mathematically valid.

Return ONLY valid JSON matching the schema.

============================
MAIN GOAL
============================

Generate multiple natural variants from the same base problem.

Each variant should:
- keep the same general story context
- use the same theme
- change the question focus
- remain understandable for Grade ${grade}
- be mathematically solvable
- sound like a German primary-school textbook problem

============================
WHAT MAY CHANGE
============================

You may change:
- the final question
- which quantity is unknown
- small story details needed to support the new question
- whether the problem asks for total, remaining amount, missing amount, starting amount, sufficiency, or sharing

You should keep:
- main characters
- general setting
- theme
- most objects
- age-appropriate language
- most of the numbers / quantities

============================
UNKNOWN POSITION RULES
============================

Requested unknown position: ${unknown_position || "any"}

${buildUnknownPositionRules(unknown_position)}

============================
QUESTION VARIATION RULES
============================

${buildQuestionVariationRules({
  linguistic_complexity,
  cognitive_demand,
  num_simple_operations
})}

============================
GRADE RULES
============================

Grade 3:
- Use simple language.
- Use short sentences.
- Avoid difficult words.
- Avoid overly complex multi-step reasoning.

Grade 4:
- Slightly longer and more complex problems are allowed.
- Still keep the wording clear and child-friendly.

============================
THEME RULES
============================

Theme: ${theme || "none"}

Money:
- Use natural questions like:
  - Reicht das Geld?
  - Wie viel bleibt übrig?
  - Wie viel fehlt noch?
  - Wie viel wurde ausgegeben?
  - Wie viel war am Anfang da?

Length:
- Use natural questions like:
  - Wie lang ist die Strecke insgesamt?
  - Wie viele Meter fehlen noch?
  - Wie lang war der Weg zuerst?
  - Wie weit läuft jedes Kind?

Weight:
- Use natural questions like:
  - Wie schwer ist alles zusammen?
  - Wie viel bleibt übrig?
  - Wie viel fehlt noch?
  - Wie viel bekommt jede Portion?

============================
OPERATION RULES
============================

${buildOperationPreservationRules(operation)}

============================
STRUCTURE PRESERVATION RULES
============================

The variant must preserve the reasoning structure of the original problem.

Do NOT simplify:

- routes into independent lengths
- hierarchies into flat lists
- relational quantities into direct quantities
- multi-step situations into single-step situations

Keep:

- the same quantity relationships
- the same reasoning pattern
- the same mathematical structure

Changing the unknown is allowed.

Changing the underlying reasoning structure is not allowed.

When changing the question:

- preserve at least 80% of the original story text
- preserve all original quantities unless absolutely necessary
- preserve named locations, objects, and relationships
- prefer changing only the final sentence

============================
IMPORTANT RULES
============================

Do NOT include:
- solutions
- equations
- calculation steps
- hints

Do NOT make a variant by only changing one word.
Each variant should ask for a meaningfully different quantity or use a different question style.

If the requested unknown position does not fit the original problem, rewrite the quantities slightly while keeping the same context.

============================
OUTPUT REQUIREMENTS
============================

For each input problem, return:
- base_problem_text
- variants

For each variant, return:
- full_problem_text
- question_type
- unknown_position
- changed_from_original
`;

  const user_prompt = `
Create question variants for these problems.

Parameters:
${JSON.stringify(
  {
    grade,
    theme,
    quantity,
    variants_per_problem,
    unknown_position,
    operation,
    operation_category,
    linguistic_complexity,
    cognitive_demand,
    num_simple_operations
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
      name: "question_variant_generation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["problem_variants"],
        properties: {
          problem_variants: {
            type: "array",
            minItems: Number(quantity),
            maxItems: Number(quantity),
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "base_problem_text",
                "variants"
              ],
              properties: {
                base_problem_text: {
                  type: "string"
                },
                variants: {
                  type: "array",
                  minItems: Number(variants_per_problem),
                  maxItems: Number(variants_per_problem),
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "full_problem_text",
                      "question_type",
                      "unknown_position",
                      "changed_from_original"
                    ],
                    properties: {
                      task_text: {
                        type: "string"
                      },
                      final_question: {
                        type: "string"
                      },
                      full_problem_text: {
                        type: "string"
                      },
                      question_type: {
                        type: "string",
                        enum: [
                          "find_total",
                          "find_remaining",
                          "find_missing_part",
                          "find_starting_amount",
                          "check_sufficiency",
                          "find_each_amount",
                          "find_difference",
                          "compare_amounts",
                          "equal_sharing",
                          "equal_groups"
                        ]
                      },
                      unknown_position: {
                        type: "string",
                        enum: [
                          "result_unknown",
                          "change_unknown",
                          "start_unknown"
                        ]
                      },
                      changed_from_original: {
                        type: "string",
                        description:
                          "Briefly state what changed, e.g. question focus, given quantity, or unknown position."
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

module.exports = generateQuestionVariantsPrompt;