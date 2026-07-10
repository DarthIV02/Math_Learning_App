const { generateProblemTopicAssessmentPrompt } = require("../../prompts_LLM/generate_baseline");
const { parseAnswerLayoutBatch } = require("../utils/");
const { prompting_openai } = require("../../services/aiService");

const BATCH_SIZE = 5;

/**
 * Splits an array into consecutive chunks of at most `size` items each.
 * e.g. chunkArray([1..25], 10) -> [[1..10], [11..20], [21..25]]
 */
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function loadGSM8K() {
    const limit = 5;
    const url = `https://datasets-server.huggingface.co/rows?dataset=openai/gsm8k&config=main&split=train&offset=0&length=${limit}`;

    console.log("Streaming GSM8K dataset from HuggingFace API...");
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Raw problems as returned by the API: [{ question, answer }, ...]
        const dataset = data.rows.map(item => item.row);
        console.log(`\n✅ Success! Loaded ${dataset.length} problems via API.`);

        // 1. Deterministic fields computed straight from each worked solution
        //    (final_result, number_of_steps, operations_used, number_range).
        //    No LLM call needed for these -- safe to run on the whole dataset
        //    at once, batching doesn't matter here since it's local computation.
        const mathParsedProblems = parseAnswerLayoutBatch(dataset);
        console.log(`\n✅ Parsed ${mathParsedProblems.length} problems deterministically.`);

        // 2. LLM prompt needs the ORIGINAL question/answer text -- not the
        //    parsed output -- so it has something to actually read.
        //    Split into batches of BATCH_SIZE and run one call per batch.
        const batches = chunkArray(dataset, BATCH_SIZE);
        console.log(`\n✅ Split ${dataset.length} problems into ${batches.length} batch(es) of up to ${BATCH_SIZE}.`);

        const allEvaluations = [];

        for (let b = 0; b < batches.length; b++) {
            const batch = batches[b];

            const { system_prompt, user_prompt, return_format } = generateProblemTopicAssessmentPrompt({
                problems: batch,
                grade: 3,
                quantity: batch.length,
            });

            console.log(`\n➡️  Calling LLM for batch ${b + 1}/${batches.length} (${batch.length} problems)...`);
            const baselineResult = await prompting_openai(system_prompt, user_prompt, return_format);
            console.log(`✅ Batch ${b + 1}/${batches.length} done.`);

            allEvaluations.push(...baselineResult.evaluations);
        }

        console.log(`\n✅ Collected ${allEvaluations.length} evaluations across all batches.`);

        // 3. Merge everything back together, in order: original problem +
        //    deterministic math fields + LLM-classified fields + the
        //    difficulty/score lookup derived from unknown_position.
        const merged = dataset.map((problem, i) => {
            const llmEval = allEvaluations[i];

            return {
                ...problem,
                ...mathParsedProblems[i],
                ...llmEval,
            };
        });

        console.log("\nSample merged problem:", JSON.stringify(merged[0], null, 2));

        return merged;

    } catch (error) {
        console.error("❌ An error occurred:", error.message);
    }
}

if (require.main === module) {
  loadGSM8K();
}

module.exports = { loadGSM8K, chunkArray };