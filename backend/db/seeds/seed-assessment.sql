-- ─────────────────────────────────────────────
-- Assessment problems (static, shown to every
-- newly registered user as their initial test)
-- ─────────────────────────────────────────────

INSERT INTO problems (
  grade, question_text, correct_answers,
  number_range_id, operation_category_id, unknown_position_id,
  linguistic_complexity_id, cognitive_demand_id, operation_count_id,
  total_difficulty_score, difficulty_label,
  is_assessment, assessment_order
)
VALUES
(
  3,
  'In der Kantine stehen 340 Portionen Spaghetti Bolognese bereit, und es sollen mindestens 100 Portionen übrig bleiben, sodass höchstens 240 Portionen verkauft werden dürfen. Bisher wurden bereits 158 Portionen verkauft, wie viele Portionen dürfen noch verkauft werden?',
  '{"Portionen": 82}',
  (SELECT id FROM number_ranges WHERE name = '100-500' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'addition_subtraction'),
  (SELECT id FROM unknown_positions WHERE name = 'change_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 1),
  12, 'easy',
  true, 1
),
(
  3,
  'Aus einem Vorrat von 420 g Glitzer werden 105 g für ein besonderes Einhorn genommen. Weitere 105 g werden für ein Test‑Einhorn verwendet, und jedes normale Einhorn benötigt 105 g Glitzer. Wie viele normale Einhörner können damit verzaubert werden?',
  '{"Einhörner": 2}',
  (SELECT id FROM number_ranges WHERE name = '100-500' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 3),
  12, 'easy',
  true, 2
),
(
  3,
  'Am Samstag trifft sich der Garten‑Club der Schule im Gemeinschaftsgarten. Jedes Kind bekommt einen kleinen Topf, etwas Erde und ein Saatgutpaket. Einige Kinder wählen Karotten, andere Salat und ein paar Kinder entscheiden sich für Blumensamen. Der Garten hat ein paar Hochbeete, einen Holzzaun und ein Schild, das die möglichen Pflanzen zeigt, aber das Schild ist nur zur Dekoration. Die Kinder haben bereits 140 Karotten‑Pakete und 150 Salat‑Pakete in die Töpfe gelegt, das macht zusammen 290 Pakete. Insgesamt sollen 460 Saatgutpakete in die Töpfe gelegt werden. Wie viele Blumensamen‑Pakete fehlen noch?',
  '{"Blumensamen": 170}',
  (SELECT id FROM number_ranges WHERE name = '100-500' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'longer_irrelevant_text'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 1),
  12, 'easy',
  true, 3
),
(
  3,
  'Lina malt und hat 110 Kärtchen mit je 3 ml Farbe, dann ergänzt sie ein viertes Kärtchen um 140 ml. Wie viele Milliliter Farbe hat sie jetzt insgesamt?',
  '{"Farbe": 470}',
  (SELECT id FROM number_ranges WHERE name = '100-500' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'constructing_hidden_quantities'),
  (SELECT id FROM operation_counts WHERE num_operations = 2),
  12, 'easy',
  true, 4
);
