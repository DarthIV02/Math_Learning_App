function get_theme(theme){
  if (theme){
    return `
    ============================
    THEME
    ============================

    Return ${theme} in Theme.

    `;
  } else {
    return `
    ============================
    THEME
    ============================

    Based on the problem, return the main topic of the problem:
    - "geld" if the main task is about managing money or prices of objects.
    - "gewichte" if the problem talks about calculating weights, or weighing objects.
    - "längen" if the problem talks about calculating distances, or any distance of an object.
    - "other" in any other case.

    `;
  }
}

function generateProblemVisualSupportPrompt({
  problems,
  grade,
  quantity,
  theme,
}) {
  const system_prompt = `
You analyze German primary-school math word problems.

Your task is to extract student-friendly visual support for solving each problem.

Return ONLY valid JSON matching the schema.

============================
WHAT TO GENERATE
============================

For each problem, generate:

- problem_index
- solution
- main_objects
- stickers
- colors
- initial_tip

============================
SOLUTION
============================

Return the answer or answers to the final question as a single JSON object.

Each key is a short German noun describing what the value represents.
Each value is the numeric or string answer.

If the problem asks for one value:
{ "Luftballons": 12 }

If the problem asks for multiple values:
{ "Jungen": 12, "Mädchen": 14 }

Rules:
- Use short, clear German nouns as keys (matching the language of the problem).
- For one problem, use object of the question as the label. 
  For example if the question is: "Wie viel Milliliter Wasser bleiben in der Flasche?" then the object should be "Milliliter"
- Use numbers when the answer is purely numeric.
- Use strings only when a unit or non-numeric value is necessary.
- Do not include step-by-step calculations.

============================
MAIN OBJECTS
============================

Return ALL concrete objects mentioned in the problem that students could draw or use as stickers.

Examples:
- Äpfel
- Körbe
- Wassertank
- Wassertropfen
- Beetabschnitte
- Blumenbeet
- Luftballons
- Kisten

Rules:
- Use simple German plural nouns.
- Include EVERY distinct object or container mentioned in the problem, not just the main one.
- If the problem mentions a container AND its contents, include both (e.g. "Wassertank" AND "Wassertropfen").
- If the problem mentions different groups or sections (e.g. "Beetabschnitte", "Blumenbeet"), include each as a separate object.
- Do not include abstract math words like "Summe", "Differenz", "Gleichung", "Zahl", or "Antwort".
- Aim for 2–5 objects per problem. Never return just one unless the problem truly has only one object.

============================
STICKERS
============================

Return emojis that represent the main_objects.

Rules:
- stickers must be an array of emoji strings.
- The order must match main_objects exactly — one emoji per object.
- If an object has two aspects (e.g. a tank and water inside it), pick the emoji that best shows each separately.
- If no perfect emoji exists, choose the closest visual representation.
- Never return fewer stickers than main_objects.

Example:
main_objects: ["Wassertank", "Wassertropfen", "Beetabschnitte", "Blumenbeet"]
stickers: ["🪣", "💧", "🌱", "🌸"]

============================
COLORS
============================

Return colors only if the problem explicitly mentions colors.

Examples:
- red
- green
- blue
- yellow
- orange
- purple
- black
- white
- brown
- pink
- gray

Rules:
- Return color names in English lowercase.
- If the problem does not mention colors, return [].
- Do not infer colors from objects.
- Example: apples do not imply red unless the text says red apples.

============================
INITIAL TIP
============================

Return one short student-friendly hint.

The hint should help the student start drawing or grouping the problem.

Rules:
- Suitable for Grade ${grade}.
- Do not solve the problem.
- Do not give the final operation explicitly if avoidable.
- Mention what to draw, group, mark, or count first.
- Keep it short.

Good examples:
- "Start by drawing the apples in equal groups."
- "Draw the boxes first, then put the same number of pencils in each box."
- "Mark the red balls and the blue balls separately."

Bad examples:
- "Add 12 and 8 to get 20."
- "The answer is 20."
- "Use multiplication and then subtraction."

${get_theme(theme)}

============================
Operations
============================

- Create an equation to solve the problem
- Then return all the operations needed to compute this result:
  Choose from: addition, substraction, multiplication, division

============================
IMPORTANT RULES
============================

- Analyze the problem as written.
- If a problem contains full_problem_text, use that text.
- If both task_text and final_question are provided, use them together.
- Return exactly ${quantity} problem objects.
- problem_index should match the index/order of the input problem.
- Keep all text simple and child-friendly.
- problem_index must always start at 0 for the first problem and increment by 1.
- The first problem in the input always gets problem_index 0, the second gets 1, the third gets 2.
- Never skip or repeat a problem_index.
`;

  const user_prompt = `
Generate visual solving support for these math word problems.

Parameters:
${JSON.stringify(
  {
    grade,
    quantity,
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
      name: "problem_visual_support",
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
                "solution",
                "main_objects",
                "stickers",
                "colors",
                "initial_tip",
                "topic",
                "operations"
              ],
              properties: {
                problem_index: {
                  type: "integer"
                },
                solution: {
                    type: "object",
                    additionalProperties: {
                        anyOf: [
                        { type: "number" },
                        { type: "string" }
                        ]
                    },
                    description: "Key-value pairs where each key is a short German noun and each value is the answer."
                },
                main_objects: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description:
                    "Concrete objects students should draw or use as stickers."
                },
                stickers: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description:
                    "Emoji stickers representing the main_objects in the same order."
                },
                colors: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description:
                    "Explicitly mentioned colors only, in English lowercase. Empty array if none."
                },
                initial_tip: {
                  type: "string",
                  description:
                    "A short hint that helps the student start drawing without solving the problem."
                },
                topic: {
                  type: "string",
                  enum: ['geld', 'gewichte', 'längen', 'other'], // Change if adding other topics
                  description: "The main topic that the problem talks about"
                },
                operations: {
                type: "array",
                  items: {
                    type: "string",
                    enum: ['addition', 'subtraction', 'multiplication', 'division'],
                  },
                  description: "Explicitly mention the operations needed to solve the missing value or values."
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

module.exports = generateProblemVisualSupportPrompt;