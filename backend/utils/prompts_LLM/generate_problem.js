function buildUnknownPositionRules(positionName) {
  switch (positionName) {
    case 'result_unknown':
      return `
- The unknown is the final result.
- Equation form: a OP b = ?
- The question asks for the final amount.
- Example question style: "Wie viele ... sind es insgesamt?" or "Wie viel ... bleibt übrig?"
`;

    case 'change_unknown':
      return `
- The unknown is a missing change or missing middle quantity.
- Equation form: a OP ? = c
- The question asks what was added, removed, missing, shared, or changed.
- Example question style: "Wie viele ... fehlen noch?" or "Wie viele ... kamen dazu?"
`;

    case 'start_unknown':
      return `
- The unknown is the starting quantity.
- Equation form: ? OP b = c
- The question asks what existed at the beginning.
- Example question style: "Wie viele ... hatte ... am Anfang?" or "Mit wie viel ... ist ... gestartet?"
`;

    default:
      return `
- Use a natural unknown position.
- Make sure the equation and question ask for the same missing quantity.
`;
  }
}

function buildLinguisticComplexityRules(complexityName) {
  switch (complexityName) {
    case 'simple_direct_sentence':
      return `
- Use exactly ONE short, direct sentence.
- Use simple subject-verb-object structure.
- No subordinate clauses.
- No irrelevant information.
`;

    case 'two_short_sentences':
      return `
- Use exactly TWO short sentences.
- First sentence gives the situation.
- Second sentence asks the question.
- No subordinate clauses.
- No irrelevant information.
`;

    case 'clear_relationship':
      return `
- Use 2–3 sentences.
- A clear relationship between quantities is allowed.
- One simple subordinate clause is allowed.
- No irrelevant information.
`;

    case 'longer_irrelevant_text':
      return `
- Use 3–4 sentences.
- Include at least ONE irrelevant detail that is not needed to solve the problem.
- The irrelevant detail must be plausible but mathematically unnecessary.
- The problem must still be clear and solvable.
`;

    default:
      return `
- Use clear, child-friendly German.
- Keep the wording appropriate for the grade.
`;
  }
}

function buildCognitiveDemandRules(demandName) {
  switch (demandName) {
    case 'direct_operation_mapping':
      return `
- The text maps directly to one operation.
- No hidden intermediate quantity.
- No nested grouping.
- No relational dependency chain.
- The result must also be different from both operands. This ensures the student must actually perform the operation, not just recognize it as a pattern.
`;

    case 'sequential_planning':
      return `
- The student must solve steps in a clear forward order.
- The order of actions should be visible in the story.
- Example structure: first something changes, then another change happens.
`;

    case 'constructing_hidden_quantities':
      return `
- The student must derive an intermediate quantity that is not directly stated.
- The intermediate quantity is required before answering the final question.
- Example: A child has some items, gives some away, and then the remaining items are shared equally.
`;

    case 'managing_hierarchical_structure':
      return `
- The problem must contain groups inside groups.
- Example: shelves contain boxes, boxes contain objects.
- The student must track the nested structure before solving.
`;

    case 'tracking_relational_dependencies':
      return `
- At least one quantity must be defined relative to another quantity.
- The student must resolve the dependency chain.
- Example: "Lena hat doppelt so viele wie Max. Max hat 8 weniger als Sara."
`;

    default:
      return `
- The reasoning structure must match the active cognitive demand.
`;
  }
}

function buildOperationCountRules(operationCount) {
  const count = Number(operationCount);

  if (count === 1) {
    return `
- Use exactly ONE arithmetic operator.
- The problem should be single-step.
`;
  }

  if (count === 2) {
    return `
- Use exactly TWO arithmetic operators.
- The problem should require two simple steps.
- Use parentheses if needed.
`;
  }

  if (count === 3) {
    return `
- Use exactly THREE arithmetic operators.
- The problem should require three connected steps.
- Use parentheses if needed.
`;
  }

  return `
- Use exactly ${count} arithmetic operators.
- The equation must be unambiguous.
- Use parentheses if needed.
`;
}

function buildGradeRules(grade) {
  const g = Number(grade);

  if (g === 3) {
    return `
- Use mental-math friendly calculations.
- Multiplication should stay within basic times tables when possible.
- Division should divide cleanly unless the scenario explicitly needs a remainder.
- Use short, simple German.
- Use one measurement unit per problem.
- Avoid percentages, taxes, physics, investments, and abstract finance.
`;
  }

  if (g === 4) {
    return `
- Multi-digit written calculation is allowed.
- Multiplication and division can go beyond basic times tables.
- Unit conversions are allowed if the theme supports them.
- Use child-friendly but slightly richer German.
- Contexts may include school trips, sports tournaments, baking, markets, gardens, libraries, and hobbies.
`;
  }

  return `
- Keep the problem age-appropriate and mathematically correct.
`;
}

function buildOperationTypeRules(operation, operationType) {
  if (operation != null) {
      return `Primary operation:
${operation}`;
  }
  // operation is null
  if (operationType === 'addition_subtraction') {
      return `Only use these operations:
Addition and Subtraction`;
  } else if (operationType === 'division_multiplication') {
    return `Only use these operations:
Division or Multiplication`;
  } else if (operationType === 'mixed_operations') {
    return `Primary operations:
For num_simple_operations = 1: use addition, subtraction, multiplication, or division.
For num_simple_operations > 1: use a mix of addition/subtraction AND multiplication/division. Avoid using only addition and subtraction or only multiplication and division.`;
  }
}

function buildThemeRules(theme) {
  
  const themeMap = {
    "geld": "Money",
    "gewichte": "Weights",
    "längen": "Distances",
    "other": "Other",
  };

  if (!theme || theme === "other") {
    return `
Theme:
- No fixed theme is required.
- Choose any child-friendly real-world context.
- Prefer diverse everyday situations such as school, sports, hobbies, animals, baking, libraries, gardens, or markets.
`;
  }

  return `
Theme:
- The problem MUST use the theme "${themeMap[theme]}".
- The context, objects, and wording should naturally fit this theme.
`;
}

function buildNarrativeOrderRules(operation, operationType, quantity) {
  const usesNonCommutative =
    operation === 'division' ||
    operation === 'subtraction' ||
    operationType === 'division_multiplication' ||
    operationType === 'addition_subtraction' ||
    operationType === 'mixed_operations';

  if (!usesNonCommutative) return '';

  return `
NARRATIVE ORDER (for division and subtraction):
- The order in which numbers are MENTIONED IN THE STORY must vary across the batch.
- Do NOT default to "character has X, splits into Y groups" for every division problem.
- At least ~50% of division/subtraction problems in a batch of ${quantity} must introduce the
  SECOND operand (divisor / subtrahend) FIRST in the story.

Good examples for division (divisor-first narrative):
- "In der Bäckerei gibt es 6 Tabletts. Auf ihnen sollen insgesamt 144 Brötchen verteilt werden. Wie viele Brötchen liegen auf jedem Tablett?"
- "8 Kinder teilen sich gerecht 56 Gummibärchen. Wie viele bekommt jedes Kind?"
- "In 12 Kisten werden 360 Äpfel gleichmäßig verpackt. Wie viele Äpfel sind in einer Kiste?"

Good examples for subtraction (subtrahend-first narrative):
- "27 Gäste sind schon gegangen. Am Anfang waren 80 Gäste da. Wie viele sind noch da?"

The EQUATION itself is still dividend / divisor — but the STORY text introduces them in
the opposite order. This is real diversity, not just relabeling 'a' and 'b'.
`;
}


function buildDiversityRules(quantity, operationCount, unknownPosition, operation, operation_category) {
  return `

Generate exactly ${quantity} problem(s).

Across the batch, enforce BOTH narrative diversity and structural diversity.

Narrative diversity:
- No repeated main character name.
- No repeated location.
- No repeated key object.
- Mix scenario archetypes: school day, sports, baking, library, garden, market, hobby, animals, crafts.
- Vary sentence structure. Do not start every problem with the character's name.
- Vary numeric style. Do not make all operands end in 0.

Structural diversity:
- Each problem must include planned_equation_template in scenario_plan.
- planned_equation_template must be structurally distinct from sibling problems.
- Changing only numbers does NOT count as structural diversity.
- Structural diversity means at least one of:
  - different operator order,
  - different parenthesization,
  - different unknown placement,
  - different equation shape.

Failure example:
Problem 1: 468 - 8 * ? = 100
Problem 2: 374 - 6 * ? = 140
Problem 3: 401 - 7 * ? = 184

These are NOT diverse. They are the same template with different numbers.

For num_simple_operations = ${operationCount}:
${buildTemplateExamples(operationCount, unknownPosition)}

If two problems have the same template shape, revise one before returning JSON.

${buildNarrativeOrderRules(operation, operation_category, quantity)}
`;
}

function buildTemplateExamples(operationCount, unknownPosition) {
  const count = Number(operationCount);

  if (count === 1) {
    return `
Examples (treat operand order as STRUCTURAL diversity for non-commutative ops):
- a + b = ?
- a - b = ?           // subtrahend second
- a * b = ?
- a / b = ?           // dividend first
- b / a = ?           // dividend second — DIFFERENT structure from a / b
- ? + b = c
- a + ? = c
- ? * b = c
- a * ? = c
- a / ? = c           // unknown divisor
- ? / b = c           // unknown dividend

IMPORTANT for division and subtraction:
- "a / b" and "b / a" are STRUCTURALLY DIFFERENT templates.
- "a - b" and "b - a" are STRUCTURALLY DIFFERENT templates.
- When generating multiple division problems, vary which operand serves as the dividend.
- The dividend does not have to be the first number mentioned in the story.
  `;
  }

  if (count === 2) {
    return `
Examples:
- (a + b) * c = ?
- a * b + c = ?
- (a - b) / c = ?
- a + b * ? = c
- (? + a) * b = c
- ? - a * b = c
- a * b - ? = c
`;
  }

  if (count === 3) {
    return `
Examples:
- (a + b) * c - d = ?
- a * b + c / d = ?
- (a - b) + c * d = ?
- a * b - c + ? = d
- (? + a) * b - c = d
`;
  }

  return `
Examples:
- (a + b) * c - d / e = ?
- a * b + c - d * e = ?
- (a - b) * (c + d) / ? = e
`;
}

function generateMathProblemPrompt({
  operation,
  theme,
  grade,
  difficulty_label,
  quantity,
  number_range_min_value,
  number_range_max_value,
  operation_category,
  unknown_position,
  linguistic_complexity,
  linguistic_complexity_description,
  cognitive_demand,
  cognitive_demand_description,
  num_simple_operations
}) {

  const system_prompt = `
You are an expert German primary school math teacher.

You generate mathematically correct, pedagogically appropriate German word problems ("Textaufgaben") for primary school students.

Return ONLY valid JSON matching the schema.

============================
ACTIVE PROFILE
============================

Grade:
${grade}. Klasse

${buildOperationTypeRules(operation, operation_category)}

Operation count:
${num_simple_operations}

Number range:
${number_range_min_value} to ${number_range_max_value}

Unknown position:
${unknown_position}

Linguistic complexity:
${linguistic_complexity}
${linguistic_complexity_description}

Cognitive demand:
${cognitive_demand}
${cognitive_demand_description}

${buildThemeRules(theme)}

Quantity:
${quantity}

Trust these parameters completely.
The caller has already validated that this combination is pedagogically appropriate.

============================
GRADE CAPABILITIES
============================

${buildGradeRules(grade)}

============================
ACTIVE CONSTRAINTS
============================

PRIMARY OPERATION:
- The equation must contain "${operation ? operation : operation_category}" at least once." at least once.

OPERATION COUNT:
${buildOperationCountRules(num_simple_operations)}

NUMBER RANGE:
- Every operand and final answer must stay within:
  ${number_range_min_value} to ${number_range_max_value}

NUMBER SELECTION RULES:
- Do NOT use the minimum value (${number_range_min_value}) or the maximum value (${number_range_max_value}) as operands more than once across the entire batch.
- Do NOT reuse the same operand pair across problems (e.g. once you use 500 + 500, do not use it again).
- Across the batch of ${quantity} problems, the operands must SPREAD across the full range [${number_range_min_value}, ${number_range_max_value}], not cluster at the endpoints.
- For addition: vary the magnitudes of the two addends. Do NOT make both addends equal.
- For subtraction: the difference (result) must also fall within [${number_range_min_value}, ${number_range_max_value}]. Vary how close the subtrahend is to the minuend across problems.

UNKNOWN POSITION:
${buildUnknownPositionRules(unknown_position)}

LINGUISTIC COMPLEXITY:
${buildLinguisticComplexityRules(linguistic_complexity)}

COGNITIVE DEMAND:
${buildCognitiveDemandRules(cognitive_demand)}

============================
DIVERSITY RULES
============================

${buildDiversityRules(quantity, num_simple_operations, unknown_position, operation, operation_category)}

============================
PROCESS
============================

For EACH problem:
1. Create a scenario_plan.
2. Choose operands respecting the NUMBER SELECTION RULES above.
3. Create an equation with exactly ${num_simple_operations} operators.
4. Place the unknown according to ${unknown_position}.
5. Write the German word problem.
6. Verify mathematical correctness.
7. Verify SEMANTIC correctness:
   - The story must describe a plausible real-world situation.
   - The arithmetic in the story must match the equation.
   - The question must be answerable from ONLY the numbers given in the story.
   - The answer must make sense in context (e.g. a person does not "pay 1000 € for bread").
   - If the story does not pass this check, rewrite it before returning JSON.

============================
IMPORTANT
============================

- question_text must NOT contain the equation.
- Problems must sound natural in German.
- The unknown symbol is ALWAYS "?". Never write "null", "x", "_", or leave it blank.
- Return ONLY valid JSON.
`;

  user_prompt = `
Generate ${ quantity } German math word problems for a ${ grade }. Klasse student with these parameters:

${operation ? `- Primary operation: ${ operation }` : `- Primary operations: ${ operation_category }`}
- Operation count: ${ num_simple_operations }
- Number range: (${ number_range_min_value }–${ number_range_max_value })
- Unknown position: ${ unknown_position }
- Linguistic complexity: ${ linguistic_complexity }
- Cognitive demand: ${ cognitive_demand }
- Theme: ${theme ? `${theme}` : 'any natural child-friendly context'}

Follow the process: plan first in scenario_plan (including a DISTINCT planned_equation_template for each problem), then compose, then verify. Do not produce multiple problems that share the same equation shape with different numbers.
  `;

  return_format = {
        type: "json_schema",
        json_schema: {
        name: "math_problem_generation",
        schema: {
            type: "object",
            properties: {
            scenario_plan: {
                type: "array",
                items: {
                type: "object",
                required: [
                    "context",
                    "main_character",
                    "location",
                    "key_object",
                    "planned_operations",
                    "planned_operands",
                    "planned_unknown_position",
                    "planned_intermediate_quantities",
                    "planned_equation_template",
                    "equation"
                ],
                additionalProperties: false,
                properties: {
                    context: { type: "string" },
                    main_character: { type: "string" },
                    location: { type: "string" },
                    key_object: { type: "string" },
                    planned_operation: {
                      type: "array",
                      description: "The arithmetic operators used in the equation, in order. Length MUST equal num_simple_operations. MUST include primary_operation at least once.",
                      items: {
                        type: "string"
                      },
                      enum: ["addition", "substraction", "division", "multiplication"]
                    },

                    planned_operands: {
                    type: "array",
                    items: {
                        type: "number"
                    },
                    description: "Numeric operands used in the equation. All operands AND the final answer must fall within [number_range_min, number_range_max]. At least one operand in the upper half of the range."
                    },

                    planned_unknown_position: {
                    type: "string",
                    enum: ["result", "middle", "start"]
                    },

                    planned_intermediate_quantities: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "For cognitive demands that require derivation, list each intermediate quantity. Otherwise empty array."
                    },
                    
                    planned_equation_template: {
                      type: "string",
                      description: "Abstract equation structure using letters a, b, c, d for operands and the literal character '?' for the unknown. NEVER use 'null'. Examples: 'a + b = ?', 'a - b * ? = c'. MUST be distinct from sibling problems' templates."
                    },
                    equation: {
                      type: "string",
                      description: "The math equation using exactly the planned operands and planned operators. The unknown MUST be written as the literal character '?'. NEVER write 'null'. Example: '527 + 643 = ?'. Use parentheses where order matters."
                    },
                }
                }
            },

            problems: {
                type: "array",
                items: {
                type: "object",
                required: [
                    "equation",
                    "answer",
                    "question_text"
                ],
                additionalProperties: false,
                properties: {
                    equation: {
                    type: "string",
                    description: "The math equation using exactly the planned operands and planned operators. Unknown written as ?. Use parentheses where order matters. Structure MUST match planned_equation_template."
                    },

                    answer: {
                    type: "number"
                    },

                    question_text: {
                    type: "string",
                    description: "German word problem. Must match linguistic_complexity and cognitive_demand. Must ask for the named unknown. Must NOT contain the equation."
                    }
                }
                }
            }
            },

            required: [
            "scenario_plan",
            "problems"
            ],

            additionalProperties: false
          }
        }
    };

    return {system_prompt, user_prompt, return_format};
}

module.exports = generateMathProblemPrompt;