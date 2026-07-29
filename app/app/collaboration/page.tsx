'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  HeartHandshake,
  Mail,
  UserPlus,
  Loader2,
  Crown,
  Pencil,
  Eye,
  Upload,
  Shield,
  Trash2,
  Check,
  X,
  Clock,
  Tag,
  FileEdit,
  Settings2,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getCollaborators,
  getInvitations,
  createInvitation,
  cancelInvitation,
  updateCollaboratorRole,
  updateCollaboratorPermissions,
  revokeCollaborator,
  reinstateCollaborator,
  getPendingContributions,
  approveContribution,
  rejectContribution,
  requestChanges,
  getSuggestedTags,
  approveSuggestedTag,
  rejectSuggestedTag,
} from '@/lib/collab-queries';
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  DEFAULT_PERMISSIONS,
  PERMISSION_LABELS,
  ENTITY_LABELS,
} from '@/lib/collab-types';
import type {
  Collaborator,
  CollaboratorRole,
  CollaboratorPermissions,
  Invitation,
  PendingContribution,
  SuggestedTag,
} from '@/lib/collab-types';
import { cn } from '@/lib/utils';

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function roleIcon(role: CollaboratorRole) {
  switch (role) {
    case 'owner': return Crown;
    case 'editor': return Pencil;
    case 'contributor': return Upload;
    case 'viewer': return Eye;
  }
}

function roleColor(role: CollaboratorRole): string {
  switch (role) {
    case 'owner': return 'bg-accent/20 text-accent-foreground border-accent/30';
    case 'editor': return 'bg-primary/15 text-primary border-primary/20';
    case 'contributor': return 'bg-highlight/15 text-highlight border-highlight/20';
    case 'viewer': return 'bg-muted text-muted-foreground border-border';
  }
}

export default function CollaborationPage() {
  const { session, isGuest } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [pendingContributions, setPendingContributions] = useState<PendingContribution[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('contributor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [permDraft, setPermDraft] = useState<CollaboratorPermissions>({});
  const [reviewingContribution, setReviewingContribution] = useState<PendingContribution | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request' | null>(null);

  const load = useCallback(async () => {
    try {
      const [collabs, invs, pending, tags] = await Promise.all([
        getCollaborators(),
        getInvitations(),
        getPendingContributions(),
        getSuggestedTags(),
      ]);
      setCollaborators(collabs);
      setInvitations(invs);
      setPendingContributions(pending);
      setSuggestedTags(tags);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isGuest && session) load();
    else setLoading(false);
  }, [session, isGuest, load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await createInvitation({
        email: inviteEmail.trim(),
        role: inviteRole,
        message: inviteMessage.trim() || undefined,
      });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteMessage('');
      setInviteRole('contributor');
      setInviteOpen(false);
      await load();
    } catch {
      toast.error('Could not send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvitation(id: string) {
    try {
      await cancelInvitation(id);
      toast.success('Invitation revoked.');
      await load();
    } catch {
      toast.error('Could not revoke invitation.');
    }
  }

  async function handleRoleChange(collaboratorId: string, role: CollaboratorRole) {
    try {
      await updateCollaboratorRole(collaboratorId, role, DEFAULT_PERMISSIONS[role]);
      toast.success(`Role updated to ${ROLE_LABELS[role]}.`);
      await load();
    } catch {
      toast.error('Could not update role.');
    }
  }

  async function handleSavePermissions() {
    if (!editingPerms) return;
    try {
      await updateCollaboratorPermissions(editingPerms, permDraft);
      toast.success('Permissions updated.');
      setEditingPerms(null);
      await load();
    } catch {
      toast.error('Could not update permissions.');
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeCollaborator(id);
      toast.success('Access revoked.');
      await load();
    } catch {
      toast.error('Could not revoke access.');
    }
  }

  async function handleReinstate(id: string) {
    try {
      await reinstateCollaborator(id);
      toast.success('Access reinstated.');
      await load();
    } catch {
      toast.error('Could not reinstate access.');
    }
  }

  async function handleReviewContribution() {
    if (!reviewingContribution || !reviewAction) return;
    try {
      if (reviewAction === 'approve') {
        await approveContribution(reviewingContribution.id, reviewFeedback || undefined);
        toast.success('Contribution approved.');
      } else if (reviewAction === 'reject') {
        await rejectContribution(reviewingContribution.id, reviewFeedback || undefined);
        toast.success('Contribution rejected.');
      } else {
        await requestChanges(reviewingContribution.id, reviewFeedback);
        toast.success('Changes requested.');
      }
      setReviewingContribution(null);
      setReviewFeedback('');
      setReviewAction(null);
      await load();
    } catch {
      toast.error('Could not process review.');
    }
  }

  async function handleApproveTag(id: string) {
    try {
      await approveSuggestedTag(id);
      toast.success('Tag suggestion approved.');
      await load();
    } catch {
      toast.error('Could not approve suggestion.');
    }
  }

  async function handleRejectTag(id: string) {
    try {
      await rejectSuggestedTag(id);
      toast.success('Tag suggestion rejected.');
      await load();
    } catch {
      toast.error('Could not reject suggestion.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Family Collaboration" description="Invite family members to build your shared legacy together." />
        <EmptyState
          icon={HeartHandshake}
          title="Collaboration requires an account"
          description="Create an account to invite family members, assign roles, and build your archive together."
          actionLabel="Create your account"
          actionHref="/register"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeCollaborators = collaborators.filter((c) => c.status === 'active');
  const revokedCollaborators = collaborators.filter((c) => c.status === 'revoked');
  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Family Collaboration"
          description="Invite family members, manage roles and permissions, and review contributions to your shared archive."
        />
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Family Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Invite a Family Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="family@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CollaboratorRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as CollaboratorRole[])
                      .filter((r) => r !== 'owner')
                      .map((role) => {
                        const Icon = roleIcon(role);
                        return (
                          <SelectItem key={role} value={role}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              {ROLE_LABELS[role]}
                            </span>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[inviteRole]}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-message">Personal message (optional)</Label>
                <Textarea
                  id="invite-message"
                  placeholder="Add a note to your invitation…"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={inviting} className="gap-2">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingContributions.filter((p) => p.status === 'pending').length > 0 && (
              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-medium text-white">
                {pendingContributions.filter((p) => p.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tags">
            Tag Suggestions
            {suggestedTags.filter((t) => t.status === 'pending').length > 0 && (
              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-medium text-white">
                {suggestedTags.filter((t) => t.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members" className="space-y-4">
          {/* Pending invitations */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Pending Invitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">{initialsFromEmail(inv.email)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited as {ROLE_LABELS[inv.role]} · {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleCancelInvitation(inv.id)} className="text-muted-foreground hover:text-destructive">
                      Revoke
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active collaborators */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Archive Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeCollaborators.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No collaborators yet. Invite family members to start building together.
                </p>
              ) : (
                activeCollaborators.map((collab) => {
                  const Icon = roleIcon(collab.role);
                  return (
                    <div key={collab.id} className="rounded-lg border border-border bg-card/40 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {initialsFromEmail(collab.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{collab.email}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <Badge variant="outline" className={cn('gap-1 text-xs', roleColor(collab.role))}>
                                <Icon className="h-3 w-3" />
                                {ROLE_LABELS[collab.role]}
                              </Badge>
                              {collab.accepted_at ? (
                                <span className="text-xs text-muted-foreground">
                                  Joined {new Date(collab.accepted_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pending acceptance</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {collab.role !== 'owner' && (
                            <>
                              <Select
                                value={collab.role}
                                onValueChange={(v) => handleRoleChange(collab.id, v as CollaboratorRole)}
                              >
                                <SelectTrigger className="h-8 w-28 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(ROLE_LABELS) as CollaboratorRole[])
                                    .filter((r) => r !== 'owner')
                                    .map((role) => (
                                      <SelectItem key={role} value={role} className="text-xs">
                                        {ROLE_LABELS[role]}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setEditingPerms(editingPerms === collab.id ? null : collab.id);
                                  setPermDraft(collab.permissions ?? DEFAULT_PERMISSIONS[collab.role]);
                                }}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRevoke(collab.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Permission editor */}
                      {editingPerms === collab.id && (
                        <div className="mt-3 space-y-2 rounded-lg bg-muted/30 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Custom Permissions</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {(Object.keys(PERMISSION_LABELS) as (keyof CollaboratorPermissions)[]).map((perm) => (
                              <div key={perm} className="flex items-center justify-between rounded-md bg-card/50 px-2.5 py-1.5">
                                <span className="text-xs">{PERMISSION_LABELS[perm]}</span>
                                <Switch
                                  checked={permDraft[perm] ?? false}
                                  onCheckedChange={(checked) =>
                                    setPermDraft({ ...permDraft, [perm]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingPerms(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleSavePermissions}>
                              Save Permissions
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Revoked collaborators */}
          {revokedCollaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg text-muted-foreground">Revoked Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {revokedCollaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between rounded-lg bg-card/30 p-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">{initialsFromEmail(collab.email)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{collab.email}</p>
                        <p className="text-xs text-muted-foreground">Access revoked</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleReinstate(collab.id)}>
                      Reinstate
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending contributions tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingContributions.length === 0 ? (
            <EmptyState
              icon={FileEdit}
              title="No pending contributions"
              description="When collaborators submit new content or edits, they'll appear here for your review."
            />
          ) : (
            pendingContributions.map((contrib) => (
              <Card key={contrib.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {contrib.action === 'create' ? 'New' : 'Edit'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ENTITY_LABELS[contrib.entity_type] ?? contrib.entity_type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            contrib.status === 'pending' && 'border-highlight/30 bg-highlight/10 text-highlight',
                            contrib.status === 'approved' && 'border-green-500/30 bg-green-500/10 text-green-600',
                            contrib.status === 'rejected' && 'border-destructive/30 bg-destructive/10 text-destructive',
                            contrib.status === 'changes_requested' && 'border-accent/30 bg-accent/10 text-accent-foreground'
                          )}
                        >
                          {contrib.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        From <span className="font-medium text-foreground">{contrib.contributor_email}</span>
                        {' · '}
                        {new Date(contrib.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {contrib.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReviewingContribution(contrib);
                          setReviewFeedback('');
                          setReviewAction(null);
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Review dialog */}
          <Dialog open={!!reviewingContribution} onOpenChange={(v) => !v && setReviewingContribution(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">Review Contribution</DialogTitle>
              </DialogHeader>
              {reviewingContribution && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Proposed {reviewingContribution.action === 'create' ? 'new content' : 'changes'}</p>
                    <p className="text-xs text-muted-foreground">
                      {ENTITY_LABELS[reviewingContribution.entity_type] ?? reviewingContribution.entity_type}
                      {' · '}from {reviewingContribution.contributor_email}
                    </p>
                  </div>

                  {reviewingContribution.existing_data && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Current version</p>
                      <pre className="max-h-32 overflow-auto rounded-md bg-muted/50 p-2 text-xs">
                        {JSON.stringify(reviewingContribution.existing_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Proposed version</p>
                    <pre className="max-h-32 overflow-auto rounded-md bg-accent/10 p-2 text-xs">
                      {JSON.stringify(reviewingContribution.proposed_data, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (optional for approve/reject, required for requesting changes)</Label>
                    <Textarea
                      id="feedback"
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      placeholder="Add your feedback…"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => { setReviewAction('reject'); handleReviewContribution(); }}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setReviewAction('request'); handleReviewContribution(); }}
                    >
                      Request Changes
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setReviewAction('approve'); handleReviewContribution(); }}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tag suggestions tab */}
        <TabsContent value="tags" className="space-y-4">
          {suggestedTags.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No tag suggestions"
              description="When collaborators suggest connections between items, they'll appear here for your approval."
            />
          ) : (
            suggestedTags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{ENTITY_LABELS[tag.source_entity_type] ?? tag.source_entity_type}</span>
                        {' → '}
                        <span className="font-medium">{ENTITY_LABELS[tag.target_entity_type] ?? tag.target_entity_type}</span>
                        {tag.relationship_type && (
                          <span className="text-muted-foreground"> ({tag.relationship_type})</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Suggested by {tag.suggester_email} · {new Date(tag.created_at).toLocaleDateString()}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'mt-2 text-xs',
                          tag.status === 'pending' && 'border-highlight/30 bg-highlight/10 text-highlight',
                          tag.status === 'approved' && 'border-green-500/30 bg-green-500/10 text-green-600',
                          tag.status === 'rejected' && 'border-destructive/30 bg-destructive/10 text-destructive'
                        )}
                      >
                        {tag.status}
                      </Badge>
                    </div>
                    {tag.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handleApproveTag(tag.id)}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive" onClick={() => handleRejectTag(tag.id)}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
