-- =============================================================================
-- MEANING MAP EDITOR \u2014 DATABASE SCHEMA
-- Supabase (PostgreSQL) with Row-Level Security
-- Migration: 001_initial_schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable required extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE project_status AS ENUM (
  'draft', 'pass1', 'pass2', 'pass3', 'review', 'validated'
);

CREATE TYPE major_genre AS ENUM (
  'narrative', 'law', 'poetry', 'prophecy',
  'wisdom', 'discourse_speech', 'apocalyptic'
);

CREATE TYPE flag_severity AS ENUM ('error', 'warning', 'suggestion');
CREATE TYPE flag_status AS ENUM ('open', 'resolved', 'dismissed');
CREATE TYPE validation_level AS ENUM ('L1_exegete', 'L2_linguist', 'L3_consultant');

-- ---------------------------------------------------------------------------
-- PROJECTS
-- A project = one pericope (verse range) with genre/subgenre selection.
-- ---------------------------------------------------------------------------

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  book TEXT NOT NULL,               -- e.g., 'ruth'
  chapter_start INT NOT NULL,
  verse_start INT NOT NULL,
  chapter_end INT NOT NULL,
  verse_end INT NOT NULL,
  genre major_genre NOT NULL,
  subgenre TEXT NOT NULL,           -- e.g., 'journey', 'individual_lament'
  thematic_spine TEXT DEFAULT '',   -- one-sentence meaning arc
  peak_clause_id INT,              -- BHSA clause ID of discourse peak
  status project_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user's project list
CREATE INDEX idx_projects_user ON projects(created_by, updated_at DESC);

-- ---------------------------------------------------------------------------
-- CLAUSE ANNOTATIONS
-- One row per clause per project. The events field is a JSONB array
-- supporting multi-event per clause (primary + embedded events).
-- All Pass 1\u20133 tags are stored here.
-- ---------------------------------------------------------------------------

CREATE TABLE clause_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  clause_id INT NOT NULL,           -- BHSA clause ID (sacred, never split/merge)

  -- Pass 1: Structural Skeleton (events as JSONB array)
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  --   Each event object:
  --   {
  --     "id": "evt_1",
  --     "is_primary": true,
  --     "embedded_relation": null,
  --     "event_category": "SPEECH",
  --     "verbal_core": "urge",
  --     "verbless_predication": null,
  --     "participants": [...],
  --     "reality": "actual",
  --     "polarity": "negative",
  --     "time_frame": "immediate",
  --     "aspect": "not_specified"
  --   }

  relations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Pass 2: Semantic Context (clause-level)
  discourse_function TEXT NOT NULL DEFAULT 'not_specified',
  discourse_relation TEXT NOT NULL DEFAULT 'not_specified',
  register TEXT NOT NULL DEFAULT 'not_specified',
  social_axis TEXT NOT NULL DEFAULT 'not_specified',
  prominence TEXT NOT NULL DEFAULT 'not_specified',
  pacing TEXT NOT NULL DEFAULT 'not_specified',
  evidentiality TEXT NOT NULL DEFAULT 'not_specified',

  -- Pass 3: Expressive Layer
  emotion TEXT NOT NULL DEFAULT 'not_specified',
  emotion_intensity TEXT NOT NULL DEFAULT 'not_specified',
  narrator_stance TEXT NOT NULL DEFAULT 'not_specified',
  speech_act TEXT NOT NULL DEFAULT 'not_specified',
  figurative_language JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of strings
  key_term_domain JSONB NOT NULL DEFAULT '[]'::jsonb,      -- array of strings
  confidence TEXT NOT NULL DEFAULT 'medium',

  -- Metadata
  notes TEXT DEFAULT '',
  other_fields JSONB NOT NULL DEFAULT '{}'::jsonb,  -- stores "other" free-text entries
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id),

  -- Each clause appears once per project
  UNIQUE(project_id, clause_id)
);

-- Index for loading all annotations for a project
CREATE INDEX idx_annotations_project ON clause_annotations(project_id);

-- Index for looking up a specific clause
CREATE INDEX idx_annotations_clause ON clause_annotations(project_id, clause_id);

-- GIN index for JSONB event queries
CREATE INDEX idx_annotations_events ON clause_annotations USING gin(events);

-- ---------------------------------------------------------------------------
-- REVIEW FLAGS (Pass 4: AI Review)
-- AI checks produce flags. Analysts respond. AI never changes tags.
-- ---------------------------------------------------------------------------

CREATE TABLE review_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  clause_id INT NOT NULL,           -- which clause the flag targets
  category TEXT NOT NULL,           -- consistency, missing_fields, cross_clause, plausibility, genre_expectations
  severity flag_severity NOT NULL,
  message TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  status flag_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for loading flags per project
CREATE INDEX idx_flags_project ON review_flags(project_id, status);

-- Index for jump-to-clause
CREATE INDEX idx_flags_clause ON review_flags(project_id, clause_id);

-- ---------------------------------------------------------------------------
-- VALIDATION LOG (Three-Level Pipeline)
-- L1 = Biblical Language Specialist (Exegete)
-- L2 = Linguist
-- L3 = Translation Consultant
-- Disagreement \u2192 preserve both readings as variants.
-- ---------------------------------------------------------------------------

CREATE TABLE validation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  level validation_level NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  variant_reading TEXT,             -- if disagreement, preserve alternate reading
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for checking validation status
CREATE INDEX idx_validation_project ON validation_log(project_id, level);

-- ---------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clause_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_log ENABLE ROW LEVEL SECURITY;

-- Projects: users can see all projects (for collaboration), but only edit own
CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = created_by);

-- Annotations: anyone in the project can read; author can edit
CREATE POLICY "Users can view annotations"
  ON clause_annotations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert annotations"
  ON clause_annotations FOR INSERT
  WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can update annotations"
  ON clause_annotations FOR UPDATE
  USING (auth.uid() = updated_by);

-- Review flags: everyone reads; only system/author can insert
CREATE POLICY "Users can view flags"
  ON review_flags FOR SELECT
  USING (true);

CREATE POLICY "Users can insert flags"
  ON review_flags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update flags"
  ON review_flags FOR UPDATE
  USING (true);

-- Validation log: all read; validators insert
CREATE POLICY "Users can view validation"
  ON validation_log FOR SELECT
  USING (true);

CREATE POLICY "Users can insert validation"
  ON validation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER annotations_updated_at
  BEFORE UPDATE ON clause_annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
