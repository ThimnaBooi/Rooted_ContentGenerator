/*
# Rooted Studio — AI content creation schema (Phase 4)

## Purpose
Creates the data layer for Rooted Studio, where users generate AI-powered
documents and artwork from their preserved archive. All generated content is
stored separately from original family memories so users can always distinguish
between the two.

## New tables
1. studio_folders — user-created folders for organising generated documents
2. studio_documents — AI-generated text documents (biographies, speeches, etc.)
3. studio_document_versions — saved versions of each document (history/restore)
4. studio_images — AI-generated images (illustrations, paintings, cards, etc.)
5. studio_projects — user-created projects that group documents + images
6. studio_project_items — junction linking project items to documents/images
7. studio_templates — professionally designed layout templates

## Security
- RLS enabled on every table.
- Owner-scoped CRUD via auth.uid() = user_id, with DEFAULT auth.uid() on owner columns.
- Only authenticated users can access Studio content.
*/

-- ============ STUDIO FOLDERS ============
CREATE TABLE IF NOT EXISTS studio_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE studio_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_folders" ON studio_folders;
CREATE POLICY "select_own_studio_folders" ON studio_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_studio_folders" ON studio_folders;
CREATE POLICY "insert_own_studio_folders" ON studio_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_studio_folders" ON studio_folders;
CREATE POLICY "update_own_studio_folders" ON studio_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_folders" ON studio_folders;
CREATE POLICY "delete_own_studio_folders" ON studio_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ STUDIO DOCUMENTS ============
CREATE TABLE IF NOT EXISTS studio_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES studio_folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  content_type text NOT NULL DEFAULT 'biography',
  content_format text NOT NULL DEFAULT 'html',
  writing_style text,
  tone text,
  target_audience text,
  detail_level text,
  document_length text,
  language text DEFAULT 'en',
  template_id uuid,
  source_refs jsonb,
  custom_instructions text,
  is_favourite boolean DEFAULT false,
  is_draft boolean DEFAULT true,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE studio_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_documents" ON studio_documents;
CREATE POLICY "select_own_studio_documents" ON studio_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_studio_documents" ON studio_documents;
CREATE POLICY "insert_own_studio_documents" ON studio_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_studio_documents" ON studio_documents;
CREATE POLICY "update_own_studio_documents" ON studio_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_documents" ON studio_documents;
CREATE POLICY "delete_own_studio_documents" ON studio_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ STUDIO DOCUMENT VERSIONS ============
CREATE TABLE IF NOT EXISTS studio_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES studio_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  version_number integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE studio_document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_doc_versions" ON studio_document_versions;
CREATE POLICY "select_own_studio_doc_versions" ON studio_document_versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_studio_doc_versions" ON studio_document_versions;
CREATE POLICY "insert_own_studio_doc_versions" ON studio_document_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_doc_versions" ON studio_document_versions;
CREATE POLICY "delete_own_studio_doc_versions" ON studio_document_versions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ STUDIO IMAGES ============
CREATE TABLE IF NOT EXISTS studio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES studio_folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  image_type text NOT NULL DEFAULT 'illustration',
  prompt text,
  style text,
  storage_path text,
  public_url text,
  source_photo_url text,
  is_favourite boolean DEFAULT false,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE studio_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_images" ON studio_images;
CREATE POLICY "select_own_studio_images" ON studio_images FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_studio_images" ON studio_images;
CREATE POLICY "insert_own_studio_images" ON studio_images FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_studio_images" ON studio_images;
CREATE POLICY "update_own_studio_images" ON studio_images FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_images" ON studio_images;
CREATE POLICY "delete_own_studio_images" ON studio_images FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ STUDIO PROJECTS ============
CREATE TABLE IF NOT EXISTS studio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  project_type text DEFAULT 'memory_book',
  is_favourite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_projects" ON studio_projects;
CREATE POLICY "select_own_studio_projects" ON studio_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_studio_projects" ON studio_projects;
CREATE POLICY "insert_own_studio_projects" ON studio_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_studio_projects" ON studio_projects;
CREATE POLICY "update_own_studio_projects" ON studio_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_projects" ON studio_projects;
CREATE POLICY "delete_own_studio_projects" ON studio_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ STUDIO PROJECT ITEMS ============
CREATE TABLE IF NOT EXISTS studio_project_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  document_id uuid REFERENCES studio_documents(id) ON DELETE CASCADE,
  image_id uuid REFERENCES studio_images(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE studio_project_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_project_items" ON studio_project_items;
CREATE POLICY "select_own_studio_project_items" ON studio_project_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_studio_project_items" ON studio_project_items;
CREATE POLICY "insert_own_studio_project_items" ON studio_project_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_project_items" ON studio_project_items;
CREATE POLICY "delete_own_studio_project_items" ON studio_project_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ STUDIO TEMPLATES ============
CREATE TABLE IF NOT EXISTS studio_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type text NOT NULL DEFAULT 'book',
  description text,
  layout_config jsonb,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE studio_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_studio_templates" ON studio_templates;
CREATE POLICY "select_own_studio_templates" ON studio_templates FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_system = true);
DROP POLICY IF EXISTS "insert_own_studio_templates" ON studio_templates;
CREATE POLICY "insert_own_studio_templates" ON studio_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_studio_templates" ON studio_templates;
CREATE POLICY "delete_own_studio_templates" ON studio_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_studio_docs_user ON studio_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_docs_folder ON studio_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_studio_images_user ON studio_images(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_user ON studio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_folders_user ON studio_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_doc_versions_doc ON studio_document_versions(document_id);

-- ============ TRIGGERS ============
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['studio_folders','studio_documents','studio_images','studio_projects'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;
