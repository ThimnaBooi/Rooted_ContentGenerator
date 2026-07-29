/*
# Phase 7 — Advanced AI & Intelligent Automation Schema

This migration creates the database tables for Rooted's intelligent heritage platform.
All AI features are optional, transparent, and user-controlled. The AI never
automatically modifies archive content — it only makes suggestions that require
user approval.

## New Tables

1. `ai_settings` — Per-user AI feature toggles. Each AI capability can be
   individually enabled or disabled. Defaults to all enabled.
2. `ai_tasks` — Long-running AI processing jobs (OCR, voice transcription,
   photo analysis, content generation). Tracks status, progress, retries,
   and results.
3. `ai_suggestions` — General-purpose AI suggestions (missing memories,
   incomplete profiles, creative recommendations, relationship suggestions,
   timeline gaps, duplicate detection). Each has a confidence score,
   explanation, entity references, and user action (dismiss/accept/review-later).
4. `ai_preferences` — Learned user preferences (writing style, image style,
   narration voice, language, export formats, templates). Users can reset
   these at any time.
5. `ai_job_history` — Completed AI task history for audit trail and re-access.
6. `duplicate_reviews` — Pairs of entities the AI suspects are duplicates,
   with user resolution (merge/ignore/review-later).
7. `relationship_suggestions` — AI-detected likely relationships between people,
   with evidence and user confirmation.
8. `timeline_gaps` — Detected missing years/periods in the family timeline.
9. `ocr_results` — OCR-extracted text from documents, with user review/edit state.
10. `voice_transcripts` — Speech-to-text transcripts of voice recordings,
    with speaker separation, summaries, and quote extraction.
11. `photo_analysis` — AI photo analysis results (faces, suggested people,
    locations, events, dates, duplicate detection). Requires explicit consent.
12. `archive_health` — Cached archive health metrics per user, refreshed
    periodically.
13. `family_insights` — Cached family insight metrics per user.
14. `intelligent_notifications` — AI-generated contextual reminders.

## Security

- All tables use RLS with `auth.uid() = user_id` ownership checks.
- All tables have `user_id uuid NOT NULL DEFAULT auth.uid()` so client-side
  inserts that omit user_id succeed.
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE).
- Only authenticated users can access AI-powered features.
*/

-- 1. AI Settings
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_suggestions boolean NOT NULL DEFAULT true,
  photo_analysis boolean NOT NULL DEFAULT false,
  ocr_enabled boolean NOT NULL DEFAULT true,
  voice_analysis boolean NOT NULL DEFAULT true,
  relationship_suggestions boolean NOT NULL DEFAULT true,
  timeline_suggestions boolean NOT NULL DEFAULT true,
  creative_recommendations boolean NOT NULL DEFAULT true,
  content_repurposing boolean NOT NULL DEFAULT true,
  learning_preferences boolean NOT NULL DEFAULT true,
  intelligent_notifications boolean NOT NULL DEFAULT true,
  face_detection_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_settings" ON ai_settings;
CREATE POLICY "select_own_ai_settings" ON ai_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_settings" ON ai_settings;
CREATE POLICY "insert_own_ai_settings" ON ai_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_settings" ON ai_settings;
CREATE POLICY "update_own_ai_settings" ON ai_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_settings" ON ai_settings;
CREATE POLICY "delete_own_ai_settings" ON ai_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. AI Tasks
CREATE TABLE IF NOT EXISTS ai_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  input_data jsonb,
  output_data jsonb,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_status ON ai_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_created ON ai_tasks(user_id, created_at DESC);

ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_tasks" ON ai_tasks;
CREATE POLICY "select_own_ai_tasks" ON ai_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_tasks" ON ai_tasks;
CREATE POLICY "insert_own_ai_tasks" ON ai_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_tasks" ON ai_tasks;
CREATE POLICY "update_own_ai_tasks" ON ai_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_tasks" ON ai_tasks;
CREATE POLICY "delete_own_ai_tasks" ON ai_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. AI Suggestions
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL,
  title text NOT NULL,
  description text,
  explanation text,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  entity_type text,
  entity_id text,
  entity_ref_2_type text,
  entity_ref_2_id text,
  action_label text,
  action_href text,
  metadata jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dismissed','accepted','review_later')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_status ON ai_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_type ON ai_suggestions(user_id, suggestion_type);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "select_own_ai_suggestions" ON ai_suggestions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "insert_own_ai_suggestions" ON ai_suggestions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "update_own_ai_suggestions" ON ai_suggestions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_suggestions" ON ai_suggestions;
CREATE POLICY "delete_own_ai_suggestions" ON ai_suggestions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 4. AI Preferences (learned)
CREATE TABLE IF NOT EXISTS ai_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key text NOT NULL,
  preference_value text NOT NULL,
  preference_category text NOT NULL,
  confidence_score integer NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  times_observed integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, preference_key)
);

ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_preferences" ON ai_preferences;
CREATE POLICY "select_own_ai_preferences" ON ai_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_preferences" ON ai_preferences;
CREATE POLICY "insert_own_ai_preferences" ON ai_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_preferences" ON ai_preferences;
CREATE POLICY "update_own_ai_preferences" ON ai_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_preferences" ON ai_preferences;
CREATE POLICY "delete_own_ai_preferences" ON ai_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 5. AI Job History
CREATE TABLE IF NOT EXISTS ai_job_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  task_title text,
  status text NOT NULL,
  input_summary text,
  output_summary text,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_job_history_user ON ai_job_history(user_id, created_at DESC);

ALTER TABLE ai_job_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_job_history" ON ai_job_history;
CREATE POLICY "select_own_ai_job_history" ON ai_job_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_job_history" ON ai_job_history;
CREATE POLICY "insert_own_ai_job_history" ON ai_job_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_job_history" ON ai_job_history;
CREATE POLICY "update_own_ai_job_history" ON ai_job_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_job_history" ON ai_job_history;
CREATE POLICY "delete_own_ai_job_history" ON ai_job_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 6. Duplicate Reviews
CREATE TABLE IF NOT EXISTS duplicate_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_1_id text NOT NULL,
  entity_1_title text,
  entity_2_id text NOT NULL,
  entity_2_title text NOT NULL,
  similarity_score integer CHECK (similarity_score >= 0 AND similarity_score <= 100),
  explanation text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','merged','ignored','review_later')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE duplicate_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_duplicate_reviews" ON duplicate_reviews;
CREATE POLICY "select_own_duplicate_reviews" ON duplicate_reviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_duplicate_reviews" ON duplicate_reviews;
CREATE POLICY "insert_own_duplicate_reviews" ON duplicate_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_duplicate_reviews" ON duplicate_reviews;
CREATE POLICY "update_own_duplicate_reviews" ON duplicate_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_duplicate_reviews" ON duplicate_reviews;
CREATE POLICY "delete_own_duplicate_reviews" ON duplicate_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 7. Relationship Suggestions
CREATE TABLE IF NOT EXISTS relationship_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  person_1_id uuid NOT NULL,
  person_1_name text,
  person_2_id uuid NOT NULL,
  person_2_name text NOT NULL,
  suggested_relationship text NOT NULL,
  evidence text,
  source_entity_type text,
  source_entity_id text,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','dismissed','review_later')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE relationship_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_relationship_suggestions" ON relationship_suggestions;
CREATE POLICY "select_own_relationship_suggestions" ON relationship_suggestions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_relationship_suggestions" ON relationship_suggestions;
CREATE POLICY "insert_own_relationship_suggestions" ON relationship_suggestions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_relationship_suggestions" ON relationship_suggestions;
CREATE POLICY "update_own_relationship_suggestions" ON relationship_suggestions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_relationship_suggestions" ON relationship_suggestions;
CREATE POLICY "delete_own_relationship_suggestions" ON relationship_suggestions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 8. Timeline Gaps
CREATE TABLE IF NOT EXISTS timeline_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  gap_start_year integer NOT NULL,
  gap_end_year integer NOT NULL,
  gap_description text,
  surrounding_context text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','documented','dismissed','review_later')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_gaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timeline_gaps" ON timeline_gaps;
CREATE POLICY "select_own_timeline_gaps" ON timeline_gaps FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_timeline_gaps" ON timeline_gaps;
CREATE POLICY "insert_own_timeline_gaps" ON timeline_gaps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_timeline_gaps" ON timeline_gaps;
CREATE POLICY "update_own_timeline_gaps" ON timeline_gaps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_timeline_gaps" ON timeline_gaps;
CREATE POLICY "delete_own_timeline_gaps" ON timeline_gaps FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 9. OCR Results
CREATE TABLE IF NOT EXISTS ocr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid,
  extracted_text text,
  edited_text text,
  suggested_people text[],
  suggested_places text[],
  suggested_dates text[],
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','edited','saved','dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ocr_results" ON ocr_results;
CREATE POLICY "select_own_ocr_results" ON ocr_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ocr_results" ON ocr_results;
CREATE POLICY "insert_own_ocr_results" ON ocr_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ocr_results" ON ocr_results;
CREATE POLICY "update_own_ocr_results" ON ocr_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ocr_results" ON ocr_results;
CREATE POLICY "delete_own_ocr_results" ON ocr_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 10. Voice Transcripts
CREATE TABLE IF NOT EXISTS voice_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_recording_id uuid,
  transcript_text text,
  edited_transcript text,
  speakers jsonb,
  summary text,
  important_quotes text[],
  suggested_memories jsonb,
  suggested_timeline_events jsonb,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','edited','saved','dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE voice_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_voice_transcripts" ON voice_transcripts;
CREATE POLICY "select_own_voice_transcripts" ON voice_transcripts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_voice_transcripts" ON voice_transcripts;
CREATE POLICY "insert_own_voice_transcripts" ON voice_transcripts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_voice_transcripts" ON voice_transcripts;
CREATE POLICY "update_own_voice_transcripts" ON voice_transcripts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_voice_transcripts" ON voice_transcripts;
CREATE POLICY "delete_own_voice_transcripts" ON voice_transcripts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 11. Photo Analysis
CREATE TABLE IF NOT EXISTS photo_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL,
  faces_detected jsonb,
  suggested_people jsonb,
  suggested_location text,
  suggested_event text,
  suggested_date text,
  is_duplicate boolean DEFAULT false,
  duplicate_of_photo_id uuid,
  related_memories jsonb,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  analysis_consent_given boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','reviewed','saved','dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE photo_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_photo_analysis" ON photo_analysis;
CREATE POLICY "select_own_photo_analysis" ON photo_analysis FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_photo_analysis" ON photo_analysis;
CREATE POLICY "insert_own_photo_analysis" ON photo_analysis FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_photo_analysis" ON photo_analysis;
CREATE POLICY "update_own_photo_analysis" ON photo_analysis FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_photo_analysis" ON photo_analysis;
CREATE POLICY "delete_own_photo_analysis" ON photo_analysis FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 12. Archive Health
CREATE TABLE IF NOT EXISTS archive_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total_people integer NOT NULL DEFAULT 0,
  complete_profiles integer NOT NULL DEFAULT 0,
  incomplete_profiles integer NOT NULL DEFAULT 0,
  profile_completeness_pct integer NOT NULL DEFAULT 0,
  total_memories integer NOT NULL DEFAULT 0,
  total_recipes integer NOT NULL DEFAULT 0,
  total_traditions integer NOT NULL DEFAULT 0,
  total_photos integer NOT NULL DEFAULT 0,
  total_voice_recordings integer NOT NULL DEFAULT 0,
  total_documents integer NOT NULL DEFAULT 0,
  total_places integer NOT NULL DEFAULT 0,
  total_events integer NOT NULL DEFAULT 0,
  missing_generations text[],
  timeline_coverage jsonb,
  geographic_coverage jsonb,
  recommendations jsonb,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE archive_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_archive_health" ON archive_health;
CREATE POLICY "select_own_archive_health" ON archive_health FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_archive_health" ON archive_health;
CREATE POLICY "insert_own_archive_health" ON archive_health FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_archive_health" ON archive_health;
CREATE POLICY "update_own_archive_health" ON archive_health FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_archive_health" ON archive_health;
CREATE POLICY "delete_own_archive_health" ON archive_health FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 13. Family Insights
CREATE TABLE IF NOT EXISTS family_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  most_documented_members jsonb,
  oldest_preserved_memory text,
  oldest_memory_date date,
  most_common_traditions jsonb,
  frequently_visited_locations jsonb,
  most_photographed_person jsonb,
  most_contributed_recipes jsonb,
  timeline_coverage jsonb,
  archive_growth jsonb,
  monthly_activity jsonb,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE family_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_family_insights" ON family_insights;
CREATE POLICY "select_own_family_insights" ON family_insights FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_family_insights" ON family_insights;
CREATE POLICY "insert_own_family_insights" ON family_insights FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_family_insights" ON family_insights;
CREATE POLICY "update_own_family_insights" ON family_insights FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_family_insights" ON family_insights;
CREATE POLICY "delete_own_family_insights" ON family_insights FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 14. Intelligent Notifications
CREATE TABLE IF NOT EXISTS intelligent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text,
  action_label text,
  action_href text,
  is_read boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligent_notifications_user ON intelligent_notifications(user_id, is_read, created_at DESC);

ALTER TABLE intelligent_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_intelligent_notifications" ON intelligent_notifications;
CREATE POLICY "select_own_intelligent_notifications" ON intelligent_notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_intelligent_notifications" ON intelligent_notifications;
CREATE POLICY "insert_own_intelligent_notifications" ON intelligent_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_intelligent_notifications" ON intelligent_notifications;
CREATE POLICY "update_own_intelligent_notifications" ON intelligent_notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_intelligent_notifications" ON intelligent_notifications;
CREATE POLICY "delete_own_intelligent_notifications" ON intelligent_notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ai_settings','ai_tasks','ai_suggestions','ai_preferences',
      'duplicate_reviews','relationship_suggestions','timeline_gaps',
      'ocr_results','voice_transcripts','photo_analysis'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;', tbl, tbl);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl);
  END LOOP;
END $$;