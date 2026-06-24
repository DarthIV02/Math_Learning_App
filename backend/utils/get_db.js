async function getIdByName(table, name, db) {
  if (!name) return null;

  const result = await db.query(
    `SELECT id FROM ${table} WHERE name = $1 LIMIT 1`,
    [name]
  );

  if (!result.rows.length) {
    throw new Error(`No ${table} found for name: ${name}`);
  }

  return result.rows[0].id;
}

async function getNumberRangeId(name, grade, db) {
  const result = await db.query(
    `SELECT id FROM number_ranges WHERE name = $1 AND grade = $2 LIMIT 1`,
    [name, grade]
  );

  if (!result.rows.length) {
    throw new Error(`No number_range found for ${name}, grade ${grade}`);
  }

  return result.rows[0].id;
}

async function getOperationCountId(numOperations, db) {
  const result = await db.query(
    `SELECT id FROM operation_counts WHERE num_operations = $1 LIMIT 1`,
    [numOperations]
  );

  if (!result.rows.length) {
    throw new Error(`No operation_count found for ${numOperations}`);
  }

  return result.rows[0].id;
}

async function getOperationIds(operationCategory, operation, db) {
  if (operation) {
    const result = await db.query(
      `SELECT id FROM operations WHERE name = $1`,
      [operation]
    );
    return result.rows.map(row => row.id);
  }

  const result = await db.query(
    `
    SELECT o.id
    FROM operation_categories oc
    JOIN operation_category_operations oco
      ON oco.operation_category_id = oc.id
    JOIN operations o
      ON o.id = oco.operation_id
    WHERE oc.name = $1
    `,
    [operationCategory]
  );

  return result.rows.map(row => row.id);
}

module.exports = {getIdByName, getNumberRangeId, getOperationCountId, getOperationIds}