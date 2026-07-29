import { supabase } from '@/lib/supabase-client';
import type {
  Collaborator,
  CollaboratorRole,
  CollaboratorPermissions,
  Invitation,
  ContentVersion,
  PendingContribution,
  Comment,
  Reaction,
  Discussion,
  DiscussionMessage,
  Notification,
  NotificationType,
  Milestone,
  SuggestedTag,
  ProjectCollaborator,
} from '@/lib/collab-types';
import { DEFAULT_PERMISSIONS } from '@/lib/collab-types';

// ---------- Helpers ----------
async function getCurrentUserEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

async function getCurrentUserName(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return (
    (data.user.user_metadata?.full_name as string) ??
    (data.user.user_metadata?.name as string) ??
    data.user.email ??
    null
  );
}

// ---------- Collaborators ----------
export async function getCollaborators(): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('collaborators')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCollaborator(id: string): Promise<Collaborator | null> {
  const { data, error } = await supabase
    .from('collaborators')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCollaboratorRole(
  id: string,
  role: CollaboratorRole,
  permissions?: CollaboratorPermissions
): Promise<Collaborator> {
  const update: Record<string, unknown> = { role };
  if (permissions) update.permissions = permissions;
  const { data, error } = await supabase
    .from('collaborators')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCollaboratorPermissions(
  id: string,
  permissions: CollaboratorPermissions
): Promise<Collaborator> {
  const { data, error } = await supabase
    .from('collaborators')
    .update({ permissions })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function revokeCollaborator(id: string): Promise<void> {
  const { error } = await supabase
    .from('collaborators')
    .update({ status: 'revoked' })
    .eq('id', id);
  if (error) throw error;
}

export async function reinstateCollaborator(id: string): Promise<void> {
  const { error } = await supabase
    .from('collaborators')
    .update({ status: 'active' })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Invitations ----------
export async function getInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInvitation(input: {
  email: string;
  role: CollaboratorRole;
  message?: string;
}): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      email: input.email,
      role: input.role,
      message: input.message ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Create a pending collaborator record
  await supabase.from('collaborators').insert({
    email: input.email,
    role: input.role,
    permissions: DEFAULT_PERMISSIONS[input.role],
    status: 'active',
    accepted_at: null,
  });

  // Notify if the invited user already has an account
  const { data: existingUser } = await supabase
    .from('collaborators')
    .select('user_id')
    .eq('email', input.email)
    .not('user_id', 'is', null)
    .maybeSingle();

  if (existingUser?.user_id) {
    await supabase.from('notifications').insert({
      user_id: existingUser.user_id,
      type: 'invitation',
      title: `You've been invited to collaborate`,
      body: input.message ?? 'You have a new collaboration invitation waiting.',
      entity_type: 'invitation',
      entity_id: data.id,
    });
  }

  return data;
}

export async function cancelInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', id);
  if (error) throw error;
}

export async function acceptInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Content Versions ----------
export async function getContentVersions(
  entityType: string,
  entityId: string
): Promise<ContentVersion[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveContentVersion(input: {
  entityType: string;
  entityId: string;
  snapshot: Record<string, unknown>;
  editSummary?: string;
}): Promise<ContentVersion> {
  const email = await getCurrentUserEmail();
  const { data: userData } = await supabase.auth.getUser();

  // Get the next version number
  const { data: existing } = await supabase
    .from('content_versions')
    .select('version_number')
    .eq('entity_type', input.entityType)
    .eq('entity_id', input.entityId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (existing?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('content_versions')
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      version_number: nextVersion,
      snapshot: input.snapshot,
      edited_by: userData.user?.id ?? null,
      editor_email: email,
      edit_summary: input.editSummary ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- Pending Contributions ----------
export async function getPendingContributions(): Promise<PendingContribution[]> {
  const { data, error } = await supabase
    .from('pending_contributions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPendingContribution(input: {
  contributorEmail: string;
  entityType: string;
  entityId?: string;
  action: 'create' | 'edit';
  proposedData: Record<string, unknown>;
  existingData?: Record<string, unknown>;
}): Promise<PendingContribution> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('pending_contributions')
    .insert({
      contributor_id: userData.user?.id ?? null,
      contributor_email: input.contributorEmail,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action: input.action,
      proposed_data: input.proposedData,
      existing_data: input.existingData ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Notify the archive owner
  await supabase.from('notifications').insert({
    type: 'approval',
    title: `New ${input.action === 'create' ? 'contribution' : 'edit'} pending review`,
    body: `${input.contributorEmail} ${input.action === 'create' ? 'added' : 'edited'} a ${input.entityType}`,
    entity_type: 'pending_contribution',
    entity_id: data.id,
  });

  return data;
}

export async function approveContribution(
  id: string,
  feedback?: string
): Promise<void> {
  const { error } = await supabase
    .from('pending_contributions')
    .update({
      status: 'approved',
      reviewer_feedback: feedback ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectContribution(
  id: string,
  feedback?: string
): Promise<void> {
  const { error } = await supabase
    .from('pending_contributions')
    .update({
      status: 'rejected',
      reviewer_feedback: feedback ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function requestChanges(
  id: string,
  feedback: string
): Promise<void> {
  const { error } = await supabase
    .from('pending_contributions')
    .update({
      status: 'changes_requested',
      reviewer_feedback: feedback,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Comments ----------
export async function getComments(
  entityType: string,
  entityId: string
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createComment(input: {
  entityType: string;
  entityId: string;
  body: string;
  parentCommentId?: string;
}): Promise<Comment> {
  const email = await getCurrentUserEmail();
  const name = await getCurrentUserName();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      author_id: userData.user?.id ?? null,
      author_email: email ?? 'unknown',
      author_name: name,
      body: input.body,
      parent_comment_id: input.parentCommentId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleReaction(
  commentId: string,
  reactionType: 'heart' | 'appreciation'
): Promise<void> {
  const email = await getCurrentUserEmail();
  const name = await getCurrentUserName();
  if (!email) return;

  const { data: comment } = await supabase
    .from('comments')
    .select('reactions')
    .eq('id', commentId)
    .maybeSingle();
  if (!comment) return;

  const reactions = (comment.reactions ?? []) as Reaction[];
  const existing = reactions.find(
    (r) => r.type === reactionType && r.user_email === email
  );

  let updated: Reaction[];
  if (existing) {
    updated = reactions.filter(
      (r) => !(r.type === reactionType && r.user_email === email)
    );
  } else {
    updated = [...reactions, { type: reactionType, user_email: email, user_name: name }];
  }

  await supabase
    .from('comments')
    .update({ reactions: updated })
    .eq('id', commentId);
}

// ---------- Discussions ----------
export async function getDiscussions(): Promise<Discussion[]> {
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDiscussion(id: string): Promise<Discussion | null> {
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDiscussion(input: {
  title: string;
  body?: string;
}): Promise<Discussion> {
  const email = await getCurrentUserEmail();
  const name = await getCurrentUserName();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      title: input.title,
      body: input.body ?? null,
      author_id: userData.user?.id ?? null,
      author_email: email ?? 'unknown',
      author_name: name,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDiscussion(id: string): Promise<void> {
  const { error } = await supabase.from('discussions').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleDiscussionPin(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase
    .from('discussions')
    .update({ pinned })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Discussion Messages ----------
export async function getDiscussionMessages(discussionId: string): Promise<DiscussionMessage[]> {
  const { data, error } = await supabase
    .from('discussion_messages')
    .select('*')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createDiscussionMessage(input: {
  discussionId: string;
  body: string;
}): Promise<DiscussionMessage> {
  const email = await getCurrentUserEmail();
  const name = await getCurrentUserName();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('discussion_messages')
    .insert({
      discussion_id: input.discussionId,
      author_id: userData.user?.id ?? null,
      author_email: email ?? 'unknown',
      author_name: name,
      body: input.body,
    })
    .select()
    .single();
  if (error) throw error;

  // Update the discussion's updated_at for sorting
  await supabase
    .from('discussions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.discussionId);

  return data;
}

export async function deleteDiscussionMessage(id: string): Promise<void> {
  const { error } = await supabase.from('discussion_messages').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Notifications ----------
export async function getNotifications(unreadOnly = false): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (unreadOnly) query = query.eq('read', false);
  const { data, error } = await query.limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Milestones ----------
export async function getMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .order('achieved_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMilestone(input: {
  title: string;
  description?: string;
  milestoneType: string;
  entityType?: string;
  entityId?: string;
}): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .insert({
      title: input.title,
      description: input.description ?? null,
      milestone_type: input.milestoneType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from('milestones').delete().eq('id', id);
  if (error) throw error;
}

export async function checkAndCreateMilestones(
  counts: { memories: number; photos: number; recipes: number; traditions: number }
): Promise<void> {
  const milestones: { title: string; description: string; type: string }[] = [];

  if (counts.memories >= 1) {
    milestones.push({
      title: 'First Shared Memory',
      description: 'Your archive welcomed its very first memory.',
      type: 'first_memory',
    });
  }
  if (counts.photos >= 100) {
    milestones.push({
      title: '100 Photographs Preserved',
      description: 'A century of family moments, safely kept.',
      type: 'photos_100',
    });
  }
  if (counts.photos >= 50) {
    milestones.push({
      title: '50 Photographs Preserved',
      description: 'Halfway to a hundred — a growing visual legacy.',
      type: 'photos_50',
    });
  }
  if (counts.recipes >= 10) {
    milestones.push({
      title: '10 Family Recipes Collected',
      description: 'A decade of flavours worth passing down.',
      type: 'recipes_10',
    });
  }
  if (counts.traditions >= 5) {
    milestones.push({
      title: '5 Traditions Documented',
      description: 'Five family customs, lovingly preserved.',
      type: 'traditions_5',
    });
  }

  for (const m of milestones) {
    const { data: existing } = await supabase
      .from('milestones')
      .select('id')
      .eq('milestone_type', m.type)
      .maybeSingle();
    if (!existing) {
      await supabase.from('milestones').insert({
        title: m.title,
        description: m.description,
        milestone_type: m.type,
      });
    }
  }
}

// ---------- Suggested Tags ----------
export async function getSuggestedTags(): Promise<SuggestedTag[]> {
  const { data, error } = await supabase
    .from('suggested_tags')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSuggestedTag(input: {
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType?: string;
}): Promise<SuggestedTag> {
  const email = await getCurrentUserEmail();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('suggested_tags')
    .insert({
      suggested_by: userData.user?.id ?? null,
      suggester_email: email ?? 'unknown',
      source_entity_type: input.sourceEntityType,
      source_entity_id: input.sourceEntityId,
      target_entity_type: input.targetEntityType,
      target_entity_id: input.targetEntityId,
      relationship_type: input.relationshipType ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Notify the archive owner
  await supabase.from('notifications').insert({
    type: 'suggestion',
    title: 'New tag suggestion pending review',
    body: `${email} suggested a connection between items in the archive.`,
    entity_type: 'suggested_tag',
    entity_id: data.id,
  });

  return data;
}

export async function approveSuggestedTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('suggested_tags')
    .update({ status: 'approved' })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectSuggestedTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('suggested_tags')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Project Collaborators ----------
export async function getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  const { data, error } = await supabase
    .from('project_collaborators')
    .select('*, collaborator:collaborators(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addProjectCollaborator(
  projectId: string,
  collaboratorId: string,
  role = 'contributor'
): Promise<void> {
  const { error } = await supabase.from('project_collaborators').insert({
    project_id: projectId,
    collaborator_id: collaboratorId,
    role,
  });
  if (error) throw error;
}

export async function removeProjectCollaborator(
  projectId: string,
  collaboratorId: string
): Promise<void> {
  const { error } = await supabase
    .from('project_collaborators')
    .delete()
    .eq('project_id', projectId)
    .eq('collaborator_id', collaboratorId);
  if (error) throw error;
}

// ---------- Notification helpers ----------
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
  });
}
