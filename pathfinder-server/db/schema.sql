-- PathFinder AI — PostgreSQL 스키마
-- 실행: psql -U postgres -d pathfinder_db -f schema.sql

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ══════════════════════════════════════════
-- 1. 사용자
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- 2. 검사 세션
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  pdi_answers  JSONB DEFAULT '{}',
  ai_state     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- ══════════════════════════════════════════
-- 3. 드로잉 단계 (집·나무·사람)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  stage_key    TEXT NOT NULL CHECK (stage_key IN ('house', 'tree', 'person')),
  image_data   TEXT,          -- base64 PNG
  stroke_log   JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, stage_key)
);

CREATE INDEX IF NOT EXISTS idx_stages_session_id ON stages(session_id);

-- ══════════════════════════════════════════
-- 4. 분석 결과
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS analysis_results (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  result     JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
