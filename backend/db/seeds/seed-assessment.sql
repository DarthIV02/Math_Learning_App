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
  4,
  'Der Pausenhof der Grundschule Hengersberg soll schöner werden. Aus diesem Grundstellt die Gemeinde 2500 € zur Verfügung. Nun sollen 3 Eichen für insgesamt 246 € und zwei Klettergerüste zu je 868 € angeschafft werden. Wie viel muss insgesamt bezahlt werden?',
  '{"Gesamtkosten": 946}',
  (SELECT id FROM number_ranges WHERE name = '100-1000' AND grade = 4),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'longer_irrelevant_text'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 3),
  13, 'medium',
  true, 3
),
(
  3,
  'Der Pausenhof der Grundschule Hengersberg soll schöner werden. Aus diesem Grundstellt die Gemeinde 50 € zur Verfügung. Nun sollen 3 Eichen für insgesamt 7€ und zwei Klettergerüste zu je 6 € angeschafft werden. Wie viel muss insgesamt bezahlt werden?',
  '{"Gesamtkosten": 33}',
  (SELECT id FROM number_ranges WHERE name = '1-100' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'longer_irrelevant_text'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 3),
  12, 'medium',
  true, 3
),
(
  4,
  'Auf einem Gestüt sind 32 Pferde untergebracht. Für 8 Pferde braucht man 24 kg Hafer und 16 kg Mohrrüben pro Tag. Wie viel Kilogramm Futter werden insgesamt gebraucht?',
  '{"Kilogramm": 160}',
  (SELECT id FROM number_ranges WHERE name = '100-1000' AND grade = 4),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'constructing_hidden_quantities'),
  (SELECT id FROM operation_counts WHERE num_operations = 3),
  9, 'easy',
  true, 2
),
(
  3,
  'Auf einem Gestüt sind 32 Pferde untergebracht. Für 8 Pferde braucht man 7 kg Hafer und 3 kg Mohrrüben pro Tag. Wie viel Kilogramm Futter werden insgesamt gebraucht?',
  '{"Kilogramm": 40}',
  (SELECT id FROM number_ranges WHERE name = '1-100' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'result_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'constructing_hidden_quantities'),
  (SELECT id FROM operation_counts WHERE num_operations = 3),
  8, 'easy',
  true, 2
),
(
  4,
  'Beim Sportfest wurden 415 Siegerurkunden vergeben. 105 Urkunden gingen an die Kinder der 1. Klassen. 210 Siegerurkunden bekamen Schüler aus der 2. und 3. Klasse. Wie viele Urkunden erreichten die Schüler der 4. Klassen?',
  '{"Urkunden": 100}',
  (SELECT id FROM number_ranges WHERE name = '100-1000' AND grade = 4),
  (SELECT id FROM operation_categories WHERE name = 'addition_subtraction'),
  (SELECT id FROM unknown_positions WHERE name = 'change_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'clear_relationship'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 2),
  9, 'easy',
  true, 1
),
(
  3,
  'Beim Sportfest wurden 415 Siegerurkunden vergeben. 105 Urkunden gingen an die Kinder der 1. Klassen. 210 Siegerurkunden bekamen Schüler aus der 2. und 3. Klasse. Wie viele Urkunden erreichten die Schüler der 4. Klassen?',
  '{"Urkunden": 100}',
  (SELECT id FROM number_ranges WHERE name = '100-500' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'addition_subtraction'),
  (SELECT id FROM unknown_positions WHERE name = 'change_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'clear_relationship'),
  (SELECT id FROM cognitive_demands WHERE name = 'sequential_planning'),
  (SELECT id FROM operation_counts WHERE num_operations = 2),
  9, 'easy',
  true, 1
),
(
  4,
  'Jonas schlachtet sein Sparschwein. Von dem Geld darin kauft er drei Äpfel zu je 50 ct, Süßigkeiten im Wert von 4,99 € und zwei CDs, von denen jede 8,20 € kostet. Ihm bleiben danach noch ein 5-Euro-Schein und 11 ct in Form von Münzen. Wie viel Geld befand sich im Sparschwein?',
  '{"Geld (€)": 28}',
  (SELECT id FROM number_ranges WHERE name = '1000-10000' AND grade = 4),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'start_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'constructing_hidden_quantities'),
  (SELECT id FROM operation_counts WHERE num_operations = 5),
  16, 'hard',
  true, 4
),
(
  3,
  'Jonas schlachtet sein Sparschwein. Von dem Geld darin kauft er drei Äpfel zu je 5 ct, Süßigkeiten im Wert von 49 ct und zwei CDs, von denen jede 9 ct kostet. Ihm bleiben danach noch ein 18 ct in Form von Münzen. Wie viel Geld befand sich im Sparschwein?',
  '{"Geld (€)": 100}',
  (SELECT id FROM number_ranges WHERE name = '1-100' AND grade = 3),
  (SELECT id FROM operation_categories WHERE name = 'mixed_operations'),
  (SELECT id FROM unknown_positions WHERE name = 'start_unknown'),
  (SELECT id FROM linguistic_complexities WHERE name = 'two_short_sentences'),
  (SELECT id FROM cognitive_demands WHERE name = 'constructing_hidden_quantities'),
  (SELECT id FROM operation_counts WHERE num_operations = 5),
  14, 'medium',
  true, 4
)
;
