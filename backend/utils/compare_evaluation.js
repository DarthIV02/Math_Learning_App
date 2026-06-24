function countQuestionMarks(equation = "") {
  return (equation.match(/\?/g) || []).length;
}

function countOperations(equation = "") {
  return (equation.match(/[+\-*/]/g) || []).length;
}

function normalizeEvaluations(input) {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed?.evaluations)) {
    return parsed.evaluations;
  }

  if (parsed && typeof parsed === "object") {
    return [parsed];
  }

  return [];
}

function validateSingleProblemEvaluation({
  parameters,
  language,
  math,
  index,
}) {
  const checks = {
    problem_index: index,
    matching: {},
    not_matching: {},
    validity_checks: {},
  };

  const fieldsToCompare = [
    "unknown_position",
    "linguistic_complexity",
    "cognitive_demand",
    "operation_category",
    "number_range",
  ];

  for (const field of fieldsToCompare) {
    const evaluatedValue =
      language?.[field] !== undefined ? language[field] : math?.[field];

    if (parameters[field] === evaluatedValue) {
      checks.matching[field] = {
        expected: parameters[field],
        actual: evaluatedValue,
      };
    } else {
      checks.not_matching[field] = {
        expected: parameters[field],
        actual: evaluatedValue,
      };
    }
  }

  if (parameters.num_simple_operations === math?.operation_count) {
    checks.matching.operation_count = {
      expected: parameters.num_simple_operations,
      actual: math.operation_count,
    };
  } else {
    checks.not_matching.operation_count = {
      expected: parameters.num_simple_operations,
      actual: math?.operation_count,
    };
  }

  checks.validity_checks.grade_appropriate = {
    passed: language?.grade_appropriateness?.is_appropriate === true,
    actual: language?.grade_appropriateness,
  };

  checks.validity_checks.has_all_required_numbers = {
    passed: math?.has_all_required_numbers === true,
    actual: math?.has_all_required_numbers,
    reason: math?.missing_number_reason,
  };

  checks.validity_checks.equation_has_one_unknown = {
    passed: countQuestionMarks(math?.equation) === 1,
    actual_count: countQuestionMarks(math?.equation),
    equation: math?.equation,
  };

  checks.validity_checks.equation_operation_count_matches = {
    passed: countOperations(math?.equation) === math?.operation_count,
    expected: math?.operation_count,
    actual_count: countOperations(math?.equation),
    equation: math?.equation,
  };

  checks.validity_checks.grade_3_multiplication_division_valid = {
    passed: math?.grade_3_multiplication_division_valid === true,
    actual: math?.grade_3_multiplication_division_valid,
    reason: math?.grade_3_multiplication_division_reason,
    checks: math?.grade_3_multiplication_division_checks,
  };

  checks.is_valid =
    Object.keys(checks.not_matching).length === 0 &&
    Object.values(checks.validity_checks).every(check => check.passed);

  return checks;
}

function validateProblemEvaluation({
  parameters,
  languageEvaluation,
  mathEvaluation,
}) {
  const languageEvaluations = normalizeEvaluations(languageEvaluation);
  const mathEvaluations = normalizeEvaluations(mathEvaluation);

  const maxLength = Math.max(
    languageEvaluations.length,
    mathEvaluations.length
  );

  const evaluations = [];

  for (let i = 0; i < maxLength; i++) {
    evaluations.push(
      validateSingleProblemEvaluation({
        parameters,
        language: languageEvaluations[i],
        math: mathEvaluations[i],
        index: i,
      })
    );
  }

  return {
    evaluations,
    all_valid: evaluations.every(evaluation => evaluation.is_valid),
  };
}

module.exports = validateProblemEvaluation;