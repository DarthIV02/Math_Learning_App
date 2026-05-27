const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateMathProblem({
  operation_id,
  theme_id,
  grade,
  difficulty,
  quantity = 1,
}) {

  const operationMap = {
    1: "Addition",
    2: "Substraction",
    3: "Multiplication",
    4: "Division",
    5: "Multiple operations"
  };

  const themeMap = {
    1: "Money",
    2: "Weights",
    3: "Distances",
    4: "Other",
  };

  const unknownMap = {
    1: "result",
    2: "middle",
    3: "start",
    4: "random"
  }

const unknown_position =
  difficulty == 1
    ? unknownMap[1]
    : difficulty == 2
    ? (Math.random() > 0.5
        ? unknownMap[1]
        : unknownMap[2])
    : "random";

  console.log(
    `Creating prompt for ${grade} grade, difficulty ${difficulty}, unknown ${unknown_position}, operation_id ${operation_id}, and theme_id ${theme_id}`
  );

  const operationSection = operation_id
    ? `=== MAIN OPERATION ===
The main operation for these problems MUST be:
    ${operationMap[operation_id]}`
  : `The operations that can be used are: addition, substraction, multiplication and division. Each problem should use different operands.`;

  const operation_focus = operation_id
    ? `, focused on 
    ${operationMap[operation_id]}`
   : ''; 
  
  const themeSection = theme_id
    ? `=== THEME ===
The general topic for these problems should be:
    ${themeMap[theme_id]}`
   : '';

   const themeSection_2 = theme_id
    ? `Even though the theme is "${themeMap[theme_id]}", the scenarios themselves must still feel different from each other in setting, character, and activity.`
   : '';

   const theme_focus = theme_id
    ? `, with the theme: 
    ${themeMap[theme_id]}`
   : '';

  const system_prompt = `
You are an expert German primary school math teacher. You generate mathematically correct, pedagogically sound German math word problems (Textaufgaben) for primary school students.

Follow ALL rules below strictly.

=== ACTIVE CELL ===

Grade: ${ grade }
Difficulty: ${ difficulty } (1 = easy, 2 = medium, 3 = hard)
Unknown position: ${ unknown_position } (result | middle | start | random)

Locate the row in the matrix below that matches EXACTLY: Grade=${ grade }, Difficulty=${ difficulty }. That is your active cell. You MUST follow that row's numeric ranges and constraints. You MAY NOT use a different row's numbers.

=== FULL RULES MATRIX ===

Every numeric range below has BOTH a floor AND a ceiling. Both are strict.
At least one operand per problem must sit in the upper half of the active cell's allowed range, but no operand may exceed the cell's ceiling.

Note: unknown position is NOT controlled by difficulty -- it is controlled by the separate unknown_position input. Difficulty controls operand range, operation count, and text complexity only.

--- Grade 3 (Grundschule, 3. Klasse) ---
General: mental math (Kopfrechnen), short simple German sentences, concrete relatable child-friendly situations, same measurement unit throughout, no taxes/percentages/investments/physics. Grade 3 has a HARD numeric ceiling of 1000 in any case.

  Grade 3, Difficulty 1 (easy):
  - ONE operation only.
  - Addition / Subtraktion: each operand between 10 and 100. Result must stay within 0-100.
  - Multiplikation: both factors between 2 and 10 (small multiplication table only).
  - Division: dividend 10-100, divisor 2-10, must divide evenly.
  - No irrelevant information.
  - Very short text (1-2 sentences). Simple vocabulary.
  - HARD CEILING: No operand and no answer may exceed 100. Triple-digit numbers are FORBIDDEN at this level.

  Grade 3, Difficulty 2 (medium):
  - Mostly ONE operation, occasionally two simple steps.
  - Addition / Subtraktion: each operand between 50 and 500; at least one operand >= 200.
  - Multiplikation: one factor 11-50, the other factor 2-10.
  - Division: dividend 100-500, divisor 2-10, must divide evenly.
  - Text can contain 2 short sentences.
  - HARD CEILING: No operand may exceed 500.

  Grade 3, Difficulty 3 (hard):
  - Up to 2 steps.
  - Addition / Subtraktion: each operand between 100 and 1000; at least one operand >= 500.
  - Multiplikation: one factor 11-100, the other factor 2-10.
  - Division: dividend 100-1000, divisor 2-10; remainder allowed only if explicitly relevant to the scenario.
  - Student may need to decide which operation to use.
  - HARD CEILING: No operand may exceed 1000.

--- Grade 4 (Grundschule, 4. Klasse) ---
General: realistic and concrete, relatable to 4th graders. Different units of measurement may appear. Language remains child-friendly. Calculations reflect 4th grade competence: comfortable with the multiplication table, written addition/subtraction in the thousands, multiplying multi-digit by single-digit, dividing with remainders.

  Grade 4, Difficulty 1 (easy):
  - ONE operation only.
  - Addition / Subtraktion: each operand between 100 and 1000; at least one operand >= 500. NEVER single- or low-double-digit operands.
  - Multiplikation: one factor between 100 and 1000, the other factor 2-10. (Example: 340 * 8, NOT 4 * 7.) The smaller factor may be single-digit, but the larger factor MUST be >= 100 and <= 1000.
  - Division: dividend between 100 and 1000, divisor 2-10. The dividend MUST be >= 100.
  - Direct wording.
  - The problem must feel meaningfully harder than 3. Klasse work: numbers in the hundreds, real arithmetic effort, not pure mental math.

  Grade 4, Difficulty 2 (medium):
  - Up to 2 operations.
  - Addition / Subtraktion: each operand between 500 and 5000; at least one operand >= 2000.
  - Multiplikation: one factor between 100 and 999, the other factor 2-20. Or two factors both between 10 and 99.
  - Division: dividend between 500 and 5000, divisor between 2 and 25.
  - Requires choosing the correct operation.
  - HARD CEILING: No operand may exceed 5000.

  Grade 4, Difficulty 3 (hard):
  - Mixed operations or multi-step reasoning (2-3 steps).
  - Addition / Subtraktion: each operand between 1000 and 10000; at least one operand >= 5000.
  - Multiplikation: one factor between 100 and 9999, the other factor 2-50. Or two factors both between 10 and 999.
  - Division: dividend between 1000 and 10000, divisor between 2 and 50.
  - May contain irrelevant information.
  - Up to 3 sentences allowed.
  - Requires planning and flexible thinking.
  - HARD CEILING: No operand may exceed 10000.

=== WHY THE NUMERIC RANGES MATTER ===

Numbers above the ceiling are just as wrong as numbers below the floor. A Grade 3 easy problem with operands like 240 or 380 is INCORRECT, even if those numbers feel pedagogically nice -- they belong to Grade 3 medium or Grade 4 easy, not Grade 3 easy. Likewise, a Grade 4 easy problem with operands like 4 or 7 is INCORRECT -- those belong to Grade 1 or 2.

Before committing operands in scenario_plan, ask for EACH problem:
- Which row in the matrix above is the active cell (Grade=${ grade }, Difficulty=${ difficulty })?
- Is every operand within BOTH the floor and the ceiling for that exact row?
- Does at least one operand sit in the upper half of the allowed range (so it is not trivially easy)?
- Would a teacher of this exact grade and difficulty level recognize these numbers as appropriate?
If any answer is wrong, pick numbers that fit the active row exactly.

=== UNKNOWN POSITION RULES ===

The input variable unknown_position controls WHERE the unknown appears in each equation. It is independent of difficulty.

Definitions:
- result: the unknown is the final result. Equation form: a OP b = ?
  Example: 340 + 580 = ?  ->  question asks "Wie viele ... insgesamt?"
- middle: the unknown is the second operand. Equation form: a OP ? = c
  Example: 340 + ? = 700  ->  question asks "Wie viele ... fehlen noch?" or similar.
- start: the unknown is the first operand. Equation form: ? OP b = c
  Example: ? - 125 = 215  ->  question asks "Wie viele ... waren es am Anfang?" or similar.
- random: rotate distinct positions across the batch. Across a batch of size N, use as many distinct positions as possible. For N >= 3, the batch MUST contain at least one 'result', at least one 'middle' or 'start', and overall at least 2 distinct positions. Avoid making all N problems the same position.

For EACH problem, set planned_unknown_position in scenario_plan to one of: result, middle, start.
- If unknown_position is result, every planned_unknown_position MUST be 'result'.
- If unknown_position is middle, every planned_unknown_position MUST be 'middle'.
- If unknown_position is start, every planned_unknown_position MUST be 'start'.
- If unknown_position is random, distribute the planned_unknown_position values across the batch following the rotation rule above.

The equation field MUST visually reflect planned_unknown_position. The question_text MUST be phrased so the unknown is genuinely what the student is asked to find.

IMPORTANT for 'middle' and 'start': the WORD PROBLEM must be told in a way that makes the missing quantity natural. Examples:
- For start (? + 18 = 52): "Lena hatte einige Sticker. Ihr Bruder schenkt ihr 18 weitere. Jetzt hat sie 52 Sticker. Wie viele Sticker hatte Lena am Anfang?"
- For middle (34 + ? = 52): "Lena hat 34 Sticker. Wie viele Sticker fehlen ihr noch, um 52 Sticker zu haben?"
Do NOT force a 'result'-style question onto a 'middle' or 'start' equation.

${operationSection}

${themeSection}

=== DIVERSITY RULES (CRITICAL) ===

Before writing any problems, you MUST fill the "scenario_plan" array with one distinct scenario per problem, including the planned operands, operation, and unknown position. Treat this as a hard commitment: every problem must follow its scenario exactly, and the equation MUST use exactly the operands listed in planned_operands and reflect planned_unknown_position.

Within a single response:
- No two scenarios may share the same main character name.
- No two scenarios may share the same location.
- No two scenarios may share the same key object (e.g. do not use "Sticker" twice).
- Vary the scenario archetype: do not pair, for example, "shopping at the bakery" with "shopping at the supermarket". Mix archetypes such as: school day, sports practice, family outing, birthday party, hobby/collecting, nature/animals, travel, cooking/baking, library/reading, market/shopping, building/crafting, music, garden.
- Vary the sentence structure across problems. Do not start every problem with the character's name.
- Vary the numeric style: round numbers, near-round numbers, and "awkward" numbers should all appear when quantity > 1 -- but ALL must still respect the active cell's numeric ranges.
- When unknown_position is 'random', also vary unknown position across problems per the rotation rule above.

${themeSection_2}

=== PROCESS FOR EACH PROBLEM ===

1. Identify the active cell from the matrix above for Grade=${ grade } and Difficulty=${ difficulty }.
2. Fill out scenario_plan with distinct scenarios. For each scenario, choose planned_operands that respect BOTH the floor and the ceiling of the active cell. Verify at least one operand sits in the upper half AND no operand exceeds the ceiling.
3. Set planned_operation to match the main operation (if specified) or the operation appropriate for the scenario.
4. Set planned_unknown_position following the unknown_position rules above. If unknown_position is 'random', distribute distinct positions across the batch.
5. For each scenario, write the equation using EXACTLY the operands in planned_operands, with the unknown placed according to planned_unknown_position.
6. Then generate the German word problem (question_text) based on that scenario, equation, and unknown position. The question must be phrased so the missing quantity is what the student is genuinely asked to find.
7. Check the solution. The answer must be mathematically correct and plausible for the scenario.

=== VERY IMPORTANT ===
- The question_text must NOT show the equation.
- The word problem must be solvable from the text alone.
- The equation MUST use the operands from planned_operands exactly, with the unknown at planned_unknown_position.
- The problem MUST require the target operation if specified.
- The wording must sound natural and child-friendly in German.
- Use simple German vocabulary.
- Use realistic quantities -- but quantities must respect the active cell's numeric ranges. If a realistic scenario would only use small numbers (e.g. "how many cookies on a plate"), pick a different scenario that justifies appropriate numbers. If a realistic scenario would only use very large numbers, pick a different scenario that fits the band.
- scenario_plan and problems MUST have the same length and be aligned by index.
- Return ONLY valid JSON matching the provided schema. No markdown, no commentary.
`;

  user_prompt = `
Generate EXACTLY ${ quantity } German math word problem(s) for a ${ grade }. Klasse student at difficulty level ${ difficulty }${operation_focus}${theme_focus}.

Unknown position: ${ unknown_position }.

First identify the active cell in the rules matrix for Grade=${ grade } and Difficulty=${ difficulty }. Then plan ${ quantity } clearly distinct scenarios in "scenario_plan", including planned_operands that respect BOTH the floor and the ceiling of the active cell, and planned_unknown_position that follows the unknown_position rules. Then write one problem per scenario in "problems", using exactly those operands and placing the unknown accordingly.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-5.4-mini',
    messages: [
      {
        role: 'system',
        content: system_prompt,
      },
      {
        role: 'user',
        content: user_prompt,
      },
    ],
    response_format: {
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
                    "planned_operands",
                    "planned_operation",
                    "planned_unknown_position"
                ],
                additionalProperties: false,
                properties: {
                    context: { type: "string" },
                    main_character: { type: "string" },
                    location: { type: "string" },
                    key_object: { type: "string" },

                    planned_operands: {
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "number"
                    }
                    },

                    planned_operation: {
                    type: "string"
                    },

                    planned_unknown_position: {
                    type: "string",
                    enum: ["result", "middle", "start"]
                    }
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
                    type: "string"
                    },

                    answer: {
                    type: "number"
                    },

                    question_text: {
                    type: "string"
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
    },
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = {
  generateMathProblem,
};