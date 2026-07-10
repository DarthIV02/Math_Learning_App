function buildNumberRangeHint({
  number_range,
  number_range_min_value,
  number_range_max_value
}) {
  return `
- Use quantities derived from integer base values in this range: ${number_range}
- Minimum base value: ${number_range_min_value}
- Maximum base value: ${number_range_max_value}

INTERPRETATION RULES:
- The underlying value must stay an integer within the range.
- The displayed value may use natural units.

Examples:
- 511 tickets → value: 511, display_value: "511", base_unit: "tickets"
- 511 meters → value: 511, display_value: "511 m", base_unit: "m"
- 511 grams → value: 511, display_value: "511 g", base_unit: "g"
- 511 cents → value: 511, display_value: "€5.11", base_unit: "cent"
- 243 cents → value: 243, display_value: "€2.43", base_unit: "cent"

For money contexts:
- Interpret integer values as cents when prices should be realistic.
- Display prices in euros.
- The math must still use the integer cent value.
- Avoid unrealistic prices like €511 for a child ticket.

For measurement contexts:
- Integers may represent cm, m, g, kg, ml, l, or similar units.
- Choose the unit that sounds natural in the situation.
`;
}

function buildThemeQuantityRules(theme) {
  if (theme === "längen") {
    return `
LENGTH-SPECIFIC RULES:
- Prefer everyday length situations that children can easily imagine.
- Use simple route parts, ribbons, ropes, fences, paths, swimming lanes, running laps, jumps, or classroom measurements.
- Avoid technical geometry language such as:
  - Viertelkreis
  - Bogen
  - gekrümmter Abschnitt
  - Rechteckform
  - Umfang of complex shapes
  - radius, diameter, arc length
- Do not create artificial formulas like 4 × straight section + 4 × curve.
- Prefer natural relationships:
  - first route part + second route part
  - already walked + still to walk
  - planned length − existing length
  - several equal laps
  - there and back
  - one ribbon per child
  - same length repeated several times
- Use units naturally:
  - cm for ribbons, paper strips, classroom objects
  - m for running, walking, garden paths, playground distances
  - km only for Grade 4 trips or longer routes
`;
  }

  if (theme === "geld") {
    return `
MONEY-SPECIFIC RULES:
- Use realistic prices, tickets, pocket money, shopping, saving, or shared costs.
- Interpret integer values as cents when needed.
- Display prices naturally in euros.
`;
  }

  if (theme === "gewichte") {
    return `
WEIGHT-SPECIFIC RULES:
- Use recipes, fruit, parcels, backpacks, animal food, flour, sand, or harvests.
- Use g for ingredients or small objects.
- Use kg for heavier everyday objects.
`;
  }

  return "";
}

function buildOperationRules(operation) {
  if (!operation) {
    return `
- Choose the most natural operation structure for the situation.
`;
  }

  switch (operation) {
    case "addition":
      return `
- The situation should naturally require addition.
- Combine quantities into a total.
- Examples:
  - several route parts form one route
  - several ribbon pieces form one garland
  - several purchases form one total cost
- Avoid subtraction, multiplication, or division as the primary operation.
`;

    case "subtraction":
      return `
- The situation should naturally require subtraction.
- One quantity is removed, used, spent, or missing.
- Examples:
  - remaining money
  - remaining distance
  - missing ribbon length
  - remaining ingredients
- Avoid addition, multiplication, or division as the primary operation.
`;

    case "multiplication":
      return `
- The situation should naturally require multiplication.
- Use equal groups.
- Examples:
  - several laps of the same route
  - several identical ribbon pieces
  - several ticket groups
  - repeated equal quantities
- Avoid subtraction or division as the primary operation.
`;

    case "division":
      return `
- The situation should naturally require division.
- Use sharing or grouping.
- Examples:
  - ribbon pieces shared among children
  - money shared equally
  - ingredients divided into portions
  - route divided into equal sections
- Avoid addition or subtraction as the primary operation.
`;

    default:
      return `
- Choose the most natural operation structure for the situation.
`;
  }
}

function buildOperationCategoryRules(operation_category) {
  switch (operation_category) {
    case "addition_subtraction":
      return `
- The relationship must use only addition and/or subtraction.
- Do not use multiplication or division.
- Good structures:
  - part + part = total
  - total - part = remainder
  - start + change = result
  - total - known parts = missing part
`;

    case "multiplication_division":
      return `
- The relationship must use only multiplication and/or division.
- Do not use addition or subtraction.
- Use equal groups, repeated equal quantities, sharing, or grouping.
- Good structures:
  - number of groups × amount per group = total
  - total ÷ number of groups = amount per group
  - total ÷ amount per group = number of groups
`;

    case "mixed_operations":
      return `
- The relationship must combine both operation families:
  - at least one addition/subtraction operation
  - and at least one multiplication/division operation
- Do not create a problem that only uses addition/subtraction.
- Do not create a problem that only uses multiplication/division.
- Good structures:
  - groups × amount per group + extra amount
  - total - groups × amount per group
  - total ÷ group size + extra amount
  - groups × amount per group - removed amount
`;

    default:
      return `
- Choose the most natural operation category for the situation.
`;
  }
}

function generateQuantityRelationshipPrompt({
  situations,
  grade,
  theme,
  quantity,
  operation,
  operation_category,
  number_range,
  number_range_min_value,
  number_range_max_value
}) {
  const system_prompt = `
You enrich German primary-school math situations with concrete quantities and relationships.

You receive flexible situations that do NOT yet contain exact numbers.

Your task is to identify useful quantities and describe how they relate to each other.

You are NOT writing the final word problem yet.

Return ONLY valid JSON matching the schema.

============================
IMPORTANT PRINCIPLE
============================

Do NOT write:
- the final question
- the solution
- hints
- step-by-step calculations
- a finished word problem

Only add:
- given quantities
- a target quantity
- the relationship or change between quantities

============================
ACTIVE PARAMETERS
============================

Grade: ${grade}
Theme: ${theme || "none"}
Quantity: ${quantity}

============================
NUMBER RANGE RULES
============================

${buildNumberRangeHint({
  number_range,
  number_range_min_value,
  number_range_max_value
})}

============================
QUALITY RULES
============================

For each situation:
- Keep quantities realistic for the context.
- Keep relationships mathematically usable later.
- Avoid artificial wording like "the result of the subtraction".
- Prefer real-world relationships such as:
  - taking away
  - adding more
  - comparing two amounts
  - dividing fairly
  - grouping into equal sets
  - repeated equal groups
  - remaining amount
  - total amount
  - difference between two quantities
  - price per item and total cost
  - distance parts and total distance
  - weight per package and total weight

============================
GRADE APPROPRIATENESS
============================

Grade 3:
- Use one or two simple relationships.
- Quantities should support mental arithmetic.
- Avoid too many interacting numbers.

Grade 4:
- You may use two or three related quantities.
- Multi-step relationships are allowed.
- Measurement units and conversions are allowed if realistic.

============================
THEME-SPECIFIC QUANTITY RULES
============================

${buildThemeQuantityRules(theme)}

============================
OPERATION RULES
============================

Requested operation: ${operation || "none"}
Requested operation_category: ${operation_category || "none"}

${buildOperationRules(operation)}

${buildOperationCategoryRules(operation_category)}

IMPORTANT:
- If operation is given, the relationship must include that operation.
- If operation is null, use operation_category as the main constraint.
- operation_category must match possible_operation_structure.
- Do not ignore operation_category.

============================
OUTPUT REQUIREMENTS
============================

For each situation, return:
- original_scenario_summary
- given_quantities
- target_quantity
- relationship_description
- possible_operation_structure
- naturalness_notes
`;

  const user_prompt = `
Add concrete quantities and relationships to these situations.

Parameters:
${JSON.stringify(
  {
    grade,
    theme,
    quantity,
    number_range,
    number_range_min_value,
    number_range_max_value,
    operation,
    operation_category,
  },
  null,
  2
)}

Situations:
${JSON.stringify(situations, null, 2)}
`;

  const return_format = {
    type: "json_schema",
    json_schema: {
      name: "quantity_relationship_generation",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["quantity_relationship_plans"],
        properties: {
          quantity_relationship_plans: {
            type: "array",
            minItems: Number(quantity),
            maxItems: Number(quantity),
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "original_scenario_summary",
                "given_quantities",
                "target_quantity",
                "relationship_description",
                "possible_operation_structure",
                "naturalness_notes"
              ],
              properties: {
                original_scenario_summary: {
                  type: "string"
                },
                given_quantities: {
                  type: "array",
                  minItems: 2,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                      "value",
                      "display_value",
                      "base_unit",
                      "display_unit",
                      "object",
                      "role_in_situation"
                    ],
                    properties: {
                      value: {
                        type: "integer",
                        description:
                          "The underlying integer value used for calculation."
                      },
                      display_value: {
                        type: "string",
                        description:
                          "Natural display form, e.g. '€5.11', '511 m', '511 g'."
                      },
                      base_unit: {
                        type: "string",
                        description:
                          "Calculation unit, e.g. cent, m, cm, g, kg, ml, Stück."
                      },
                      display_unit: {
                        type: "string",
                        description:
                          "Displayed unit, e.g. €, m, cm, g, kg, l, Stück."
                      },
                      object: {
                        type: "string"
                      },
                      role_in_situation: {
                        type: "string"
                      }
                    }
                  }
                },
                target_quantity: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "base_unit",
                    "display_unit",
                    "object",
                    "what_should_be_found"
                  ],
                  properties: {
                    base_unit: {
                      type: "string"
                    },
                    display_unit: {
                      type: "string"
                    },
                    object: {
                      type: "string"
                    },
                    what_should_be_found: {
                      type: "string"
                    }
                  }
                },
                relationship_description: {
                  type: "string"
                },
                possible_operation_structure: {
                  type: "string",
                  enum: [
                    "addition",
                    "subtraction",
                    "multiplication",
                    "division",
                    "addition_subtraction",
                    "multiplication_division",
                    "multi_step",
                    "comparison",
                    "measurement_conversion",
                    "data_interpretation"
                  ]
                },
                naturalness_notes: {
                  type: "array",
                  minItems: 1,
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

module.exports = generateQuantityRelationshipPrompt;