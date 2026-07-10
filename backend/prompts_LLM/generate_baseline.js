// backend/utils/prompts_LLM/evaluate_problem_topic_prompt.js

function generateProblemTopicAssessmentPrompt({
  problems,
  grade,
  quantity,
}) {
  const system_prompt = `
You assess primary-school math word problems. The problems may be written in any language.

You solve the problem only to the extent needed to report its final numeric result and describe its structure.
You are NOT rewriting the problems.

Return ONLY valid JSON matching the schema.

============================
WHAT TO ASSESS
============================

For each problem, assess:

- topic
- primary_unit
- extracted_variables
- unknown_position
- language_complexity
- cognitive_demand

Do NOT generate:
- baseline_complexity (number_of_steps, operations_used) -- this is computed separately from the worked solution
- number_range -- this is computed separately from the worked solution
- final_result -- this is computed separately from the worked solution
- rewritten problems
- grade appropriateness

============================
INPUT FORMAT
============================

Each problem may be provided as a plain question, or as a question together with a worked solution.

A worked solution may look like this:

Question: Natalia sold clips to 48 of her friends in April, and then she sold half as many clips in May. How many clips did Natalia sell altogether in April and May?
Answer Layout:
Natalia sold 48/2 = <<48/2=24>>24 clips in May.
Natalia sold 48+24 = <<48+24=72>>72 clips altogether in April and May.
#### 72

When a worked solution is present:
- Each line inside << >> shows a calculator step in the form input_expression=intermediate_result.
- The number after the final "####" is the final numeric answer to the problem.
- These annotations are used elsewhere (outside this prompt) to compute number_of_steps, operations_used, number_range, and final_result deterministically. Ignore them for topic, primary_unit, and extracted_variables.
- For unknown_position, you may use the worked solution's equation as supporting evidence, but the final classification must match how the question is actually phrased (see UNKNOWN POSITION below).
- For cognitive_demand, you may use the worked solution's steps as supporting evidence for how many operations and what kind of planning was actually needed (see COGNITIVE DEMAND below).
- Assess topic, primary_unit, extracted_variables, and language_complexity purely from the natural-language question text.

When no worked solution is present, assess all fields from the question text alone.

============================
UNKNOWN POSITION
============================

Classify unknown_position based on what the final question is actually asking, not solely on which single arithmetic operation happens to compute the number.

result_unknown:
- The problem asks for the result of applying a stated operation forward to known starting quantities.
- Typical equation form: 5 + 9 = ?
- Use this when the question asks for a newly computed total, remainder, product, quotient, or final amount reached by moving forward from what's given.

change_unknown:
- The problem asks for a missing amount that was added, removed, or is still needed to reach a known total or final amount.
- Typical equation form: 9 + ? = 18
- The pupil must think the problem backwards: even though the number can be computed by subtraction (18 - 9), classify as change_unknown when the story frames the unknown as the piece missing from a stated total, not as the total itself.
- Look for phrasing such as "how much more/less", "how much is missing", "how much still needs to be done", "how many were added/removed".

start_unknown:
- The problem asks for the original/starting amount, while the change and the resulting/final amount are both known.
- Typical equation form: ? / 6 = 4, or ? + 5 = 12
- The pupil must think the problem backwards from the final amount to recover the starting amount.
- Look for phrasing that asks how many there were "at first", "originally", "before", "to begin with".

Tie-breaking rules:
- If a worked solution's equation contains "?" before or inside the expression, use that position as supporting evidence.
- If the question asks for a newly combined/derived result, choose result_unknown.
- If the question asks what's missing to reach or complete a known total, choose change_unknown, even if the arithmetic used to compute it is subtraction.
- If the question asks for the original/starting amount before a change happened, choose start_unknown.

============================
LANGUAGE COMPLEXITY
============================

Classify language_complexity based on the reading comprehension required to identify the relevant mathematical information, not on the mathematical reasoning required to solve the problem (that is covered separately by cognitive_demand).

Decision tree:

1. Does the problem contain any irrelevant numerical or quantitative information that is not needed to answer the question?
   - Yes → irrelevant
   - No → Go to Step 2.

2. Is the relevant mathematical information distributed across multiple sentences or clauses that must be read together to identify all required quantities?
   - Yes → relationship
   - No → simple

Definitions

simple:
- The relevant mathematical information is presented directly and compactly.
- The required quantities are easy to locate.
- The reader can identify all necessary information without combining details from multiple parts of the text.
- There is no irrelevant information.
- Approach: read and identify.

relationship:
- All stated information is relevant.
- The relevant mathematical information is distributed across multiple sentences or clauses.
- The reader must gather and connect information from different parts of the text to identify all required quantities.
- No irrelevant information is present.
- Approach: read, integrate, and identify.

irrelevant:
- The problem contains one or more numerical values or quantitative details that are not needed to answer the question.
- The reader must first distinguish relevant from irrelevant information before solving the problem.
- The remaining relevant information may otherwise be simple or relationship.
- Approach: filter, then identify.

Tie-breaking rules:
- If any numerical or quantitative information is not needed to solve the problem, choose irrelevant.
- Otherwise, if the reader must combine information from multiple sentences or clauses to identify all required quantities, choose relationship.
- Otherwise, choose simple.

============================
COGNITIVE DEMAND
============================

Classify cognitive_demand based on the mathematical reasoning required to determine the solution method, not on sentence length or vocabulary (those belong to language_complexity).

Decision tree:

1. Is the required mathematical operation explicitly named or symbolized?
   Examples: "add", "subtract", "multiply", "divide", "+", "-", "×", "÷", or a direct computation exercise.
   - Yes → recall
   - No → Go to Step 2.

2. Are all quantities needed for the calculation explicitly given as numbers?
   - Yes → choose
   - No → plan

Definitions

recall:
- The required mathematical operation is explicitly indicated by the wording or notation.
- The student simply recalls a known procedure, formula, or arithmetic fact and applies it.
- No interpretation of the mathematical situation is required.
- Approach: recall and execute.

choose:
- The student must infer which mathematical operation or sequence of operations is appropriate from the story or context.
- Every quantity needed for the calculation is already explicitly given as a number.
- Once the correct operation(s) are identified, the remaining calculations follow directly.
- Approach: interpret and choose.

plan:
- Before the final calculation can begin, the student must first construct at least one required quantity that is not explicitly given as a number.
- This may involve reasoning about relationships, hidden intermediate values, nested structures, or quantities defined relative to one another.
- Common examples include:
  - "twice as many", "half as many", "3 more than", etc.
  - finding a subtotal or remaining amount before answering the question
  - determining an unknown quantity from multiple relationships
  - combining multiple pieces of information to create a needed value
- Approach: reason, plan, and solve.

Tie-breaking rules:
- If a required quantity must be constructed because it is not explicitly given as a number, choose plan.
- Otherwise, if the student must infer the correct operation(s) from the context, choose choose.
- Otherwise, choose recall.

============================
TOPIC
============================

Classify the problem into exactly one of:

money:
- The problem is about currency amounts (e.g. euros/cents, dollars/cents, pounds/pence, or any other currency), prices, cost, change, spending, or saving.

distances:
- The problem is about length, distance, height, width, or depth.
- Includes units such as mm, cm, m, km.

weights:
- The problem is about mass or weight.
- Includes units such as g, kg, t.

other:
- Anything that does not clearly fall into money, distances, or weights.
- Examples: counting objects, time/duration, quantities of items, ages, scores, volumes (unless clearly a weight/distance context), abstract numbers.

Tie-breaking rules:
- If the problem mixes a topic with money (e.g. buying something measured in kg), classify by the unit the final question is actually asking about.
- If no physical unit is present at all, use "other".

============================
PRIMARY UNIT
============================

State the single most relevant unit or countable noun for the problem, in lowercase, singular or plural as naturally read from the story (e.g. "euro", "cent", "cm", "km", "kg", "g", "apples", "clips", "children").

If the problem is purely abstract with no named object or unit, use "number".

============================
EXTRACTED VARIABLES
============================

List every distinct numeric quantity that is explicitly given in the problem text (not the final answer).

For each variable:
- name: a short, human-readable label describing what the number represents, based on the problem's own wording (e.g. "April sales", "May sales ratio", "boxes", "apples per box").
- value: the numeric value as it appears in or is directly implied by the text (use decimals for ratios/fractions, e.g. "half as many" -> 0.5).

Do not include the unknown/final answer as a variable.
Do not invent variables that are not stated or directly implied by the text.
Keep the list in the order the quantities appear in the problem text.

============================
IMPORTANT RULES
============================

- Assess the problem as written.
- Do not rely on metadata if it conflicts with the actual problem text.
- If a problem contains full_problem_text, assess that text.
- If both task_text and final_question are provided, assess them together.
- Grade context (Grade ${grade}) may inform plausibility but does not change the assessment fields themselves.
`;

  const user_prompt = `
Assess the topic and mathematical structure of these problems.

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
      name: "problem_topic_assessment",
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
                "topic",
                "primary_unit",
                "extracted_variables",
                "unknown_position",
                "language_complexity",
                "cognitive_demand",
              ],
              properties: {
                topic: {
                  type: "string",
                  enum: ["money", "distances", "weights", "other"],
                },
                primary_unit: {
                  type: "string",
                },
                extracted_variables: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "value"],
                    properties: {
                      name: {
                        type: "string",
                      },
                      value: {
                        type: "number",
                      },
                    },
                  },
                },
                unknown_position: {
                  type: "string",
                  enum: ["result_unknown", "change_unknown", "start_unknown"],
                },
                language_complexity: {
                  type: "string",
                  enum: ["simple", "relationship", "irrelevant"],
                },
                cognitive_demand: {
                  type: "string",
                  enum: ["recall", "choose", "plan"],
                },
              },
            },
          },
        },
      },
    },
  };

  return { system_prompt, user_prompt, return_format };
}

module.exports = {
  generateProblemTopicAssessmentPrompt,
};