CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,

  email TEXT NOT NULL UNIQUE,

  auth_type TEXT NOT NULL
    CHECK (auth_type IN ('password', 'qr', 'anonymous')),

  password_hash TEXT,

  qr_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  qr_generated_at TIMESTAMPTZ DEFAULT NOW(),

  coins INT NOT NULL DEFAULT 0,

  avatar_url TEXT NOT NULL DEFAULT '/uploads/avatars/student-avatar-placeholder.png',

  has_completed_tutorial    BOOLEAN NOT NULL DEFAULT false,
  has_completed_assessment  BOOLEAN NOT NULL DEFAULT false,

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

CREATE TABLE user_dimension_ability (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  category_type TEXT NOT NULL CHECK (category_type IN (
    'number_range', 'operation_category', 'unknown_position',
    'linguistic_complexity', 'cognitive_demand', 'operation_count'
  )),

  ability NUMERIC(5,3) NOT NULL DEFAULT 0, -- logit scale, 0 = neutral/average
  attempts_count INT NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, category_type)
);

CREATE INDEX idx_uda_user_type ON user_dimension_ability(user_id, category_type);

CREATE TABLE user_skill_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  name TEXT NOT NULL UNIQUE,
  difficulty_label TEXT NOT NULL CHECK (difficulty_label IN ('easy', 'medium', 'hard')),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3)
);

CREATE TABLE unknown_positions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
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
  description TEXT,
  difficulty_label TEXT NOT NULL CHECK (difficulty_label IN ('easy', 'medium', 'hard')),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3),
  UNIQUE (num_operations)
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

  number_range_id INT REFERENCES number_ranges(id),
  operation_category_id INT REFERENCES operation_categories(id),
  unknown_position_id INT REFERENCES unknown_positions(id),
  linguistic_complexity_id INT REFERENCES linguistic_complexities(id),
  cognitive_demand_id INT REFERENCES cognitive_demands(id),
  operation_count_id INT REFERENCES operation_counts(id),

  total_difficulty_score INT CHECK (total_difficulty_score BETWEEN 6 AND 18),
  difficulty_label TEXT CHECK (difficulty_label IN ('easy', 'medium', 'hard')),

  is_assessment BOOLEAN NOT NULL DEFAULT false,
  assessment_order INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_problems_assessment_order
  ON problems (assessment_order)
  WHERE is_assessment = true;

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

-- ─────────────────────────────────────────────
-- Difficulty profiles
-- ─────────────────────────────────────────────

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
-- Coins
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

CREATE TABLE generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  quantity INTEGER NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE generation_request_problems (
  generation_request_id UUID NOT NULL REFERENCES generation_requests(id) ON DELETE CASCADE,
  placeholder_index INTEGER NOT NULL,
  problem_id INTEGER NOT NULL REFERENCES problems(id),
  PRIMARY KEY (generation_request_id, placeholder_index)
);