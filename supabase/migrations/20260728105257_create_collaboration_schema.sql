/*
# Rooted Family Collaboration Schema (Phase 5)

## Purpose
Adds comprehensive collaboration infrastructure so multiple family members can
build a shared digital legacy together while maintaining privacy, security, and
user control. Every archive remains private by default — collaboration only
happens when the archive owner explicitly invites others.

## New tables

1. **collaborators** — people who have accepted an invitation to collaborate on
   an archive. Stores role (owner / editor / contributor / viewer) and custom
   permission overrides as a JSONB column.
2. **invitations** — pending or sent invitations. Tracks email, role, status
   (pending / accepted / rejected / revoked), and optional message.
3. **content_versions** — version history for every editable item. Stores a
   snapshot of the row's content as JSONB, the contributor, and a version number.
4. **pending_contributions** — content submitted by contributors that requires
   owner approval before joining the permanent archive. Stores entity type,
   proposed data as JSONB, status (pending / approved / rejected), and the
   existing version it would modify (for edits).
5. **comments** — threaded comments on any archive item. Supports replies via
   parent_comment_id, plus a reactions JSONB column for hearts/appreciation.
6. **discussions** — family discussion threads, separate from the archive.
7. **discussion_messages** — messages within a discussion thread.
8. **notifications** — user notification centre. Types: invitation, approval,
   comment, suggestion, ai_recommendation, project, milestone. Includes a
   read flag and a preferences JSONB column on collaborators for opt-in/out.
9. **milestones** — collaboration milestones (first shared memory, 100th photo,
   completed project, etc.). Auto-detected or manually created.
10. **suggested_tags** — collaborator-suggested links between items (e.g. suggest
    a person is related to a memory). Requires owner approval.
11. **project_collaborators** — links Rooted Studio projects to collaborators
    so multiple family members can contribute to shared projects.

## Security
- RLS enabled on every new table.
- Owner-scoped: the archive owner (user_id = auth.uid()) has full control.
- Collaborator-scoped: collaborators can read/write based on their role and
  the collaborator record matching their auth.uid().
- All tables use the established 4-policy pattern (select/insert/update/delete).
- Collaborator checks use EXISTS subqueries against the collaborators table.
*/

-- ============ COLLABORATORS ============
CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','editor','contributor','viewer')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_collaborators" ON collaborators;
CREATE POLICY "select_collaborators" ON collaborators FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR user_id = auth.uid()
  );
DROP POLICY IF EXISTS "insert_collaborators" ON collaborators;
CREATE POLICY "insert_collaborators" ON collaborators FOR INSERT
  TO authenticated WITH CHECK (archive_owner_id = auth.uid());
DROP POLICY IF EXISTS "update_collaborators" ON collaborators;
CREATE POLICY "update_collaborators" ON collaborators FOR UPDATE
  TO authenticated USING (archive_owner_id = auth.uid())
  WITH CHECK (archive_owner_id = auth.uid());
DROP POLICY IF EXISTS "delete_collaborators" ON collaborators;
CREATE POLICY "delete_collaborators" ON collaborators FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_collaborators_owner ON collaborators(archive_owner_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON collaborators(user_id);

-- ============ INVITATIONS ============
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor','contributor','viewer')),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','revoked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_invitations" ON invitations;
CREATE POLICY "select_invitations" ON invitations FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_invitations" ON invitations;
CREATE POLICY "insert_invitations" ON invitations FOR INSERT
  TO authenticated WITH CHECK (archive_owner_id = auth.uid());
DROP POLICY IF EXISTS "update_invitations" ON invitations;
CREATE POLICY "update_invitations" ON invitations FOR UPDATE
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    archive_owner_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_invitations" ON invitations;
CREATE POLICY "delete_invitations" ON invitations FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_invitations_owner ON invitations(archive_owner_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- ============ CONTENT VERSIONS ============
CREATE TABLE IF NOT EXISTS content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL,
  edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  editor_email text,
  edit_summary text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_content_versions" ON content_versions;
CREATE POLICY "select_content_versions" ON content_versions FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = content_versions.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "insert_content_versions" ON content_versions;
CREATE POLICY "insert_content_versions" ON content_versions FOR INSERT
  TO authenticated WITH CHECK (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = content_versions.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "delete_content_versions" ON content_versions;
CREATE POLICY "delete_content_versions" ON content_versions FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_versions_entity ON content_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_versions_owner ON content_versions(archive_owner_id);

-- ============ PENDING CONTRIBUTIONS ============
CREATE TABLE IF NOT EXISTS pending_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  contributor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_email text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL DEFAULT 'create' CHECK (action IN ('create','edit')),
  proposed_data jsonb NOT NULL,
  existing_data jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','changes_requested')),
  reviewer_feedback text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE pending_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_pending_contributions" ON pending_contributions;
CREATE POLICY "select_pending_contributions" ON pending_contributions FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR contributor_id = auth.uid()
  );
DROP POLICY IF EXISTS "insert_pending_contributions" ON pending_contributions;
CREATE POLICY "insert_pending_contributions" ON pending_contributions FOR INSERT
  TO authenticated WITH CHECK (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = pending_contributions.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "update_pending_contributions" ON pending_contributions;
CREATE POLICY "update_pending_contributions" ON pending_contributions FOR UPDATE
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR contributor_id = auth.uid()
  )
  WITH CHECK (
    archive_owner_id = auth.uid()
    OR contributor_id = auth.uid()
  );
DROP POLICY IF EXISTS "delete_pending_contributions" ON pending_contributions;
CREATE POLICY "delete_pending_contributions" ON pending_contributions FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pending_owner ON pending_contributions(archive_owner_id);
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_contributions(archive_owner_id, status);

-- ============ COMMENTS ============
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text NOT NULL,
  author_name text,
  body text NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  reactions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments" ON comments FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = comments.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "insert_comments" ON comments;
CREATE POLICY "insert_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = comments.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "update_comments" ON comments;
CREATE POLICY "update_comments" ON comments FOR UPDATE
  TO authenticated USING (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  )
  WITH CHECK (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  );
DROP POLICY IF EXISTS "delete_comments" ON comments;
CREATE POLICY "delete_comments" ON comments FOR DELETE
  TO authenticated USING (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_owner ON comments(archive_owner_id);

-- ============ DISCUSSIONS ============
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text NOT NULL,
  author_name text,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discussions" ON discussions;
CREATE POLICY "select_discussions" ON discussions FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = discussions.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "insert_discussions" ON discussions;
CREATE POLICY "insert_discussions" ON discussions FOR INSERT
  TO authenticated WITH CHECK (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = discussions.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "update_discussions" ON discussions;
CREATE POLICY "update_discussions" ON discussions FOR UPDATE
  TO authenticated USING (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  )
  WITH CHECK (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  );
DROP POLICY IF EXISTS "delete_discussions" ON discussions;
CREATE POLICY "delete_discussions" ON discussions FOR DELETE
  TO authenticated USING (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_discussions_owner ON discussions(archive_owner_id);

-- ============ DISCUSSION MESSAGES ============
CREATE TABLE IF NOT EXISTS discussion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text NOT NULL,
  author_name text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discussion_messages" ON discussion_messages;
CREATE POLICY "select_discussion_messages" ON discussion_messages FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = discussion_messages.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "insert_discussion_messages" ON discussion_messages;
CREATE POLICY "insert_discussion_messages" ON discussion_messages FOR INSERT
  TO authenticated WITH CHECK (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = discussion_messages.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "update_discussion_messages" ON discussion_messages;
CREATE POLICY "update_discussion_messages" ON discussion_messages FOR UPDATE
  TO authenticated USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "delete_discussion_messages" ON discussion_messages;
CREATE POLICY "delete_discussion_messages" ON discussion_messages FOR DELETE
  TO authenticated USING (
    author_id = auth.uid()
    OR archive_owner_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_discussion_messages_discussion ON discussion_messages(discussion_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- ============ MILESTONES ============
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  milestone_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  achieved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_milestones" ON milestones;
CREATE POLICY "select_milestones" ON milestones FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = milestones.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "insert_milestones" ON milestones;
CREATE POLICY "insert_milestones" ON milestones FOR INSERT
  TO authenticated WITH CHECK (archive_owner_id = auth.uid());
DROP POLICY IF EXISTS "delete_milestones" ON milestones;
CREATE POLICY "delete_milestones" ON milestones FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_milestones_owner ON milestones(archive_owner_id);

-- ============ SUGGESTED TAGS ============
CREATE TABLE IF NOT EXISTS suggested_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  suggester_email text NOT NULL,
  source_entity_type text NOT NULL,
  source_entity_id uuid NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_id uuid NOT NULL,
  relationship_type text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE suggested_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_suggested_tags" ON suggested_tags;
CREATE POLICY "select_suggested_tags" ON suggested_tags FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR suggested_by = auth.uid()
  );
DROP POLICY IF EXISTS "insert_suggested_tags" ON suggested_tags;
CREATE POLICY "insert_suggested_tags" ON suggested_tags FOR INSERT
  TO authenticated WITH CHECK (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = suggested_tags.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "update_suggested_tags" ON suggested_tags;
CREATE POLICY "update_suggested_tags" ON suggested_tags FOR UPDATE
  TO authenticated USING (archive_owner_id = auth.uid())
  WITH CHECK (archive_owner_id = auth.uid());
DROP POLICY IF EXISTS "delete_suggested_tags" ON suggested_tags;
CREATE POLICY "delete_suggested_tags" ON suggested_tags FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_suggested_tags_owner ON suggested_tags(archive_owner_id);

-- ============ PROJECT COLLABORATORS ============
CREATE TABLE IF NOT EXISTS project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  archive_owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'contributor',
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, collaborator_id)
);
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_collaborators" ON project_collaborators;
CREATE POLICY "select_project_collaborators" ON project_collaborators FOR SELECT
  TO authenticated USING (
    archive_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborators c
      WHERE c.archive_owner_id = project_collaborators.archive_owner_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );
DROP POLICY IF EXISTS "insert_project_collaborators" ON project_collaborators;
CREATE POLICY "insert_project_collaborators" ON project_collaborators FOR INSERT
  TO authenticated WITH CHECK (archive_owner_id = auth.uid());
DROP POLICY IF EXISTS "delete_project_collaborators" ON project_collaborators;
CREATE POLICY "delete_project_collaborators" ON project_collaborators FOR DELETE
  TO authenticated USING (archive_owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);

-- ============ ADD ATTRIBUTION COLUMNS ============
-- Add contributor attribution columns to existing archive tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memories' AND column_name = 'contributor_email') THEN
    ALTER TABLE memories ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photos' AND column_name = 'contributor_email') THEN
    ALTER TABLE photos ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'contributor_email') THEN
    ALTER TABLE documents ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_recordings' AND column_name = 'contributor_email') THEN
    ALTER TABLE voice_recordings ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'contributor_email') THEN
    ALTER TABLE recipes ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'traditions' AND column_name = 'contributor_email') THEN
    ALTER TABLE traditions ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'contributor_email') THEN
    ALTER TABLE events ADD COLUMN contributor_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'contributor_email') THEN
    ALTER TABLE people ADD COLUMN contributor_email text;
  END IF;
END $$;

-- ============ UPDATED_AT TRIGGERS ============
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['collaborators','invitations','pending_contributions','comments','discussions','discussion_messages','suggested_tags'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;
