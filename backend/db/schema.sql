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

  created_by TEXT NOT NULL DEFAULT 'self'
    CHECK (created_by IN ('self', 'teacher')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT self_registered_requires_password
    CHECK (
      created_by != 'self'
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

  problem_number INT NOT NULL,
  question_text TEXT NOT NULL,

  subject_object TEXT NOT NULL,

  emojis TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',

  correct_answers TEXT[] NOT NULL,

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