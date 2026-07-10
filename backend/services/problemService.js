const db = require('../db/pool');
const aiService = require('./aiService');
const {getIdByName, getNumberRangeId, getOperationCountId, getOperationIds} = require('../utils/get_db')

async function getProblemsByIds(ids, includeTips = false) { 
  // This is what it ultimately returns from the db when problems are created

  if (!ids.length) return [];

  const { rows } = await db.query(
    `
    SELECT
      p.id,
      p.question_text,
      p.subject_object,
      p.correct_answers,
      p.emojis,
      p.colors,
      p.grade,

      oc.num_operations AS num_simple_operations,
      p.total_difficulty_score,
      p.difficulty_label,

      t.id AS theme_id,
      t.name AS theme_name,

      nr.id AS number_range_id,
      nr.name AS number_range_name,
      nr.score AS number_range_score,

      ot.id AS operation_category_id,
      ot.name AS operation_category_name,
      ot.score AS operation_category_score,

      up.id AS unknown_position_id,
      up.name AS unknown_position_name,
      up.score AS unknown_position_score,

      lc.id AS linguistic_complexity_id,
      lc.name AS linguistic_complexity_name,
      lc.score AS linguistic_complexity_score,

      cd.id AS cognitive_demand_id,
      cd.level AS cognitive_demand_level,
      cd.name AS cognitive_demand_name,
      cd.score AS cognitive_demand_score,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', o.id,
            'name', o.name
          )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'
      ) AS operations

      ${includeTips ? ', p.tips' : ''}

    FROM problems p

    LEFT JOIN themes t
      ON t.id = p.theme_id

    LEFT JOIN number_ranges nr
      ON nr.id = p.number_range_id

    LEFT JOIN operation_categories ot
      ON ot.id = p.operation_category_id

    LEFT JOIN unknown_positions up
      ON up.id = p.unknown_position_id

    LEFT JOIN linguistic_complexities lc
      ON lc.id = p.linguistic_complexity_id

    LEFT JOIN cognitive_demands cd
      ON cd.id = p.cognitive_demand_id

    LEFT JOIN operation_counts oc
      ON oc.id = p.operation_count_id

    LEFT JOIN problem_operations po
      ON po.problem_id = p.id

    LEFT JOIN operations o
      ON o.id = po.operation_id

    WHERE p.id = ANY($1::int[])

    GROUP BY
      p.id,
      t.id,
      nr.id,
      ot.id,
      up.id,
      lc.id,
      cd.id,
      oc.id
    `,
    [ids]
  );

  const byId = new Map(rows.map(row => [row.id, row]));

  return ids
    .map(id => byId.get(Number(id)))
    .filter(Boolean);
}

async function listProblems({
  operation,              // e.g. 'addition'
  theme,                  // e.g. 'geld'
  difficulty_label,
  grade,
  limit = 7,
  user_id,
  unsolvedOnly = false,
  is_assessment = false,

  number_range,           // e.g. '100-1000'
  operation_category,         // e.g. 'mixed_operations'
  unknown_position,       // e.g. 'result_unknown'
  linguistic_complexity,  // e.g. 'two_short_sentences'
  cognitive_demand,       // e.g. 'sequential_planning'
}) {
  
  const conditions = [];
  const values = [];
  
  if (operation) {
    values.push(operation);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM problem_operations po_filter
        JOIN operations o_filter ON o_filter.id = po_filter.operation_id
        WHERE po_filter.problem_id = p.id
          AND o_filter.name = $${values.length}
      )
    `);
  }

  if (theme) {
    values.push(theme);
    conditions.push(`t.name = $${values.length}`);
  }

  if (difficulty_label) {
    values.push(difficulty_label);
    conditions.push(`p.difficulty_label = $${values.length}`);
  }

  if (grade) {
    values.push(Number(grade));
    conditions.push(`p.grade = $${values.length}`);
  }

  values.push(is_assessment);
  conditions.push(`p.is_assessment = $${values.length}`);

  if (number_range) {
    values.push(number_range);
    conditions.push(`nr.name = $${values.length}`);
  }

  if (operation_category) {
    values.push(operation_category);
    conditions.push(`ot.name = $${values.length}`);
  }

  if (unknown_position) {
    values.push(unknown_position);
    conditions.push(`up.name = $${values.length}`);
  }

  if (linguistic_complexity) {
    values.push(linguistic_complexity);
    conditions.push(`lc.name = $${values.length}`);
  }

  if (cognitive_demand) {
    values.push(cognitive_demand);
    conditions.push(`cd.name = $${values.length}`);
  }

  if (unsolvedOnly && user_id) {
    values.push(user_id);
    conditions.push(`
      NOT EXISTS (
        SELECT 1
        FROM attempts a
        WHERE a.problem_id = p.id
          AND a.user_id = $${values.length}
          AND a.is_correct = true
      )
    `);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  values.push(limit);

  const result = await db.query(
    `
    SELECT
      p.*,
      t.name AS theme_name,

      nr.name AS number_range_name,
      nr.score AS number_range_score,

      ot.name AS operation_category_name,
      ot.score AS operation_category_score,

      up.name AS unknown_position_name,
      up.score AS unknown_position_score,

      lc.name AS linguistic_complexity_name,
      lc.score AS linguistic_complexity_score,

      cd.level AS cognitive_demand_level,
      cd.name AS cognitive_demand_name,
      cd.score AS cognitive_demand_score,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', o.id,
            'name', o.name
          )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'
      ) AS operations

    FROM problems p
    LEFT JOIN themes t ON t.id = p.theme_id

    LEFT JOIN number_ranges nr ON nr.id = p.number_range_id
    LEFT JOIN operation_categories ot ON ot.id = p.operation_category_id
    LEFT JOIN unknown_positions up ON up.id = p.unknown_position_id
    LEFT JOIN linguistic_complexities lc ON lc.id = p.linguistic_complexity_id
    LEFT JOIN cognitive_demands cd ON cd.id = p.cognitive_demand_id

    LEFT JOIN problem_operations po ON po.problem_id = p.id
    LEFT JOIN operations o ON o.id = po.operation_id

    ${where}

    GROUP BY
      p.id,
      t.name,
      nr.id,
      ot.id,
      up.id,
      lc.id,
      cd.id

    ORDER BY RANDOM()
    LIMIT $${values.length}
    `,
    values
  );

  if (result.rows.length < limit) {
    const missing = limit - result.rows.length;

    let num_attrs;
    if (missing > 3) {
      num_attrs = 3;
    } else {
      num_attrs = missing;
    }

    const attrs = await generate_attrs_based_difficulty({
      grade,
      difficulty_label,
      operation: operation || null,
      num_attrs: num_attrs, // 1, 2 or 3
    });

    generationRequests = [];

    const requestQuantities = attrs.map((_, i) =>
      Math.floor(missing / attrs.length) + (i < missing % attrs.length ? 1 : 0)
    );

    for (const [i, attr] of attrs.entries()) {
      // Create a dedicated job for this batch
      const { rows: [generationRequest] } = await db.query(
        `
        INSERT INTO generation_requests (user_id, status, quantity)
        VALUES ($1, 'pending', $2)
        RETURNING id
        `,
        [user_id, requestQuantities[i]]
      );
      
      generationRequests.push(generationRequest.id);
      
      const current_request = generationRequest.id;

      // Fire and forget
      createProblem({
        operation: operation ?? null,
        theme: theme ?? null,
        grade: grade,
        difficulty_label: difficulty_label,
        quantity: requestQuantities[i],
        attrs: attr,
        generationRequestId: current_request,
      }).catch(err => {
        console.error("Background problem creation failed:", err);
        db.query(
          `UPDATE generation_requests SET status = 'failed', error = $2, completed_at = now() WHERE id = $1`,
          [current_request, String(err.message || err)]
        ).catch(() => {});
      });
    }

    const assignments = generationRequests.flatMap(
      (id, i) => Array(Math.floor(missing / generationRequests.length) + (i < missing % generationRequests.length))
        .fill(id)
    );

    const placeholders = generationRequests.flatMap((requestId, requestIdx) =>
      Array.from({ length: requestQuantities[requestIdx] }, (_, localIndex) => ({
        id: null,
        is_placeholder: true,
        status: "generating",
        placeholder_index: localIndex,
        generation_request_id: requestId,
      }))
    );

    result.rows = result.rows.concat(placeholders);
  }

  return result.rows;
}

async function generate_attrs_based_difficulty({
  grade,
  difficulty_label,
  operation = null,
  num_attrs = 1
}) {
  let query = `
    SELECT
      dp.id,
      dp.grade,
      dp.difficulty_label,
      dp.total_difficulty_score,

      nr.name AS number_range,
      nr.min_value AS number_range_min_value,
      nr.max_value AS number_range_max_value,
      oc.name AS operation_category,
      up.name AS unknown_position,
      lc.name AS linguistic_complexity,
      lc.description AS linguistic_complexity_description,
      cd.name AS cognitive_demand,
      cd.description AS cognitive_demand_description,
      op.num_operations AS num_simple_operations      

    FROM difficulty_profiles dp

    JOIN number_ranges nr
      ON nr.id = dp.number_range_id

    JOIN operation_categories oc
      ON oc.id = dp.operation_category_id

    JOIN unknown_positions up
      ON up.id = dp.unknown_position_id

    JOIN linguistic_complexities lc
      ON lc.id = dp.linguistic_complexity_id

    JOIN cognitive_demands cd
      ON cd.id = dp.cognitive_demand_id

    JOIN operation_counts op
      ON op.id = dp.operation_count_id

    WHERE dp.grade = $1
      AND dp.difficulty_label = $2
  `;

  const params = [grade, difficulty_label];

  if (operation !== null) {
    params.push(operation);

    query += `
      AND EXISTS (
        SELECT 1
        FROM operation_category_operations oco
        JOIN operations o
          ON o.id = oco.operation_id
        WHERE oco.operation_category_id = oc.id
          AND o.name = $${params.length}
      )
    `;
  }

  query += `
    ORDER BY RANDOM()
    LIMIT ${num_attrs}
  `;

  const result = await db.query(query, params);
  return result.rows;
}

async function createProblem({
  operation = null,
  theme = null,
  grade,
  difficulty_label,
  quantity,
  attrs = {},
  generationRequestId = null,
}) {
  const attrRows = Array.isArray(attrs) ? attrs : [attrs];
  const insertedProblems = [];

  const generated = await aiService.call_openai_api("problem", false, {
    operation,
    theme,
    grade,
    quantity: quantity,
    ...attrs,
  });

  for (let i = 0; i < quantity; i++) {

    const questionText = generated[i]["text"] || generated[i]["question_text"];
    const solution = generated[i]["solution"];
    const main_objects = generated[i]["main_objects"];
    const stickers = generated[i]["stickers"];
    const colors = generated[i]["colors"];
    const init_tip = [generated[i]["initial_tip"]];
    const topic = generated[i]["topic"];
    const operations = generated[i]["operations"];

    const theme_id = await getIdByName("themes", theme ?? topic, db);
  
    const number_range_id = await getNumberRangeId(attrs.number_range, grade, db);
    const operation_category_id = await getIdByName(
      "operation_categories",
      attrs.operation_category,
      db
    );
    const unknown_position_id = await getIdByName(
      "unknown_positions",
      attrs.unknown_position,
      db
    );
    const linguistic_complexity_id = await getIdByName(
      "linguistic_complexities",
      attrs.linguistic_complexity,
      db
    );
    const cognitive_demand_id = await getIdByName(
      "cognitive_demands",
      attrs.cognitive_demand,
      db
    );
    const operation_count_id = await getOperationCountId(
      attrs.num_simple_operations,
      db
    );

    const operation_ids = await Promise.all(
      operations.map(operation => getIdByName("operations", operation, db))
    );

    const result = await db.query(
      `
      INSERT INTO problems (
        theme_id,
        grade,
        question_text,
        difficulty_label,
        number_range_id,
        operation_category_id,
        unknown_position_id,
        linguistic_complexity_id,
        cognitive_demand_id,
        operation_count_id,
        total_difficulty_score,
        correct_answers,
        subject_object,
        emojis,
        colors,
        tips,
        ai_full_return
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
      `,
      [
        theme_id,
        grade,
        questionText,
        difficulty_label,
        number_range_id,
        operation_category_id,
        unknown_position_id,
        linguistic_complexity_id,
        cognitive_demand_id,
        operation_count_id,
        attrs.total_difficulty_score,
        solution,
        main_objects,
        stickers,
        colors,
        init_tip,
        {
          // Missing log of AI --> Need to parse
        },
      ]
    );

    const insertedProblem = result.rows[0];

    // Need to compute operations from the equation

    for (const operationId of operation_ids) {
      await db.query(
        `
        INSERT INTO problem_operations (problem_id, operation_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [insertedProblem.id, operationId]
      );
    }

    if (generationRequestId) {
      await db.query(
        `
        INSERT INTO generation_request_problems
          (generation_request_id, placeholder_index, problem_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (generation_request_id, placeholder_index)
        DO UPDATE SET problem_id = EXCLUDED.problem_id
        `,
        [generationRequestId, i, insertedProblem.id]
      );
    }

    insertedProblems.push(insertedProblem);

  }

  if (generationRequestId) {
    await db.query(
      `UPDATE generation_requests SET status = 'completed', completed_at = now() WHERE id = $1`,
      [generationRequestId]
    );
  }

  console.log("Inserted NEW problems to db: ", insertedProblems.length)

  return insertedProblems;
}

async function getGenerationStatus(generationRequestId, userId) {
  const { rows: [job] } = await db.query(
    `
    SELECT id, status, quantity, error
    FROM generation_requests
    WHERE id = $1 AND user_id = $2
    `,
    [generationRequestId, userId]
  );

  if (!job) {
    throw Object.assign(new Error('Generation request not found'), {
      status: 404,
    });
  }

  const { rows: links } = await db.query(
    `
    SELECT placeholder_index, problem_id
    FROM generation_request_problems
    WHERE generation_request_id = $1
    ORDER BY placeholder_index
    `,
    [generationRequestId]
  );

  const problems = await getProblemsByIds(
    links.map(link => link.problem_id)
  );

  const byId = new Map(problems.map(problem => [problem.id, problem]));

  const ready = links
    .map(link => ({
      placeholder_index: link.placeholder_index,
      problem: byId.get(link.problem_id),
    }))
    .filter(row => row.problem);

  return {
    status: job.status,
    error: job.error,
    quantity: job.quantity,
    problems: ready,
  };
}async function getAssessmentProblems(grade) {
  const { rows } = await db.query(
    `SELECT id, question_text, subject_object, emojis, colors, tips, correct_answers
     FROM problems
     WHERE is_assessment = true AND grade = $1
     ORDER BY assessment_order ASC`, [grade]
  );
  return rows;
}

async function updateProblem(id, {
  operation_ids,
  theme_id,
  question_text,
  subject_object,
  emojis,
  colors,
  correct_answers,
  tips,

  number_range_id,
  operation_category_id,
  unknown_position_id,
  linguistic_complexity_id,
  cognitive_demand_id,
  num_simple_operations,
  total_difficulty_score,
  difficulty_label,
}) {
  const result = await db.query(
    `
    UPDATE problems SET
      theme_id                 = COALESCE($1, theme_id),
      question_text            = COALESCE($2, question_text),
      subject_object           = COALESCE($3, subject_object),
      emojis                   = COALESCE($4, emojis),
      colors                   = COALESCE($5, colors),
      correct_answers          = COALESCE($6, correct_answers),
      tips                     = COALESCE($7, tips),

      number_range_id          = COALESCE($8, number_range_id),
      operation_category_id        = COALESCE($9, operation_category_id),
      unknown_position_id      = COALESCE($10, unknown_position_id),
      linguistic_complexity_id = COALESCE($11, linguistic_complexity_id),
      cognitive_demand_id      = COALESCE($12, cognitive_demand_id),
      num_simple_operations    = COALESCE($13, num_simple_operations),
      total_difficulty_score   = COALESCE($14, total_difficulty_score),
      difficulty_label         = COALESCE($15, difficulty_label)

    WHERE id = $16
    RETURNING *
    `,
    [
      theme_id,
      question_text,
      subject_object,
      emojis,
      colors,
      correct_answers,
      tips,

      number_range_id,
      operation_category_id,
      unknown_position_id,
      linguistic_complexity_id,
      cognitive_demand_id,
      num_simple_operations,
      total_difficulty_score,
      difficulty_label,

      id,
    ]
  );

  if (!result.rows.length) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }

  const updatedProblem = result.rows[0];

  if (Array.isArray(operation_ids)) {
    await db.query(
      `DELETE FROM problem_operations WHERE problem_id = $1`,
      [id]
    );

    for (const operationId of operation_ids) {
      await db.query(
        `
        INSERT INTO problem_operations (problem_id, operation_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [id, operationId]
      );
    }
  }

  return updatedProblem;
}

async function deleteProblem(id) {
  const result = await db.query(
    'DELETE FROM problems WHERE id = $1 RETURNING *',
    [id]
  );

  if (!result.rows.length) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

module.exports = {
  listProblems,
  getProblemsByIds,
  getGenerationStatus,
  getAssessmentProblems,
  createProblem,
  updateProblem,
  deleteProblem,
};