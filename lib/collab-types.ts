// Rooted Family Collaboration — database row types and constants

export type CollaboratorRole = 'owner' | 'editor' | 'contributor' | 'viewer';

export type Collaborator = {
  id: string;
  archive_owner_id: string;
  user_id: string | null;
  email: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  status: 'active' | 'revoked';
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CollaboratorPermissions = {
  upload_photos?: boolean;
  create_persons?: boolean;
  edit_recipes?: boolean;
  comment_on_memories?: boolean;
  generate_ai_content?: boolean;
  export_documents?: boolean;
  invite_others?: boolean;
};

export type Invitation = {
  id: string;
  archive_owner_id: string;
  email: string;
  role: CollaboratorRole;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  created_at: string;
  updated_at: string;
};

export type ContentVersion = {
  id: string;
  archive_owner_id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  edited_by: string | null;
  editor_email: string | null;
  edit_summary: string | null;
  created_at: string;
};

export type PendingContribution = {
  id: string;
  archive_owner_id: string;
  contributor_id: string | null;
  contributor_email: string;
  entity_type: string;
  entity_id: string | null;
  action: 'create' | 'edit';
  proposed_data: Record<string, unknown>;
  existing_data: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewer_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  archive_owner_id: string;
  entity_type: string;
  entity_id: string;
  author_id: string | null;
  author_email: string;
  author_name: string | null;
  body: string;
  parent_comment_id: string | null;
  reactions: Reaction[];
  created_at: string;
  updated_at: string;
};

export type Reaction = {
  type: 'heart' | 'appreciation';
  user_email: string;
  user_name: string | null;
};

export type Discussion = {
  id: string;
  archive_owner_id: string;
  title: string;
  body: string | null;
  author_id: string | null;
  author_email: string;
  author_name: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscussionMessage = {
  id: string;
  discussion_id: string;
  archive_owner_id: string;
  author_id: string | null;
  author_email: string;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
};

export type NotificationType =
  | 'invitation'
  | 'approval'
  | 'comment'
  | 'suggestion'
  | 'ai_recommendation'
  | 'project'
  | 'milestone';

export type Milestone = {
  id: string;
  archive_owner_id: string;
  title: string;
  description: string | null;
  milestone_type: string;
  entity_type: string | null;
  entity_id: string | null;
  achieved_at: string;
  created_at: string;
};

export type SuggestedTag = {
  id: string;
  archive_owner_id: string;
  suggested_by: string | null;
  suggester_email: string;
  source_entity_type: string;
  source_entity_id: string;
  target_entity_type: string;
  target_entity_id: string;
  relationship_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};

export type ProjectCollaborator = {
  id: string;
  project_id: string;
  collaborator_id: string;
  archive_owner_id: string;
  role: string;
  created_at: string;
};

export const ROLE_LABELS: Record<CollaboratorRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  contributor: 'Contributor',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<CollaboratorRole, string> = {
  owner: 'Full control over the archive and all permissions',
  editor: 'Add and edit approved content, manage contributors',
  contributor: 'Upload memories, photos, recipes, and stories (requires approval)',
  viewer: 'Read-only access to the shared archive',
};

export const DEFAULT_PERMISSIONS: Record<CollaboratorRole, CollaboratorPermissions> = {
  owner: {
    upload_photos: true,
    create_persons: true,
    edit_recipes: true,
    comment_on_memories: true,
    generate_ai_content: true,
    export_documents: true,
    invite_others: true,
  },
  editor: {
    upload_photos: true,
    create_persons: true,
    edit_recipes: true,
    comment_on_memories: true,
    generate_ai_content: true,
    export_documents: true,
    invite_others: false,
  },
  contributor: {
    upload_photos: true,
    create_persons: false,
    edit_recipes: false,
    comment_on_memories: true,
    generate_ai_content: false,
    export_documents: false,
    invite_others: false,
  },
  viewer: {
    upload_photos: false,
    create_persons: false,
    edit_recipes: false,
    comment_on_memories: true,
    generate_ai_content: false,
    export_documents: false,
    invite_others: false,
  },
};

export const PERMISSION_LABELS: Record<keyof CollaboratorPermissions, string> = {
  upload_photos: 'Upload photographs',
  create_persons: 'Create person profiles',
  edit_recipes: 'Edit recipes',
  comment_on_memories: 'Comment on memories',
  generate_ai_content: 'Generate AI content',
  export_documents: 'Export documents',
  invite_others: 'Invite additional family members',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  invitation: 'Invitations',
  approval: 'Approvals',
  comment: 'Comments',
  suggestion: 'Suggestions',
  ai_recommendation: 'AI Recommendations',
  project: 'Project Activity',
  milestone: 'Milestones',
};

export const ENTITY_LABELS: Record<string, string> = {
  memory: 'Memory',
  photo: 'Photo',
  document: 'Document',
  voice: 'Voice Recording',
  recipe: 'Recipe',
  tradition: 'Tradition',
  place: 'Place',
  event: 'Event',
  person: 'Person',
  family: 'Family',
  studio_document: 'Studio Document',
  studio_project: 'Studio Project',
};
