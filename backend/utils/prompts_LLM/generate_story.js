// backend/utils/prompts_LLM/generate_situation_prompt.js

function normalizeTheme(theme) {
  if (["geld", "gewichte", "längen"].includes(theme)) {
    return theme;
  }

  return "none";
}

function buildThemeHint(theme, grade) {
  switch (theme) {
    case "geld":
      return `
Use a money-related situation.
Good contexts:
- buying snacks, ice cream, books, toys, tickets
- pocket money
- saving for something
- a school fair or market stall

Keep the situation child-centered.
`;

    case "gewichte":
      return `
Use a weight-related situation.
Good contexts:
- baking
- cooking
- fruit or vegetables
- school bags
- parcels
- animal food

Keep the situation child-centered.
`;

    case "längen":
      if (Number(grade) === 3) {
        return `
Use a length-related situation with simple everyday objects or movement.
Good contexts:
- running or walking a route
- measuring a ribbon, rope, band, or string
- building a paper chain or garland
- measuring jumps in sports
- comparing paths on the schoolyard
- marking a simple race track

Use simple words like:
- Weg
- Strecke
- Runde
- Band
- Seil
- Stück
- Zaun
- Schulhof
- Garten

Avoid technical or construction-like contexts:
- no rectangles or perimeter
- no arcs or curved sections
- no metal fences or construction planning
- no complex garden/building projects
- no words like Segment, Abschnitt, Umzäunung, Bogen, Viertelkreis
`;
      }

      return `
Use a length-related situation.
Good contexts:
- routes
- sports distances
- ribbons or ropes
- garden paths
- simple fences
- maps
- classroom measuring

Keep the situation concrete and child-friendly.
Avoid overly technical geometry or construction language.
`;

    default:
      return `
Choose any child-relatable everyday situation, such as:
- school
- sports
- cooking
- shopping
- animals
- playgrounds
- trips
- crafts
- gardening
- collecting
- birthdays
`;
  }
}

function buildGradeHint(grade) {
  if (Number(grade) === 3) {
    return `
Grade 3 curriculum:
- Number range typically up to 1000.
- One- or two-step word problems.
- Basic multiplication and simple division.
- Mental arithmetic is preferred.
- Topics include money, length, time, and weight.
- Situations may involve simple tables or bar charts.

Situation guidelines:
- Use familiar everyday experiences.
- Keep the situation concrete and easy to picture.
- Keep the story child-centered.
- Avoid adult planning, technical work, construction projects, or many connected details.
- Avoid difficult words and long noun compounds.
`;
  }

  if (Number(grade) === 4) {
    return `
Grade 4 curriculum:
- Number range up to 10 000 and beyond.
- All four operations.
- Multi-step problems.
- Measurement units and conversions.
- Data collection, tables, and bar charts.

Situation guidelines:
- Situations may contain larger collections, projects, routes, purchases, or comparisons.
- Multiple related quantities may naturally occur.
- The context can support more complex reasoning while remaining realistic for primary-school pupils.
- Avoid unnecessary technical language.
`;
  }

  return `
The situation should be appropriate for German primary-school pupils.
`;
}

function generateSituationPrompt({
  theme,
  grade,
  quantity
}) {
  const normalizedTheme = normalizeTheme(theme);

  const system_prompt = `
You create realistic German primary-school math problem situations.

Generate only flexible situations, not full math problems.

Requirements:
- Grade: ${grade}
- Theme: ${normalizedTheme}
- ${buildThemeHint(normalizedTheme, grade)}
- The situation must be realistic, concrete, and relatable for children.
- The situation should be adaptable later into easier or harder math word problems.
- Include enough real-world detail to support different possible questions.
- Do not include equations, answers, solutions, hints, or calculations.
- Do not write the final math question.
- Avoid direct operation stories like "someone has some things, gets more, and then has more."
- Prefer leaving exact quantities open unless a number is naturally part of the setting.

============================
GRADE CURRICULUM
============================

${buildGradeHint(grade)}

============================
STYLE CHECK
============================

Before returning a situation, check:
- Could a Grade ${grade} pupil easily imagine this?
- Are the words simple enough for Grade ${grade}?
- Is the situation about children or familiar everyday activities?
- Is the situation free of unnecessary technical or adult planning language?

If not, simplify the situation before returning it.

Return only valid JSON matching the schema.
`;

  const user_prompt = `
Create ${quantity} flexible situation(s).

Parameters:
${JSON.stringify(
  {
    grade,
    theme: normalizedTheme,
    quantity
  },
  null,
  2
)}
`;

  const return_format = {
    type: "json_schema",
    json_schema: {
      name: "situation_generation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["situations"],
        properties: {
          situations: {
            type: "array",
            minItems: Number(quantity),
            maxItems: Number(quantity),
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "scenario_summary",
                "main_character",
                "location",
                "key_objects"
              ],
              properties: {
                scenario_summary: {
                  type: "string",
                  description:
                    "A 2–4 sentence natural-language situation. Do not write a math question."
                },
                main_character: {
                  type: "string"
                },
                location: {
                  type: "string"
                },
                key_objects: {
                  type: "array",
                  minItems: 2,
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

module.exports = generateSituationPrompt;