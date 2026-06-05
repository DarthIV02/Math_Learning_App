require("dotenv").config({ path: "../.env.local" });

const OpenAI = require("openai");
const generate_problem_prompt = require("../utils/prompts_LLM/generate_problem");

const API_KEY = process.env.API_KEY;
const MODEL = process.env.MODEL;
const LLM_URL = process.env.LLM_URL;

const openai = new OpenAI({
  baseURL: `${LLM_URL}/v1`,
  apiKey: API_KEY,
});

async function call_openai_api(type = "problem", parameters) {
  let system_prompt;
  let user_prompt;
  let return_format;

  if (type === "problem") {
    ({ system_prompt, user_prompt, return_format } =
      generate_problem_prompt(parameters));

  console.log("System Prompt:", system_prompt);

  } else if (type === "help") {
    throw new Error("Help prompt not implemented yet");

  } else {
    throw new Error("Invalid type. Must be 'problem' or 'help'.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,

      messages: [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: user_prompt,
        },
      ],

      response_format: return_format,
    });

    const content = response.choices[0].message.content;
    const usage = response.usage;

    console.log(
      `Tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}, total: ${usage.total_tokens}`
    );

    return content;

  } catch (error) {
    console.error("OpenAI API Error:", error);

    if (error.response) {
      console.error(error.response.data);
    }

    throw error;
  }
}

if (require.main === module) {
  async function main() {
    const result = await call_openai_api("problem", 
// {
//       operation: 'division',
//       theme: null,
//       grade: 3,
//       quantity: 6,
//       id: 196,
//       difficulty_label: 'easy',
//       total_difficulty_score: 9,
//       number_range: '100-500',
//       number_range_min_value: 100,
//       number_range_max_value: 500,
//       operation_category: 'multiplication_division',
//       unknown_position: 'result_unknown',
//       linguistic_complexity: 'clear_relationship',
//       linguistic_complexity_description: 'Clear but slightly more complex relationship.',
//       cognitive_demand: 'direct_operation_mapping',
//       cognitive_demand_description: 'One direct operation.',
//       num_simple_operations: 1
//     }
{
operation: null,
theme: 'geld',
grade: 3,
quantity: 5,
id: 91,
difficulty_label: 'easy',
total_difficulty_score: 8,
number_range: '500-1000',
number_range_min_value: 500,
number_range_max_value: 1000,
operation_category: 'addition_subtraction',
unknown_position: 'result_unknown',
linguistic_complexity: 'simple_direct_sentence',
linguistic_complexity_description: 'One short direct sentence.',
cognitive_demand: 'direct_operation_mapping',
cognitive_demand_description: 'One direct operation.',
num_simple_operations: 1
}
  
  );

    console.log(result);
  }

  main();
}

module.exports = {
  call_openai_api,
};