require("dotenv").config({ path: "../.env.local" });

const OpenAI = require("openai");
// const generateEquationPrompt = require("../utils/generate_equation");
const generateSituationPrompt = require("../utils/prompts_LLM/generate_story");
const generateQuantityRelationshipPrompt = require("../utils/prompts_LLM/generate_quantity_relationship");
const generateProblemTextPrompt = require("../utils/prompts_LLM/generate_problem");
const generateQuestionVariantsPrompt = require("../utils/prompts_LLM/generate_question_variant");
const {
  generateProblemLanguageEvaluationPrompt,
  generateProblemMathEvaluationPrompt,
} = require("../utils/prompts_LLM/evaluate_problem_difficulty");
const validateProblemEvaluation = require("../utils/compare_evaluation.js");
const generateProblemRepairPrompt = require("../utils/prompts_LLM/repair_problem_alignment_prompt");

const API_KEY = process.env.API_KEY;
const MODEL = process.env.MODEL;
const LLM_URL = process.env.LLM_URL;

const openai = new OpenAI({
  baseURL: `${LLM_URL}/v1`,
  apiKey: API_KEY,
});

async function prompting_openai(system_prompt, user_prompt, return_format){
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

    return JSON.parse(content);

  } catch (error) {
    console.error("OpenAI API Error:", error);

    if (error.response) {
      console.error(error.response.data);
    }

    throw error;
  }
}

async function call_openai_api(type = "problem", debug = false, parameters) {
  let system_prompt;
  let user_prompt;
  let return_format;

  if (debug){console.log("Parameters:\n", parameters)};

  // Still needs more testing
  if (type === "problem") {

    const storyPlanPrompt = generateSituationPrompt({
      ...parameters,
    });

    const storyPlanResult = await prompting_openai(
      storyPlanPrompt.system_prompt,
      storyPlanPrompt.user_prompt,
      storyPlanPrompt.return_format
    );

    if (debug) {
      console.log(JSON.stringify(storyPlanResult, null, 2));
    }

    const quantityRelationshipPrompt = generateQuantityRelationshipPrompt({
      ...parameters,
      situations: storyPlanResult.situations
    });

    const quantityRelationshipResult = await prompting_openai(
      quantityRelationshipPrompt.system_prompt,
      quantityRelationshipPrompt.user_prompt,
      quantityRelationshipPrompt.return_format
    );
    if (debug) {
      console.log(JSON.stringify(quantityRelationshipResult, null, 2));
    }

    const problemPrompt = generateProblemTextPrompt({
      ...parameters,
      quantity_relationship_plans: quantityRelationshipResult.quantity_relationship_plans,
    });

    const problemResult = await prompting_openai(
      problemPrompt.system_prompt,
      problemPrompt.user_prompt,
      problemPrompt.return_format
    );

    if (debug) {
      console.log(JSON.stringify(problemResult, null, 2));
    }

    const questionVariationPrompt = generateQuestionVariantsPrompt({
      ...parameters,
      problems: problemResult.problems,
      variants_per_problem: 3
    });

    const questionVariantResult = await prompting_openai(
      questionVariationPrompt.system_prompt,
      questionVariationPrompt.user_prompt,
      questionVariationPrompt.return_format
    );

    if (debug) {
      console.log(JSON.stringify(questionVariantResult, null, 2));
    }

    const selectedVariants = questionVariantResult.problem_variants.map(problem => {
      const randomVariant =
        problem.variants[Math.floor(Math.random() * problem.variants.length)];

      return {
        ...randomVariant
      };
    });

    if (debug) {
      console.log("Selected Variant:", selectedVariants)
    }

    const mathEvaluateDifficultyPrompt = generateProblemMathEvaluationPrompt({
      ...parameters,
      problems: selectedVariants,
    });

    const evaluationMathResult = await prompting_openai(
      mathEvaluateDifficultyPrompt.system_prompt,
      mathEvaluateDifficultyPrompt.user_prompt,
      mathEvaluateDifficultyPrompt.return_format
    );

    if (debug) {
      console.log(JSON.stringify(evaluationMathResult, null, 2));
    }

    const languageEvaluateDifficultyPrompt = generateProblemLanguageEvaluationPrompt({
        ...parameters,
        problems: selectedVariants,
        mathEvaluation: evaluationMathResult.evaluations.map((evaluation, index) => ({
          problem_index: index,
          equation: evaluation.equation,
          has_all_required_numbers: evaluation.has_all_required_numbers,
          missing_number_reason: evaluation.missing_number_reason,
        })),
      });

    const evaluationLanguageResult = await prompting_openai(
      languageEvaluateDifficultyPrompt.system_prompt,
      languageEvaluateDifficultyPrompt.user_prompt,
      languageEvaluateDifficultyPrompt.return_format
    );

    if (debug) {
      console.log(JSON.stringify(evaluationLanguageResult, null, 2));
    }

    comparison_to_params = validateProblemEvaluation({
        parameters,
        languageEvaluation: evaluationLanguageResult,
        mathEvaluation: evaluationMathResult,
    });

    if (debug) {
      console.log(JSON.stringify(comparison_to_params, null, 2))
    }

    const RepairPrompt = generateProblemRepairPrompt({
      // Change to variant if needed
      problems: selectedVariants, 
      parameters: parameters,
      comparison: comparison_to_params,
      quantity: parameters.quantity,
    });

    const finalResult = await prompting_openai(
      RepairPrompt.system_prompt,
      RepairPrompt.user_prompt,
      RepairPrompt.return_format
    );
    
    if (debug) {
      console.log(JSON.stringify(finalResult, null, 2));
    }

    // Final evaluation for debugging

    if (debug) {

      const lists_Problems = finalResult.problems.map(problem => {
        return {
          problem_index: problem.problem_index,
          full_problem_text: problem.fixed_full_problem_text,
        };
      });

      const mathEvaluateDifficultyPrompt = generateProblemMathEvaluationPrompt({
        ...parameters,
        problems: lists_Problems,
      });

      const evaluationMathResult = await prompting_openai(
        mathEvaluateDifficultyPrompt.system_prompt,
        mathEvaluateDifficultyPrompt.user_prompt,
        mathEvaluateDifficultyPrompt.return_format
      );

      console.log(JSON.stringify(evaluationMathResult, null, 2));

      const languageEvaluateDifficultyPrompt = generateProblemLanguageEvaluationPrompt({
        ...parameters,
        problems: lists_Problems,
        mathEvaluation: evaluationMathResult.evaluations.map((evaluation, index) => ({
          problem_index: index,
          equation: evaluation.equation,
          has_all_required_numbers: evaluation.has_all_required_numbers,
          missing_number_reason: evaluation.missing_number_reason,
        })),
      });

      const evaluationLanguageResult = await prompting_openai(
        languageEvaluateDifficultyPrompt.system_prompt,
        languageEvaluateDifficultyPrompt.user_prompt,
        languageEvaluateDifficultyPrompt.return_format
      );

      console.log(JSON.stringify(evaluationLanguageResult, null, 2));

      comparison_to_params = validateProblemEvaluation({
          parameters,
          languageEvaluation: evaluationLanguageResult,
          mathEvaluation: evaluationMathResult,
      });

      console.log(JSON.stringify(comparison_to_params, null, 2))

    }

    return finalResult.problems.map(problem => problem.fixed_full_problem_text);

  } else if (type === "help") {
    throw new Error("Help prompt not implemented yet");

  } else {
    throw new Error("Invalid type. Must be 'problem' or 'help'.");
  }
  
}

if (require.main === module) {
  async function main() {
    const result = await call_openai_api("problem", debug=true,
  // {
  //   operation: 'division',
  //   theme: null,
  //   grade: 3,
  //   quantity: 2,
  //   id: 92,
  //   difficulty_label: 'easy',
  //   total_difficulty_score: 8,
  //   number_range: '1-100',
  //   number_range_min_value: 1,
  //   number_range_max_value: 100,
  //   operation_category: 'multiplication_division',
  //   unknown_position: 'change_unknown',
  //   linguistic_complexity: 'simple_direct_sentence',
  //   linguistic_complexity_description: 'One short direct sentence.',
  //   cognitive_demand: 'direct_operation_mapping',
  //   cognitive_demand_description: 'One direct operation.',
  //   num_simple_operations: 1
  // }
//  {
//   operation: null,
//   theme: 'geld',
//   grade: 3,
//   quantity: 3,
//   id: 95,
//   difficulty_label: 'easy',
//   total_difficulty_score: 9,
//   number_range: '1-100',
//   number_range_min_value: 1,
//   number_range_max_value: 100,
//   operation_category: 'multiplication_division',
//   unknown_position: 'change_unknown',
//   linguistic_complexity: 'two_short_sentences',
//   linguistic_complexity_description: 'Two short sentences with clear wording.',
//   cognitive_demand: 'direct_operation_mapping',
//   cognitive_demand_description: 'One direct operation.',
//   num_simple_operations: 1
// }
//  {
//   operation: null,
//   theme: null,
//   grade: 3,
//   quantity: 3,
//   id: 3,
//   difficulty_label: 'easy',
//   total_difficulty_score: 8,
//   number_range: '1-100',
//   number_range_min_value: 1,
//   number_range_max_value: 100,
//   operation_category: 'addition_subtraction',
//   unknown_position: 'start_unknown',
//   linguistic_complexity: 'simple_direct_sentence',
//   linguistic_complexity_description: 'One short direct sentence.',
//   cognitive_demand: 'direct_operation_mapping',
//   cognitive_demand_description: 'One direct operation.',
//   num_simple_operations: 1
//   }
{
  operation: 'subtraction',
  theme: null,
  grade: 3,
  quantity: 1,
  id: 172,
  difficulty_label: 'medium',
  total_difficulty_score: 12,
  number_range: '500-1000',
  number_range_min_value: 500,
  number_range_max_value: 1000,
  operation_category: 'addition_subtraction',
  unknown_position: 'result_unknown',
  linguistic_complexity: 'two_short_sentences',
  linguistic_complexity_description: 'Two short sentences with clear wording.',
  cognitive_demand: 'sequential_planning',
  cognitive_demand_description: 'Two or more steps in clear order.',
  num_simple_operations: 2
}
//  {
//   operation: null,
//   theme: 'längen',
//   grade: 3,
//   quantity: 2,
//   id: 449,
//   difficulty_label: 'hard',
//   total_difficulty_score: 15,
//   number_range: '100-500',
//   number_range_min_value: 100,
//   number_range_max_value: 500,
//   operation_category: 'mixed_operations',
//   unknown_position: 'change_unknown',
//   linguistic_complexity: 'two_short_sentences',
//   linguistic_complexity_description: 'Two short sentences with clear wording.',
//   cognitive_demand: 'managing_hierarchical_structure',
//   cognitive_demand_description: 'Groups inside groups.',
//   num_simple_operations: 2
// }
// {
//   operation: null,
//   theme: 'gewichte',
//   grade: 4,
//   quantity: 1,
//   id: 449,
//   difficulty_label: 'hard',
//   total_difficulty_score: 15,
//   number_range: '100-1000',
//   number_range_min_value: 100,
//   number_range_max_value: 1000,
//   operation_category: 'mixed_operations',
//   unknown_position: 'change_unknown',
//   linguistic_complexity: 'two_short_sentences',
//   linguistic_complexity_description: 'Two short sentences with clear wording.',
//   cognitive_demand: 'managing_hierarchical_structure',
//   cognitive_demand_description: 'Groups inside groups.',
//   num_simple_operations: 2
// }
  
  );

    console.log(result);
  }

  main();
}

module.exports = {
  call_openai_api,
};