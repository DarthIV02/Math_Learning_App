const db = require('../db');
const aiService = require('./aiService');

async function getProblem(id, includeTips = false) {
  const result = await db.query(
    `
    SELECT
      p.id,
      p.question_text,
      p.subject_object,
      p.emojis,
      p.colors,

      p.grade,

      p.num_simple_operations,
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

    LEFT JOIN problem_operations po
      ON po.problem_id = p.id

    LEFT JOIN operations o
      ON o.id = po.operation_id

    WHERE p.id = $1

    GROUP BY
      p.id,
      t.id,
      nr.id,
      ot.id,
      up.id,
      lc.id,
      cd.id
    `,
    [id]
  );

  if (!result.rows.length) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function listProblems({
  operation,              // e.g. 'addition'
  theme,                  // e.g. 'geld'
  difficulty_label,
  grade,
  limit = 7,
  user_id,
  unsolvedOnly = false,

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
    const attrs = await generate_attrs_based_difficulty({
      grade,
      difficulty_label,
      operation: operation || null,
    });

    const created = await createProblem({
      operation: operation ?? null,
      theme: theme ?? null,
      grade,
      difficulty_label,
      quantity: limit - result.rows.length,
      attrs,
    });

    // result.rows = result.rows.concat(created);
  }

  return result.rows;
}

async function generate_attrs_based_difficulty({
  grade,
  difficulty_label,
  operation = null,
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
    LIMIT 1
  `;

  const result = await db.query(query, params);
  return result.rows[0];
}

async function createProblem({
  operation = null,
  theme = null,
  grade,
  difficulty_label,
  quantity,
  attrs = {},
}) {
  const generated = await aiService.call_openai_api("problem", {
    operation,
    theme,
    grade,
    quantity,
    ...attrs,
  });

  // !!! NEEDS TO BE UPDATED WITH NEW PROBLEM ATTRIBUTES AND MANY-TO-MANY WITH OPERATIONS !!!

  // const insertedProblems = [];

  // for (let i = 0; i < generated.problems.length; i++) {
  //   const problem = generated.problems[i];
  //   const plan = generated.scenario_plan[i];

  //   const result = await db.query(
  //     `
  //     INSERT INTO problems
  //       (
  //         theme_id,
  //         grade,
  //         question_text,
  //         difficulty_label,
  //         number_range_id,
  //         operation_category_id,
  //         unknown_position_id,
  //         linguistic_complexity_id,
  //         cognitive_demand_id,
  //         num_simple_operations,
  //         total_difficulty_score,
  //         correct_answers,
  //         ai_full_return
  //       )
  //     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
  //     RETURNING *
  //     `,
  //     [
  //       theme_id,
  //       grade,
  //       problem.question_text,
  //       difficulty_label,
  //       number_range_id,
  //       operation_category_id,
  //       unknown_position_id,
  //       linguistic_complexity_id,
  //       cognitive_demand_id,
  //       num_simple_operations,
  //       total_difficulty_score,
  //       { answer: problem.answer },
  //       {
  //         problem,
  //         scenario_plan: plan,
  //       },
  //     ]
  //   );

  //   const insertedProblem = result.rows[0];

  //   for (const operationId of operation_ids) {
  //     await db.query(
  //       `
  //       INSERT INTO problem_operations (problem_id, operation_id)
  //       VALUES ($1, $2)
  //       ON CONFLICT DO NOTHING
  //       `,
  //       [insertedProblem.id, operationId]
  //     );
  //   }

  //   insertedProblems.push(insertedProblem);
  // }

  // return insertedProblems;
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

module.exports = { listProblems, getProblem, createProblem, updateProblem, deleteProblem };