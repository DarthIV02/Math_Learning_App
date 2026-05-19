CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- Lookup tables
-- ─────────────────────────────────────────────

CREATE TABLE operations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE objects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT
);

-- ─────────────────────────────────────────────
-- Classes
-- ─────────────────────────────────────────────

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL UNIQUE,

  grade TEXT NOT NULL CHECK (grade IN ('3', '4')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,

  grade TEXT NOT NULL CHECK (grade IN ('3', '4')),

  -- Optional relation to class
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,

  -- Used as login identifier
  -- Self users -> real email
  -- Teacher-created users -> generated username
  email TEXT NOT NULL UNIQUE,

  auth_type TEXT NOT NULL
    CHECK (auth_type IN ('password', 'qr', 'anonymous')),

  password_hash TEXT,

  qr_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  qr_generated_at TIMESTAMPTZ DEFAULT NOW(),

  avatar_url TEXT NOT NULL DEFAULT '/uploads/avatars/student-avatar-placeholder.png',

  created_by TEXT NOT NULL DEFAULT 'self'
    CHECK (created_by IN ('self', 'teacher')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT self_registered_requires_password
   CHECK (
    created_by != 'self'
    OR auth_type = 'anonymous'
    OR password_hash IS NOT NULL
  ),

  CONSTRAINT password_auth_requires_hash
    CHECK (
      auth_type != 'password'
      OR password_hash IS NOT NULL
    )
);

-- ─────────────────────────────────────────────
-- Problems
-- ─────────────────────────────────────────────

CREATE TABLE problems (
  id SERIAL PRIMARY KEY,

  operation_id INT REFERENCES operations(id),
  theme_id INT REFERENCES themes(id),

  grade INT NOT NULL CHECK (grade IN (3, 4)),
  question_text TEXT NOT NULL,

  subject_object TEXT[] NOT NULL DEFAULT '{}', -- e.g. "Äpfel", "Bananen", "Katzen"
  emojis TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',

  correct_answers JSONB NOT NULL, -- e.g. {"Äpfel": 5, "Bananen": 3}

  tips TEXT[] NOT NULL DEFAULT '{}',

  difficulty INT DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Attempts
-- ─────────────────────────────────────────────

CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id INT REFERENCES problems(id) ON DELETE CASCADE,

  answer_given TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INT,
  score INT,

  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Sessions
-- ─────────────────────────────────────────────

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- Init problems
-- ─────────────────────────────────────────────

INSERT INTO operations (name)
VALUES ('addition'), ('subtraktion'), ('multiplikation'), ('division'), ('multiple');

INSERT INTO themes (name)
VALUES ('geld'), ('gewichte'), ('längen'), ('other');

INSERT INTO problems (
  operation_id,
  theme_id,
  grade,
  question_text,
  subject_object,
  emojis,
  colors,
  correct_answers,
  tips,
  difficulty
)
VALUES
(
  4,
  4,
  4,
  'Lisa hat 600 Legosteine. Die Hälfte davon ist rot. Die andere Hälfte besteht zu gleichen Teilen aus gelben und blauen Steinen. Wie viele Legosteine sind es jeweils?',
  ARRAY['Rot Lego', 'Gelb Lego', 'Blau Lego'],
  ARRAY['🧱', '🧱', '🧱'],
  ARRAY['red', 'yellow', 'blue'],
  '{"Rot Lego": 300, "Gelb Lego": 150, "Blau Lego": 150}',
  ARRAY['Beginne damit, die Blöcke von rechts herüberzuziehen. Kannst du herausfinden, wie viele davon rot sind?'],
  2
),
(
  2,
  1,
  4,
  'Tim hat 315 Euro Taschengeld gespart. Er möchte sich ein Fahrrad für 250 Euro, eine Hose für 42 Euro und ein Buch für 19 Euro kaufen. Reicht Tims Taschengeld aus?',
  ARRAY['Fahrrad', 'Hose', 'Buch', 'Euro'],
  ARRAY['🚲', '👖', '📚', '💰'],
  ARRAY['', '', ''],
  '{"Ausreichend?": "Ja"}',
  ARRAY['Beginnen Sie damit, die Ausgaben aufzuschreiben. Wie viel kostet jedes Objekt?'],
  2
),
(
  3,
  4,
  3,
  'Du backst mit Oma 3 Pizzen. Du legst auf jede Pizza 3 Scheiben Salami. Oma legt auf jeden Pizza nochmal 4 Scheiben dazu. Wie viele Scheiben Salami sind das?',
  ARRAY['Pizzen', 'Salami'],
  ARRAY['🍕', '🔴'],
  ARRAY['', ''],
  '{"Scheiben Salami": 21}',
  ARRAY['Beginnen Sie damit, die Pizzen und Salamis zu ziehen.'],
  2
),
(
  1,
  1,
  4,
  'Heidi hat 146 Euro gespart. Sie will sich eine Hose für 134 Euro und ein Buch für 17 Euro kaufen. Reicht das gesparte Geld aus?',
  ARRAY['Euro', 'Hose', 'Buch'],
  ARRAY['🪙', '👖', '📘'],
  ARRAY['', '', ''],
  '{"Ausreichend?": "Nein"}',
  ARRAY['Beginnen Sie damit anzugeben, wie viel Geld Sie für jedes Objekt benötigen.'],
  1
),
(
  2,
  1,
  3,
  'Michas Papa hat 380 Euro im Geldbeutel. Er kauft ein Radio. Jetzt hat er noch 48 Euro. Wie viel hat das Radio gekostet?',
  ARRAY['Euro', 'Radio'],
  ARRAY['🪙', '📻'],
  ARRAY['', ''],
  '{"Radio": 332}',
  ARRAY['Beginne damit aufzuschreiben, wie viel Geld er hatte und wie viel er nach dem Radio noch hatte.'],
  3
),
(
  4,
  1,
  4,
  'Will hat doppelt so viel Geld in der Spardose wie Sam. Zusammen haben sie 210 Euro. Wie viel Geld hat Willi, wie viel hat Sam?',
  ARRAY['Spardose', 'Euro', 'Kind'],
  ARRAY['🐖', '🪙', '👦'],
  ARRAY['', ''],
  '{"Will": 140, "Sam": 70}',
  ARRAY['Versuchen Sie, für jeden Schüler ein Sparschwein mit dem gleichen Geldbetrag herauszuholen'],
  3
),
(
  1,
  4,
  3,
  'Ein Tierpark bestellt Futter für seine Tiere: 325 kg Heu für die Zebras, 468 kg Fisch für die Pinguine und 129 kg Fleisch für die Löwen. Wie viel Kilogramm Futter wurden insgesamt bestellt?',
  ARRAY['Heu', 'Fisch', 'Fleisch'],
  ARRAY['🥬', '🐟', '🥩'],
  ARRAY['', ''],
  '{"Gesmamtfutter": 922}',
  ARRAY['Beginne damit, die verschiedenen Futtersorten herauszuziehen. Wie viel wiegt jede Sorte?'],
  1
),
(
  4,
  4,
  3,
  'Der Bauer verpackt Äpfel in Kisten. Immer 10 Äpfel passen in eine Kiste. Wie viele Kisten braucht er für 80 Äpfel?',
  ARRAY['Kiste', 'Äpfel'],
  ARRAY['📦', '🍎'],
  ARRAY['', ''],
  '{"Kisten": 8}',
  ARRAY['Beginne damit, die Äpfel in die Kisten zu ziehen.'],
  1
),
(
  3,
  4,
  3,
  'Nora braucht für ein Kastanienmännchen 6 Kastanien. Wie viele Kastanien braucht sie für 5 Männchen?',
  ARRAY['Kastanien', 'Männchen'],
  ARRAY['🌰', '🕴️'],
  ARRAY['', ''],
  '{"Kastanien": 30}',
  ARRAY['Beginnen Sie damit, die Kastanien pro Person zu zeichnen.'],
  2
),
(
  4,
  4,
  3,
  'Mama kauft 48 Erdbeeren und teilt sie auf 6 Schüsseln auf. Wie viele Erdbeeren sind in einer Schüssel?',
  ARRAY['Erdbeeren', 'Schüsseln'],
  ARRAY['🍓', '🥣'],
  ARRAY['', ''],
  '{"Erdbeeren": 8}',
  ARRAY['Beginnen Sie damit, die Erdbeeren pro Schüssel zu zeichnen.'],
  1
)
;