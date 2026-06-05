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

  coins INT NOT NULL DEFAULT 0,

  avatar_url TEXT NOT NULL DEFAULT '/uploads/avatars/student-avatar-placeholder.png',

  has_completed_tutorial BOOLEAN DEFAULT false,

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
-- Difficulty lookup tables
-- ─────────────────────────────────────────────

CREATE TABLE number_ranges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_value INT NOT NULL,
  max_value INT NOT NULL,
  grade INT NOT NULL CHECK (grade IN (3, 4)),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3),

  UNIQUE (name, grade),
  UNIQUE (grade, min_value, max_value)
);

CREATE TABLE operation_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- addition_subtraction, multiplication_division, mixed_operations
  difficulty_label TEXT NOT NULL CHECK (difficulty_label IN ('easy', 'medium', 'hard')),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3)
);

CREATE TABLE unknown_positions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- result_unknown, change_unknown, start_unknown
  difficulty_label TEXT NOT NULL CHECK (difficulty_label IN ('easy', 'medium', 'hard')),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3)
);

CREATE TABLE linguistic_complexities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  difficulty_label TEXT NOT NULL CHECK (difficulty_label IN ('easy', 'medium', 'hard')),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3)
);

CREATE TABLE cognitive_demands (
  id SERIAL PRIMARY KEY,
  level INT NOT NULL UNIQUE CHECK (level BETWEEN 1 AND 5),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  difficulty_label TEXT NOT NULL CHECK (difficulty_label IN ('easy', 'medium', 'hard')),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3)
);

CREATE TABLE operation_counts (
  id SERIAL PRIMARY KEY,

  num_operations INT NOT NULL,
  grade INT NOT NULL CHECK (grade IN (3, 4)),

  description TEXT,

  difficulty_label TEXT NOT NULL
    CHECK (difficulty_label IN ('easy', 'medium', 'hard')),

  score INT NOT NULL CHECK (score BETWEEN 1 AND 3),

  UNIQUE (grade, num_operations)
);

CREATE TABLE problems (
  id SERIAL PRIMARY KEY,

  theme_id INT REFERENCES themes(id),

  grade INT NOT NULL CHECK (grade IN (3, 4)),
  question_text TEXT NOT NULL,

  subject_object TEXT[] NOT NULL DEFAULT '{}',
  emojis TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',

  correct_answers JSONB NOT NULL,
  ai_full_return JSONB,

  tips TEXT[] NOT NULL DEFAULT '{}',

  -- difficulty dimensions
  number_range_id INT REFERENCES number_ranges(id),
  operation_category_id INT REFERENCES operation_categories(id),
  unknown_position_id INT REFERENCES unknown_positions(id),
  linguistic_complexity_id INT REFERENCES linguistic_complexities(id),
  cognitive_demand_id INT REFERENCES cognitive_demands(id),
  operation_count_id INT REFERENCES operation_counts(id),

  total_difficulty_score INT CHECK (total_difficulty_score BETWEEN 6 AND 18),

  difficulty_label TEXT CHECK (difficulty_label IN ('easy', 'medium', 'hard')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Many-to-many: problems ↔ operations & category ↔ operations
-- ─────────────────────────────────────────────

CREATE TABLE problem_operations (
  problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
  operation_id INT REFERENCES operations(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, operation_id)
);

CREATE TABLE operation_category_operations (
  operation_category_id INT REFERENCES operation_categories(id) ON DELETE CASCADE,
  operation_id INT REFERENCES operations(id) ON DELETE CASCADE,
  PRIMARY KEY (operation_category_id, operation_id)
);

-- ──────────────────────────────────────────────────────────
-- Many-to-many: grade + difficulty -> attrs options
-- ──────────────────────────────────────────────────────────

CREATE TABLE difficulty_profiles (
  id SERIAL PRIMARY KEY,

  grade INT NOT NULL CHECK (grade IN (3,4)),

  difficulty_label TEXT NOT NULL
    CHECK (difficulty_label IN ('easy','medium','hard')),

  number_range_id INT REFERENCES number_ranges(id),
  operation_category_id INT REFERENCES operation_categories(id),
  unknown_position_id INT REFERENCES unknown_positions(id),
  linguistic_complexity_id INT REFERENCES linguistic_complexities(id),
  cognitive_demand_id INT REFERENCES cognitive_demands(id),
  operation_count_id INT REFERENCES operation_counts(id),

  total_difficulty_score INT NOT NULL,

  UNIQUE (
    grade,
    difficulty_label,
    number_range_id,
    operation_category_id,
    unknown_position_id,
    linguistic_complexity_id,
    cognitive_demand_id,
    operation_count_id
  )
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
-- Coins to prevent double reward
-- ─────────────────────────────────────────────

CREATE TABLE coin_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, problem_id)
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