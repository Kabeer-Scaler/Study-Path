export const sqlSchema = `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  password_hash TEXT,
  session_token TEXT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  goal TEXT,
  self_rated_level TEXT,
  preferred_style TEXT,
  daily_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE concepts (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER,
  prerequisites TEXT
);

CREATE TABLE assessment_questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  options TEXT,
  correct_answer TEXT NOT NULL,
  accepted_answers TEXT,
  explanation TEXT,
  difficulty INTEGER NOT NULL
);

CREATE TABLE assessment_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE assessment_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  misconception TEXT,
  difficulty INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learner_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  mastery_score REAL NOT NULL,
  confidence REAL DEFAULT 0.5,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE curricula (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  generated_reason TEXT,
  version INTEGER NOT NULL,
  change_reason TEXT,
  is_latest BOOLEAN NOT NULL,
  parent_curriculum_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  target_concepts TEXT
);

CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  estimated_minutes INTEGER,
  order_index INTEGER,
  status TEXT DEFAULT 'not_started',
  mastery_target REAL,
  why_assigned TEXT,
  why_skipped TEXT,
  is_remedial BOOLEAN DEFAULT FALSE,
  is_challenge BOOLEAN DEFAULT FALSE
);

CREATE TABLE quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  score REAL NOT NULL,
  total_questions INTEGER,
  correct_answers INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tutor_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  tutor_strategy TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mastery_evidence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  previous_mastery REAL NOT NULL,
  new_mastery REAL NOT NULL,
  previous_confidence REAL NOT NULL,
  new_confidence REAL NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  misconception TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_schedule (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  due_after_completed_lessons INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
