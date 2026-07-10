const { generateProblemTopicAssessmentPrompt } = require("../prompts_LLM/generate_baseline");
const { parseAnswerLayoutBatch } = require("../utils/parse_math_gsm8k");
const { prompting_openai } = require("../services/aiService");
const { loadLookupCache } = require("../db/lookupCache");
const { saveSeedProblem, getExistingExternalIds } = require("../utils/loadSeedTobackend");

const BATCH_SIZE = 5;
const SOURCE = "gsm8k";

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

async function loadGSM8K(limit = 15) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=openai/gsm8k&config=main&split=train&offset=0&length=${limit}`;

    console.log("Streaming GSM8K dataset from HuggingFace API...");
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Raw problems as returned by the API: [{ question, answer }, ...].
        // Keep row_idx separately (not merged into each problem object) so
        // it doesn't clutter what the LLM prompt sees, but we can still use
        // it as a stable external_id for de-duping re-imports.
        const rawDataset = data.rows.map(item => item.row);
        const rawExternalIds = data.rows.map(item => item.row_idx);
        console.log(`\n✅ Success! Loaded ${rawDataset.length} problems via API.`);

        // 1. Check which of these were already imported, in ONE query --
        //    and drop them BEFORE any parsing or LLM calls happen. This is
        //    the expensive step to avoid re-doing: a partially-duplicate
        //    batch shouldn't cost an LLM call just because a couple of its
        //    rows are new.
        await loadLookupCache();
        const existingIds = await getExistingExternalIds(SOURCE, rawExternalIds);

        const dataset = [];
        const externalIds = [];
        let alreadyImported = 0;

        for (let i = 0; i < rawDataset.length; i++) {
            if (existingIds.has(String(rawExternalIds[i]))) {
                alreadyImported++;
                continue;
            }
            dataset.push(rawDataset[i]);
            externalIds.push(rawExternalIds[i]);
        }

        console.log(`\n✅ ${alreadyImported} problem(s) already imported -- skipped before parsing/LLM.`);
        console.log(`✅ ${dataset.length} new problem(s) to process.`);

        if (dataset.length === 0) {
            console.log("\nNothing new to do.");
            return [];
        }

        // 2. Deterministic fields computed straight from each worked solution
        //    (final_result, number_of_steps, operations_used, number_range).
        //    No LLM call needed for these -- safe to run on the whole
        //    (already-filtered) dataset at once.
        const mathParsedProblems = parseAnswerLayoutBatch(dataset);
        console.log(`\n✅ Parsed ${mathParsedProblems.length} problems deterministically.`);

        // 3. LLM prompt needs the ORIGINAL question/answer text -- not the
        //    parsed output -- so it has something to actually read.
        //    Split the NEW problems into batches of BATCH_SIZE and run one
        //    call per batch.
        const batches = chunkArray(dataset, BATCH_SIZE);
        console.log(`\n✅ Split ${dataset.length} new problem(s) into ${batches.length} batch(es) of up to ${BATCH_SIZE}.`);

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

        // 4. Merge everything back together, in order: original problem +
        //    deterministic math fields + LLM-classified fields.
        const merged = dataset.map((problem, i) => {
            const llmEval = allEvaluations[i];

            return {
                ...problem,
                ...mathParsedProblems[i],
                ...llmEval,
            };
        });

        console.log("\nSample merged problem:", JSON.stringify(merged[0], null, 2));

        // 5. Persist each new, assessed problem into seed_problems.
        const savedIds = [];
        let skippedOnSave = 0;
        for (let i = 0; i < merged.length; i++) {
            const id = await saveSeedProblem(merged[i], null, {
                source: SOURCE,
                externalId: externalIds[i],
            });
            if (id === null) {
                skippedOnSave++; // race condition safety net -- shouldn't normally happen given the upfront filter
            } else {
                savedIds.push(id);
            }
        }

        console.log(`\n✅ Saved ${savedIds.length} new seed problems to the database. IDs:`, savedIds);
        if (skippedOnSave > 0) {
            console.log(`ℹ️  ${skippedOnSave} problem(s) were saved by another process between the check and the insert.`);
        }

        return merged;

    } catch (error) {
        console.error("❌ An error occurred:", error.message);
    }
}

if (require.main === module) {
  const numSamples = process.argv[2] || 10; 
  
  console.log(`Loading GSM8K with ${numSamples} samples...`);
  loadGSM8K(numSamples);
}

module.exports = { loadGSM8K, chunkArray };