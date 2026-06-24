-- ─────────────────────────────────────────────
-- Init problems
-- ─────────────────────────────────────────────

INSERT INTO operations (name)
VALUES
('addition'),
('subtraction'),
('multiplication'),
('division');

INSERT INTO themes (name)
VALUES ('geld'), ('gewichte'), ('längen'), ('other');

INSERT INTO number_ranges (name, min_value, max_value, grade, score)
VALUES
('1-100', 1, 100, 3, 1),
('100-500', 100, 500, 3, 2),
('500-1000', 500, 1000, 3, 3),
('1-100', 1, 100, 4, 1),
('100-1000', 100, 1000, 4, 2),
('1000-10000', 1000, 10000, 4, 3);

INSERT INTO operation_categories (name, difficulty_label, score)
VALUES
('addition_subtraction', 'easy', 1),
('multiplication_division', 'medium', 2),
('mixed_operations', 'hard', 3);

INSERT INTO unknown_positions (name, difficulty_label, score)
VALUES
('result_unknown', 'easy', 1),
('change_unknown', 'medium', 2),
('start_unknown', 'hard', 3);

INSERT INTO linguistic_complexities (name, description, difficulty_label, score)
VALUES
('simple_direct_sentence', 'One short direct sentence.', 'easy', 1),
('two_short_sentences', 'Two short sentences with clear wording.', 'medium', 2),
('clear_relationship', 'Clear but slightly more complex relationship.', 'medium', 2),
('longer_irrelevant_text', 'Longer text with irrelevant information.', 'hard', 3);

INSERT INTO cognitive_demands (level, name, description, difficulty_label, score)
VALUES
(1, 'direct_operation_mapping', 'One direct operation.', 'easy', 1),
(2, 'sequential_planning', 'Two or more steps in clear order.', 'medium', 2),
(3, 'constructing_hidden_quantities', 'Must derive an intermediate quantity.', 'medium', 2),
(4, 'managing_hierarchical_structure', 'Groups inside groups.', 'hard', 3),
(5, 'tracking_relational_dependencies', 'Quantities depend on other quantities.', 'hard', 3);

INSERT INTO operation_counts (
  num_operations,
  description,
  difficulty_label,
  score
)
VALUES
(1, 'Single operation problem.', 'easy', 1),
(2, 'Two simple operations.', 'medium', 2),
(3, 'Three simple operations.', 'hard', 3);

INSERT INTO operation_category_operations (operation_category_id, operation_id)
VALUES
-- addition_subtraction
(1, 1), -- addition
(1, 2), -- subtraction

-- multiplication_division
(2, 3), -- multiplication
(2, 4), -- division

-- mixed_operations
(3, 1),
(3, 2),
(3, 3),
(3, 4);

-- These combinations are weak or contradictory:

-- Cognitive demand	Bad with	Why
-- sequential_planning	simple_direct_sentence	“first…, then…” usually needs two actions; one short SVO sentence is too restrictive.
-- constructing_hidden_quantities	simple_direct_sentence	Hidden intermediate quantities need explanation.
-- managing_hierarchical_structure	simple_direct_sentence	“groups inside groups” usually needs nested wording.
-- tracking_relational_dependencies	simple_direct_sentence	Relations like “twice as many as…” need at least a relationship clause.
-- tracking_relational_dependencies	two_short_sentences maybe	Possible, but often cramped unless carefully written.

INSERT INTO difficulty_profiles (
  grade,
  difficulty_label,
  number_range_id,
  operation_category_id,
  unknown_position_id,
  linguistic_complexity_id,
  cognitive_demand_id,
  operation_count_id,
  total_difficulty_score
)
SELECT
  nr.grade,

  CASE
    WHEN (
      nr.score +
      ot.score +
      up.score +
      lc.score +
      cd.score +
      oc.score
    ) BETWEEN 6 AND 9
      THEN 'easy'

    WHEN (
      nr.score +
      ot.score +
      up.score +
      lc.score +
      cd.score +
      oc.score
    ) BETWEEN 10 AND 14
      THEN 'medium'

    ELSE 'hard'
  END,

  nr.id,
  ot.id,
  up.id,
  lc.id,
  cd.id,
  oc.id,

  (
    nr.score + oc.score + ot.score + up.score + lc.score + cd.score
  ) AS total_score

FROM number_ranges nr
CROSS JOIN operation_counts oc
CROSS JOIN operation_categories ot
CROSS JOIN unknown_positions up
CROSS JOIN linguistic_complexities lc
CROSS JOIN cognitive_demands cd
WHERE NOT (
  ot.name = 'mixed_operations'
  AND oc.num_operations = 1
) AND NOT (
  lc.name = 'simple_direct_sentence'
  AND cd.name IN (
    'sequential_planning',
    'constructing_hidden_quantities',
    'managing_hierarchical_structure',
    'tracking_relational_dependencies'
  )
)
AND NOT (
  lc.name = 'two_short_sentences'
  AND cd.name = 'tracking_relational_dependencies'
) AND NOT ( 
  -- We dont want 3rd grade students with hard multiplications
  ot.name = 'multiplication_division' AND 
  nr.name IN ('100-500', '500-1000')
) AND NOT (
  -- Doesn't make sense to have 2 operations but only 1 operation map?
  ot.name = 'mixed_operations'
  AND cd.name = 'direct_operation_mapping'
);

INSERT INTO problems (
  theme_id,
  grade,
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
  operation_count_id,
  total_difficulty_score,
  difficulty_label
)
VALUES (
  4,
  4,
  'Lisa hat 600 Legosteine. Die Hälfte davon ist rot. Die andere Hälfte besteht zu gleichen Teilen aus gelben und blauen Steinen. Wie viele Legosteine sind es jeweils?',
  ARRAY['Rot Lego', 'Gelb Lego', 'Blau Lego'],
  ARRAY['🧱', '🧱', '🧱'],
  ARRAY['red', 'yellow', 'blue'],
  '{"Rot Lego": 300, "Gelb Lego": 150, "Blau Lego": 150}',
  ARRAY['Beginne damit, die Blöcke von rechts herüberzuziehen. Kannst du herausfinden, wie viele davon rot sind?'],
  5, -- 500-1000
  3, -- mixed_operations
  1, -- result_unknown
  2, -- two_short_sentences
  3, -- constructing_hidden_quantities
  3, -- operation_count_id
  14,
  'medium'
),
(
  1,
  4,
  'Tim hat 315 Euro Taschengeld gespart. Er möchte sich ein Fahrrad für 250 Euro, eine Hose für 42 Euro und ein Buch für 19 Euro kaufen. Reicht Tims Taschengeld aus?',
  ARRAY['Fahrrad', 'Hose', 'Buch', 'Euro'],
  ARRAY['🚲', '👖', '📚', '💰'],
  ARRAY['', '', '', ''],
  '{"Ausreichend?": "Ja"}',
  ARRAY['Beginnen Sie damit, die Ausgaben aufzuschreiben. Wie viel kostet jedes Objekt?'],

  5, -- number_range_id (100-500)
  3, -- operation_category_id (mixed_operations)
  1, -- unknown_position_id (result_unknown)
  4, -- linguistic_complexity_id (longer_irrelevant_text)
  2, -- cognitive_demand_id (sequential_planning)

  3, -- operation_count_id
  14,
  'medium'
),

(
  4,
  3,
  'Du backst mit Oma 3 Pizzen. Du legst auf jede Pizza 3 Scheiben Salami. Oma legt auf jede Pizza nochmal 4 Scheiben dazu. Wie viele Scheiben Salami sind das?',
  ARRAY['Pizzen', 'Salami'],
  ARRAY['🍕', '🔴'],
  ARRAY['', ''],
  '{"Scheiben Salami": 21}',
  ARRAY['Beginnen Sie damit, die Pizzen und Salamis zu ziehen.'],

  1, -- 1-100
  3, -- mixed_operations
  1, -- result_unknown
  2, -- two_short_sentences
  2, -- sequential_planning

  2,
  12,
  'medium'
),

(
  1,
  4,
  'Heidi hat 146 Euro gespart. Sie will sich eine Hose für 134 Euro und ein Buch für 17 Euro kaufen. Reicht das gesparte Geld aus?',
  ARRAY['Euro', 'Hose', 'Buch'],
  ARRAY['🪙', '👖', '📘'],
  ARRAY['', '', ''],
  '{"Ausreichend?": "Nein"}',
  ARRAY['Beginnen Sie damit anzugeben, wie viel Geld Sie für jedes Objekt benötigen.'],

  5,
  1, -- addition_subtraction
  1,
  2,
  2,

  2,
  10,
  'medium'
),

(
  1,
  3,
  'Michas Papa hat 380 Euro im Geldbeutel. Er kauft ein Radio. Jetzt hat er noch 48 Euro. Wie viel hat das Radio gekostet?',
  ARRAY['Euro', 'Radio'],
  ARRAY['🪙', '📻'],
  ARRAY['', ''],
  '{"Radio": 332}',
  ARRAY['Beginne damit aufzuschreiben, wie viel Geld er hatte und wie viel er nach dem Radio noch hatte.'],

  2,
  1,
  3, -- start_unknown
  3, -- clear_relationship
  3, -- constructing_hidden_quantities

  1,
  12,
  'medium'
),

(
  1,
  4,
  'Will hat doppelt so viel Geld in der Spardose wie Sam. Zusammen haben sie 210 Euro. Wie viel Geld hat Will und wie viel hat Sam?',
  ARRAY['Spardose', 'Euro', 'Kind'],
  ARRAY['🐖', '🪙', '👦'],
  ARRAY['', '', ''],
  '{"Will": 140, "Sam": 70}',
  ARRAY['Versuchen Sie, für jeden Schüler ein Sparschwein mit dem gleichen Geldbetrag herauszuholen'],

  5,
  2, -- multiplication_division
  1,
  3,
  5, -- relational dependencies

  2,
  15,
  'hard'
),

(
  4,
  3,
  'Ein Tierpark bestellt Futter für seine Tiere: 325 kg Heu für die Zebras, 468 kg Fisch für die Pinguine und 129 kg Fleisch für die Löwen. Wie viel Kilogramm Futter wurden insgesamt bestellt?',
  ARRAY['Heu', 'Fisch', 'Fleisch'],
  ARRAY['🥬', '🐟', '🥩'],
  ARRAY['', '', ''],
  '{"Gesamtfutter": 922}',
  ARRAY['Beginne damit, die verschiedenen Futtersorten herauszuziehen. Wie viel wiegt jede Sorte?'],

  3,
  1,
  1,
  4,
  2,

  2,
  13,
  'medium'
),

(
  4,
  3,
  'Der Bauer verpackt Äpfel in Kisten. Immer 10 Äpfel passen in eine Kiste. Wie viele Kisten braucht er für 80 Äpfel?',
  ARRAY['Kiste', 'Äpfel'],
  ARRAY['📦', '🍎'],
  ARRAY['', ''],
  '{"Kisten": 8}',
  ARRAY['Beginne damit, die Äpfel in die Kisten zu ziehen.'],

  1,
  2,
  1,
  1,
  4, -- hierarchical structure

  1,
  10,
  'medium'
),

(
  4,
  3,
  'Nora braucht für ein Kastanienmännchen 6 Kastanien. Wie viele Kastanien braucht sie für 5 Männchen?',
  ARRAY['Kastanien', 'Männchen'],
  ARRAY['🌰', '🕴️'],
  ARRAY['', ''],
  '{"Kastanien": 30}',
  ARRAY['Beginnen Sie damit, die Kastanien pro Person zu zeichnen.'],

  1,
  2,
  1,
  1,
  1,

  1,
  7,
  'easy'
),

(
  4,
  3,
  'Mama kauft 48 Erdbeeren und teilt sie auf 6 Schüsseln auf. Wie viele Erdbeeren sind in einer Schüssel?',
  ARRAY['Erdbeeren', 'Schüsseln'],
  ARRAY['🍓', '🥣'],
  ARRAY['', ''],
  '{"Erdbeeren": 8}',
  ARRAY['Beginnen Sie damit, die Erdbeeren pro Schüssel zu zeichnen.'],

  1,
  2,
  1,
  1,
  2,

  1,
  8,
  'easy'
)
;

INSERT INTO problem_operations (problem_id, operation_id)
VALUES
(1, 4),
(1, 2),

(2, 1),
(2, 2),

(3, 3),
(3, 1),

(4, 1),
(4, 2),

(5, 2),

(6, 4),

(7, 1),

(8, 4),

(9, 3),

(10, 4);