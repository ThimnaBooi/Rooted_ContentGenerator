/*
# Rooted Heritage Experience & Media Studio Schema (Phase 6)

## Purpose
Transforms Rooted from a preservation archive into an interactive multimedia
heritage platform. Adds interactive family tree, enhanced timeline, memory map,
heritage collections, digital time capsules, AI audio/video generation, social
media studio, connected accounts, and an expanded media library.

## New tables

1. **heritage_collections** — themed groupings of archive content (Family
   Recipes, Weddings, Military Service, etc.) with a type and cover image.
2. **heritage_collection_items** — junction linking collections to archive
   entities (memories, photos, recipes, traditions, events, documents, people).
3. **time_capsules** — sealed messages/media that unlock on a chosen future date.
   Stores recipients, unlock date, content, and notification preferences.
4. **time_capsule_media** — junction linking time capsules to photos/documents.
5. **memory_map_pins** — significant locations pinned on the memory map. Stores
   name, description, coordinates (lat/lng), address, and pin type.
6. **memory_map_connections** — junction linking map pins to people, memories,
   photos, events, traditions.
7. **generated_audio** — AI-generated audio files (narrated biographies,
   audiobooks, narrated stories, etc.). Stores voice settings, audio URL,
   source entity reference, and accessibility transcript.
8. **generated_videos** — AI-generated videos (tributes, documentaries,
   slideshows). Stores video settings, video URL, source references, and
   accessibility captions/subtitles.
9. **social_accounts** — connected social media accounts. Stores platform,
   encrypted token, account info, and connection status. Never stores passwords.
10. **social_posts** — social media posts (drafts, scheduled, published).
    Stores platform, content, media references, status, and scheduled time.
11. **media_library_items** — unified media library entries for all generated
    content (text, images, audio, video, social drafts, downloads). Supports
    categorisation, search, archival, and permanent deletion.
12. **ai_recommendations** — dismissible AI suggestions based on archive
    content (e.g. "You have enough memories to create a documentary").

## Security
- RLS enabled on every new table.
- Owner-scoped: user_id = auth.uid() for all CRUD.
- Social account tokens are stored but never exposed through SELECT policies
  beyond the owner themselves.
- All tables use the established 4-policy pattern.
*/

-- ============ HERITAGE COLLECTIONS ============
CREATE TABLE IF NOT EXISTS heritage_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  collection_type text NOT NULL DEFAULT 'custom',
  cover_image_url text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE heritage_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_heritage_collections" ON heritage_collections;
CREATE POLICY "select_own_heritage_collections" ON heritage_collections FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_heritage_collections" ON heritage_collections;
CREATE POLICY "insert_own_heritage_collections" ON heritage_collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_heritage_collections" ON heritage_collections;
CREATE POLICY "update_own_heritage_collections" ON heritage_collections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_heritage_collections" ON heritage_collections;
CREATE POLICY "delete_own_heritage_collections" ON heritage_collections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_heritage_collections_user ON heritage_collections(user_id);

-- ============ HERITAGE COLLECTION ITEMS ============
CREATE TABLE IF NOT EXISTS heritage_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES heritage_collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE heritage_collection_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_heritage_collection_items" ON heritage_collection_items;
CREATE POLICY "select_own_heritage_collection_items" ON heritage_collection_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_heritage_collection_items" ON heritage_collection_items;
CREATE POLICY "insert_own_heritage_collection_items" ON heritage_collection_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_heritage_collection_items" ON heritage_collection_items;
CREATE POLICY "delete_own_heritage_collection_items" ON heritage_collection_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_hci_collection ON heritage_collection_items(collection_id);

-- ============ TIME CAPSULES ============
CREATE TABLE IF NOT EXISTS time_capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  recipients text,
  unlock_date date NOT NULL,
  notify_on_unlock boolean NOT NULL DEFAULT true,
  is_opened boolean NOT NULL DEFAULT false,
  opened_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_time_capsules" ON time_capsules;
CREATE POLICY "select_own_time_capsules" ON time_capsules FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_time_capsules" ON time_capsules;
CREATE POLICY "insert_own_time_capsules" ON time_capsules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_time_capsules" ON time_capsules;
CREATE POLICY "update_own_time_capsules" ON time_capsules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_time_capsules" ON time_capsules;
CREATE POLICY "delete_own_time_capsules" ON time_capsules FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_user ON time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock ON time_capsules(user_id, unlock_date);

-- ============ TIME CAPSULE MEDIA ============
CREATE TABLE IF NOT EXISTS time_capsule_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_capsule_id uuid NOT NULL REFERENCES time_capsules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  media_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE time_capsule_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_time_capsule_media" ON time_capsule_media;
CREATE POLICY "select_own_time_capsule_media" ON time_capsule_media FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_time_capsule_media" ON time_capsule_media;
CREATE POLICY "insert_own_time_capsule_media" ON time_capsule_media FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_time_capsule_media" ON time_capsule_media;
CREATE POLICY "delete_own_time_capsule_media" ON time_capsule_media FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_tcm_capsule ON time_capsule_media(time_capsule_id);

-- ============ MEMORY MAP PINS ============
CREATE TABLE IF NOT EXISTS memory_map_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  pin_type text NOT NULL DEFAULT 'home',
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE memory_map_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memory_map_pins" ON memory_map_pins;
CREATE POLICY "select_own_memory_map_pins" ON memory_map_pins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memory_map_pins" ON memory_map_pins;
CREATE POLICY "insert_own_memory_map_pins" ON memory_map_pins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_memory_map_pins" ON memory_map_pins;
CREATE POLICY "update_own_memory_map_pins" ON memory_map_pins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memory_map_pins" ON memory_map_pins;
CREATE POLICY "delete_own_memory_map_pins" ON memory_map_pins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_memory_map_pins_user ON memory_map_pins(user_id);

-- ============ MEMORY MAP CONNECTIONS ============
CREATE TABLE IF NOT EXISTS memory_map_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid NOT NULL REFERENCES memory_map_pins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE memory_map_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memory_map_connections" ON memory_map_connections;
CREATE POLICY "select_own_memory_map_connections" ON memory_map_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memory_map_connections" ON memory_map_connections;
CREATE POLICY "insert_own_memory_map_connections" ON memory_map_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memory_map_connections" ON memory_map_connections;
CREATE POLICY "delete_own_memory_map_connections" ON memory_map_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mmc_pin ON memory_map_connections(pin_id);

-- ============ GENERATED AUDIO ============
CREATE TABLE IF NOT EXISTS generated_audio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  audio_type text NOT NULL DEFAULT 'narration',
  source_entity_type text,
  source_entity_id uuid,
  source_document_id uuid,
  narrator_voice text NOT NULL DEFAULT 'warm_female',
  speaking_speed text NOT NULL DEFAULT 'normal',
  speaking_style text NOT NULL DEFAULT 'narrative',
  emotional_tone text NOT NULL DEFAULT 'warm',
  background_ambience text,
  background_music text,
  output_language text NOT NULL DEFAULT 'en',
  storage_path text,
  public_url text,
  duration_seconds integer,
  transcript text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','processing','error')),
  is_favourite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE generated_audio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_generated_audio" ON generated_audio;
CREATE POLICY "select_own_generated_audio" ON generated_audio FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_generated_audio" ON generated_audio;
CREATE POLICY "insert_own_generated_audio" ON generated_audio FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_generated_audio" ON generated_audio;
CREATE POLICY "update_own_generated_audio" ON generated_audio FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_generated_audio" ON generated_audio;
CREATE POLICY "delete_own_generated_audio" ON generated_audio FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_generated_audio_user ON generated_audio(user_id);

-- ============ GENERATED VIDEOS ============
CREATE TABLE IF NOT EXISTS generated_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_type text NOT NULL DEFAULT 'tribute',
  source_entity_type text,
  source_entity_id uuid,
  source_project_id uuid,
  duration_seconds integer,
  theme text NOT NULL DEFAULT 'classic',
  animation_style text NOT NULL DEFAULT 'fade',
  transition_style text NOT NULL DEFAULT 'smooth',
  music_track text,
  narration_audio_id uuid REFERENCES generated_audio(id) ON DELETE SET NULL,
  font_style text NOT NULL DEFAULT 'serif',
  color_scheme text NOT NULL DEFAULT 'warm',
  storage_path text,
  public_url text,
  thumbnail_url text,
  captions text,
  subtitles text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','processing','error')),
  is_favourite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_generated_videos" ON generated_videos;
CREATE POLICY "select_own_generated_videos" ON generated_videos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_generated_videos" ON generated_videos;
CREATE POLICY "insert_own_generated_videos" ON generated_videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_generated_videos" ON generated_videos;
CREATE POLICY "update_own_generated_videos" ON generated_videos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_generated_videos" ON generated_videos;
CREATE POLICY "delete_own_generated_videos" ON generated_videos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_user ON generated_videos(user_id);

-- ============ SOCIAL ACCOUNTS ============
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_handle text,
  account_name text,
  account_avatar_url text,
  encrypted_token text,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','expired','error')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, platform)
);
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_social_accounts" ON social_accounts;
CREATE POLICY "select_own_social_accounts" ON social_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_social_accounts" ON social_accounts;
CREATE POLICY "insert_own_social_accounts" ON social_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_social_accounts" ON social_accounts;
CREATE POLICY "update_own_social_accounts" ON social_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_social_accounts" ON social_accounts;
CREATE POLICY "delete_own_social_accounts" ON social_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);

-- ============ SOCIAL POSTS ============
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content text NOT NULL,
  caption text,
  hashtags text[],
  media_urls text[],
  media_type text,
  source_entity_type text,
  source_entity_id uuid,
  source_audio_id uuid,
  source_video_id uuid,
  source_document_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed','cancelled')),
  scheduled_for timestamptz,
  published_at timestamptz,
  platform_post_id text,
  privacy_reminder_shown boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_social_posts" ON social_posts;
CREATE POLICY "select_own_social_posts" ON social_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_social_posts" ON social_posts;
CREATE POLICY "insert_own_social_posts" ON social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_social_posts" ON social_posts;
CREATE POLICY "update_own_social_posts" ON social_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_social_posts" ON social_posts;
CREATE POLICY "delete_own_social_posts" ON social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(user_id, status);

-- ============ MEDIA LIBRARY ITEMS ============
CREATE TABLE IF NOT EXISTS media_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  media_category text NOT NULL CHECK (media_category IN ('text','image','audio','video','social_draft','downloaded','published')),
  source_type text NOT NULL,
  source_id uuid,
  storage_path text,
  public_url text,
  file_size_bytes bigint,
  duration_seconds integer,
  alt_text text,
  transcript text,
  is_archived boolean NOT NULL DEFAULT false,
  is_favourite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE media_library_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_media_library_items" ON media_library_items;
CREATE POLICY "select_own_media_library_items" ON media_library_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_media_library_items" ON media_library_items;
CREATE POLICY "insert_own_media_library_items" ON media_library_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_media_library_items" ON media_library_items;
CREATE POLICY "update_own_media_library_items" ON media_library_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_media_library_items" ON media_library_items;
CREATE POLICY "delete_own_media_library_items" ON media_library_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_user ON media_library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_category ON media_library_items(user_id, media_category);

-- ============ AI RECOMMENDATIONS ============
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  action_label text,
  action_href text,
  entity_type text,
  entity_id uuid,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "select_own_ai_recommendations" ON ai_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "insert_own_ai_recommendations" ON ai_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "update_own_ai_recommendations" ON ai_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "delete_own_ai_recommendations" ON ai_recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id, is_dismissed);

-- ============ UPDATED_AT TRIGGERS ============
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['heritage_collections','time_capsules','memory_map_pins','generated_audio','generated_videos','social_accounts','social_posts','media_library_items'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;
