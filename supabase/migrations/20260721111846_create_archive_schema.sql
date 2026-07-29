/*
# Rooted Living Archive — core schema (Phase 2)

## Purpose
Creates the full structured archive that every registered user owns privately:
people, families, relationships, memories, photos, documents, voice recordings,
recipes, traditions, places, events, and an activity feed. All tables are
owner-scoped (user_id) with Row Level Security so a user can only see and modify
their own data. Junction tables connect people to memories, recipes, events,
documents, traditions, and places, and store relationships between people.

## New tables
1. people — profiles of individuals in the archive
2. families — family groups the user creates
3. family_members — which people belong to which families
4. relationships — directed relationships between two people (parent, child, sibling, spouse, …)
5. memories — stories / moments with emotional categories and tags
6. photos — photographs with captions, dates, locations
7. documents — scanned letters, certificates, notes, etc.
8. voice_recordings — uploaded audio clips
9. recipes — family recipes with ingredients, instructions, notes
10. traditions — family customs with participants and related recipes
11. places — significant locations
12. events — milestones (births, weddings, graduations, …)
13. activity_feed — chronological log of user actions

## Junction tables
- memory_people, memory_photos, memory_documents, memory_voice
- photo_people, document_people, voice_people
- recipe_people, recipe_photos
- tradition_people, tradition_photos, tradition_recipes
- place_people, place_photos, place_memories
- event_people, event_photos

## Security
- RLS enabled on every table.
- Owner-scoped CRUD: each authenticated user can only access rows where
  user_id = auth.uid(). Owner columns default to auth.uid() so inserts that
  omit user_id still satisfy WITH CHECK policies.
- Guest users (anon role) can read nothing — only authenticated users have access.
*/

-- ============ PEOPLE ============
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  preferred_name text,
  date_of_birth date,
  date_of_passing date,
  gender text,
  occupation text,
  bio text,
  personality_traits text[],
  favourite_quotes text[],
  interests text[],
  hobbies text[],
  achievements text[],
  life_lessons text[],
  relationship_to_owner text,
  notes text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_people" ON people;
CREATE POLICY "select_own_people" ON people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_people" ON people;
CREATE POLICY "insert_own_people" ON people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_people" ON people;
CREATE POLICY "update_own_people" ON people FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_people" ON people;
CREATE POLICY "delete_own_people" ON people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ FAMILIES ============
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_families" ON families;
CREATE POLICY "select_own_families" ON families FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_families" ON families;
CREATE POLICY "insert_own_families" ON families FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_families" ON families;
CREATE POLICY "update_own_families" ON families FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_families" ON families;
CREATE POLICY "delete_own_families" ON families FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ FAMILY MEMBERS (junction) ============
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (family_id, person_id)
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_family_members" ON family_members;
CREATE POLICY "select_own_family_members" ON family_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_family_members" ON family_members;
CREATE POLICY "insert_own_family_members" ON family_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_family_members" ON family_members;
CREATE POLICY "update_own_family_members" ON family_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_family_members" ON family_members;
CREATE POLICY "delete_own_family_members" ON family_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ RELATIONSHIPS ============
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  related_person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (person_id <> related_person_id)
);
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_relationships" ON relationships;
CREATE POLICY "select_own_relationships" ON relationships FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_relationships" ON relationships;
CREATE POLICY "insert_own_relationships" ON relationships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_relationships" ON relationships;
CREATE POLICY "delete_own_relationships" ON relationships FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ MEMORIES ============
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  memory_date date,
  location text,
  tags text[],
  emotional_category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memories" ON memories;
CREATE POLICY "select_own_memories" ON memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memories" ON memories;
CREATE POLICY "insert_own_memories" ON memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_memories" ON memories;
CREATE POLICY "update_own_memories" ON memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memories" ON memories;
CREATE POLICY "delete_own_memories" ON memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PHOTOS ============
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  caption text,
  description text,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  approximate_date date,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_photos" ON photos;
CREATE POLICY "select_own_photos" ON photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_photos" ON photos;
CREATE POLICY "insert_own_photos" ON photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_photos" ON photos;
CREATE POLICY "update_own_photos" ON photos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_photos" ON photos;
CREATE POLICY "delete_own_photos" ON photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ VOICE RECORDINGS ============
CREATE TABLE IF NOT EXISTS voice_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  duration_seconds integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_voice" ON voice_recordings;
CREATE POLICY "select_own_voice" ON voice_recordings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_voice" ON voice_recordings;
CREATE POLICY "insert_own_voice" ON voice_recordings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_voice" ON voice_recordings;
CREATE POLICY "update_own_voice" ON voice_recordings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_voice" ON voice_recordings;
CREATE POLICY "delete_own_voice" ON voice_recordings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ RECIPES ============
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  ingredients text,
  instructions text,
  created_by text,
  occasions text,
  personal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_recipes" ON recipes;
CREATE POLICY "select_own_recipes" ON recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_recipes" ON recipes;
CREATE POLICY "insert_own_recipes" ON recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_recipes" ON recipes;
CREATE POLICY "update_own_recipes" ON recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_recipes" ON recipes;
CREATE POLICY "delete_own_recipes" ON recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ TRADITIONS ============
CREATE TABLE IF NOT EXISTS traditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  when_it_happens text,
  participants text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE traditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_traditions" ON traditions;
CREATE POLICY "select_own_traditions" ON traditions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_traditions" ON traditions;
CREATE POLICY "insert_own_traditions" ON traditions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_traditions" ON traditions;
CREATE POLICY "update_own_traditions" ON traditions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_traditions" ON traditions;
CREATE POLICY "delete_own_traditions" ON traditions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PLACES ============
CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_places" ON places;
CREATE POLICY "select_own_places" ON places FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_places" ON places;
CREATE POLICY "insert_own_places" ON places FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_places" ON places;
CREATE POLICY "update_own_places" ON places FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_places" ON places;
CREATE POLICY "delete_own_places" ON places FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ EVENTS ============
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date,
  location text,
  event_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_events" ON events;
CREATE POLICY "select_own_events" ON events FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_events" ON events;
CREATE POLICY "insert_own_events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_events" ON events;
CREATE POLICY "update_own_events" ON events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_events" ON events;
CREATE POLICY "delete_own_events" ON events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ ACTIVITY FEED ============
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_title text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_activity" ON activity_feed;
CREATE POLICY "select_own_activity" ON activity_feed FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity" ON activity_feed;
CREATE POLICY "insert_own_activity" ON activity_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activity" ON activity_feed;
CREATE POLICY "delete_own_activity" ON activity_feed FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ JUNCTION TABLES ============

-- memory_people
CREATE TABLE IF NOT EXISTS memory_people (
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, person_id)
);
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memory_people" ON memory_people;
CREATE POLICY "select_own_memory_people" ON memory_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memory_people" ON memory_people;
CREATE POLICY "insert_own_memory_people" ON memory_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memory_people" ON memory_people;
CREATE POLICY "delete_own_memory_people" ON memory_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- memory_photos
CREATE TABLE IF NOT EXISTS memory_photos (
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, photo_id)
);
ALTER TABLE memory_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memory_photos" ON memory_photos;
CREATE POLICY "select_own_memory_photos" ON memory_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memory_photos" ON memory_photos;
CREATE POLICY "insert_own_memory_photos" ON memory_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memory_photos" ON memory_photos;
CREATE POLICY "delete_own_memory_photos" ON memory_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- memory_documents
CREATE TABLE IF NOT EXISTS memory_documents (
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, document_id)
);
ALTER TABLE memory_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memory_documents" ON memory_documents;
CREATE POLICY "select_own_memory_documents" ON memory_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memory_documents" ON memory_documents;
CREATE POLICY "insert_own_memory_documents" ON memory_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memory_documents" ON memory_documents;
CREATE POLICY "delete_own_memory_documents" ON memory_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- memory_voice
CREATE TABLE IF NOT EXISTS memory_voice (
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  voice_id uuid NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, voice_id)
);
ALTER TABLE memory_voice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_memory_voice" ON memory_voice;
CREATE POLICY "select_own_memory_voice" ON memory_voice FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_memory_voice" ON memory_voice;
CREATE POLICY "insert_own_memory_voice" ON memory_voice FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_memory_voice" ON memory_voice;
CREATE POLICY "delete_own_memory_voice" ON memory_voice FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- photo_people
CREATE TABLE IF NOT EXISTS photo_people (
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, person_id)
);
ALTER TABLE photo_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_photo_people" ON photo_people;
CREATE POLICY "select_own_photo_people" ON photo_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_photo_people" ON photo_people;
CREATE POLICY "insert_own_photo_people" ON photo_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_photo_people" ON photo_people;
CREATE POLICY "delete_own_photo_people" ON photo_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- document_people
CREATE TABLE IF NOT EXISTS document_people (
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, person_id)
);
ALTER TABLE document_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_document_people" ON document_people;
CREATE POLICY "select_own_document_people" ON document_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_document_people" ON document_people;
CREATE POLICY "insert_own_document_people" ON document_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_document_people" ON document_people;
CREATE POLICY "delete_own_document_people" ON document_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- voice_people
CREATE TABLE IF NOT EXISTS voice_people (
  voice_id uuid NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (voice_id, person_id)
);
ALTER TABLE voice_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_voice_people" ON voice_people;
CREATE POLICY "select_own_voice_people" ON voice_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_voice_people" ON voice_people;
CREATE POLICY "insert_own_voice_people" ON voice_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_voice_people" ON voice_people;
CREATE POLICY "delete_own_voice_people" ON voice_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- recipe_people
CREATE TABLE IF NOT EXISTS recipe_people (
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, person_id)
);
ALTER TABLE recipe_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_recipe_people" ON recipe_people;
CREATE POLICY "select_own_recipe_people" ON recipe_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_recipe_people" ON recipe_people;
CREATE POLICY "insert_own_recipe_people" ON recipe_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_recipe_people" ON recipe_people;
CREATE POLICY "delete_own_recipe_people" ON recipe_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- recipe_photos
CREATE TABLE IF NOT EXISTS recipe_photos (
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, photo_id)
);
ALTER TABLE recipe_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_recipe_photos" ON recipe_photos;
CREATE POLICY "select_own_recipe_photos" ON recipe_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_recipe_photos" ON recipe_photos;
CREATE POLICY "insert_own_recipe_photos" ON recipe_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_recipe_photos" ON recipe_photos;
CREATE POLICY "delete_own_recipe_photos" ON recipe_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tradition_people
CREATE TABLE IF NOT EXISTS tradition_people (
  tradition_id uuid NOT NULL REFERENCES traditions(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (tradition_id, person_id)
);
ALTER TABLE tradition_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tradition_people" ON tradition_people;
CREATE POLICY "select_own_tradition_people" ON tradition_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tradition_people" ON tradition_people;
CREATE POLICY "insert_own_tradition_people" ON tradition_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tradition_people" ON tradition_people;
CREATE POLICY "delete_own_tradition_people" ON tradition_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tradition_photos
CREATE TABLE IF NOT EXISTS tradition_photos (
  tradition_id uuid NOT NULL REFERENCES traditions(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (tradition_id, photo_id)
);
ALTER TABLE tradition_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tradition_photos" ON tradition_photos;
CREATE POLICY "select_own_tradition_photos" ON tradition_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tradition_photos" ON tradition_photos;
CREATE POLICY "insert_own_tradition_photos" ON tradition_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tradition_photos" ON tradition_photos;
CREATE POLICY "delete_own_tradition_photos" ON tradition_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tradition_recipes
CREATE TABLE IF NOT EXISTS tradition_recipes (
  tradition_id uuid NOT NULL REFERENCES traditions(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (tradition_id, recipe_id)
);
ALTER TABLE tradition_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tradition_recipes" ON tradition_recipes;
CREATE POLICY "select_own_tradition_recipes" ON tradition_recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tradition_recipes" ON tradition_recipes;
CREATE POLICY "insert_own_tradition_recipes" ON tradition_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tradition_recipes" ON tradition_recipes;
CREATE POLICY "delete_own_tradition_recipes" ON tradition_recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- place_people
CREATE TABLE IF NOT EXISTS place_people (
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, person_id)
);
ALTER TABLE place_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_place_people" ON place_people;
CREATE POLICY "select_own_place_people" ON place_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_place_people" ON place_people;
CREATE POLICY "insert_own_place_people" ON place_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_place_people" ON place_people;
CREATE POLICY "delete_own_place_people" ON place_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- place_photos
CREATE TABLE IF NOT EXISTS place_photos (
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, photo_id)
);
ALTER TABLE place_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_place_photos" ON place_photos;
CREATE POLICY "select_own_place_photos" ON place_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_place_photos" ON place_photos;
CREATE POLICY "insert_own_place_photos" ON place_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_place_photos" ON place_photos;
CREATE POLICY "delete_own_place_photos" ON place_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- place_memories
CREATE TABLE IF NOT EXISTS place_memories (
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, memory_id)
);
ALTER TABLE place_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_place_memories" ON place_memories;
CREATE POLICY "select_own_place_memories" ON place_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_place_memories" ON place_memories;
CREATE POLICY "insert_own_place_memories" ON place_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_place_memories" ON place_memories;
CREATE POLICY "delete_own_place_memories" ON place_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- event_people
CREATE TABLE IF NOT EXISTS event_people (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, person_id)
);
ALTER TABLE event_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_event_people" ON event_people;
CREATE POLICY "select_own_event_people" ON event_people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_event_people" ON event_people;
CREATE POLICY "insert_own_event_people" ON event_people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_event_people" ON event_people;
CREATE POLICY "delete_own_event_people" ON event_people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- event_photos
CREATE TABLE IF NOT EXISTS event_photos (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, photo_id)
);
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_event_photos" ON event_photos;
CREATE POLICY "select_own_event_photos" ON event_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_event_photos" ON event_photos;
CREATE POLICY "insert_own_event_photos" ON event_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_event_photos" ON event_photos;
CREATE POLICY "delete_own_event_photos" ON event_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_people_user_id ON people(user_id);
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_user_id ON voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_traditions_user_id ON traditions(user_id);
CREATE INDEX IF NOT EXISTS idx_places_user_id ON places(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);

-- ============ updated_at triggers ============
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['people','families','memories','photos','documents','voice_recordings','recipes','traditions','places','events'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;
