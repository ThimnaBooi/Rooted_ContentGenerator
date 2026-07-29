'use client';

import { useEffect, useState } from 'react';
import { Plus, UsersRound, Loader2, Users, Trash2, Link2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getFamilies,
  createFamily,
  deleteFamily,
  getPeople,
  getFamilyMembers,
  addPersonToFamily,
  removePersonFromFamily,
  getRelationships,
  createRelationship,
  deleteRelationship,
} from '@/lib/queries';
import type { Person, Family } from '@/lib/types';
import { toast } from 'sonner';

type RelationshipRow = {
  id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: string;
};

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [relOpen, setRelOpen] = useState(false);
  const [deleteFamilyId, setDeleteFamilyId] = useState<string | null>(null);
  const [deleteRelId, setDeleteRelId] = useState<string | null>(null);
  const [familyForm, setFamilyForm] = useState({ name: '', description: '' });
  const [relForm, setRelForm] = useState({
    person_id: '',
    related_person_id: '',
    relationship_type: '',
  });
  const [savingFamily, setSavingFamily] = useState(false);
  const [savingRel, setSavingRel] = useState(false);
  const [memberMap, setMemberMap] = useState<Record<string, Person[]>>({});
  const [addMemberFamilyId, setAddMemberFamilyId] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [fams, ppl, rels] = await Promise.all([
        getFamilies(),
        getPeople(),
        getRelationships(),
      ]);
      setFamilies(fams);
      setPeople(ppl);
      setRelationships(rels);
      const members: Record<string, Person[]> = {};
      for (const f of fams) {
        members[f.id] = await getFamilyMembers(f.id);
      }
      setMemberMap(members);
    } catch {
      toast.error('Could not load families.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveFamily() {
    if (!familyForm.name.trim()) {
      toast.error('Family name is required.');
      return;
    }
    setSavingFamily(true);
    try {
      await createFamily({
        name: familyForm.name.trim(),
        description: familyForm.description.trim() || null,
      });
      toast.success('Family created.');
      setFamilyForm({ name: '', description: '' });
      setFamilyOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create family.');
    } finally {
      setSavingFamily(false);
    }
  }

  async function saveRelationship() {
    if (!relForm.person_id || !relForm.related_person_id || !relForm.relationship_type) {
      toast.error('All fields are required.');
      return;
    }
    if (relForm.person_id === relForm.related_person_id) {
      toast.error('A person cannot be related to themselves.');
      return;
    }
    setSavingRel(true);
    try {
      await createRelationship(
        relForm.person_id,
        relForm.related_person_id,
        relForm.relationship_type
      );
      toast.success('Relationship added.');
      setRelForm({ person_id: '', related_person_id: '', relationship_type: '' });
      setRelOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add relationship.');
    } finally {
      setSavingRel(false);
    }
  }

  async function handleDeleteFamily() {
    if (!deleteFamilyId) return;
    try {
      await deleteFamily(deleteFamilyId);
      setFamilies((f) => f.filter((x) => x.id !== deleteFamilyId));
      toast.success('Family deleted.');
    } catch {
      toast.error('Could not delete family.');
    } finally {
      setDeleteFamilyId(null);
    }
  }

  async function handleDeleteRel() {
    if (!deleteRelId) return;
    try {
      await deleteRelationship(deleteRelId);
      setRelationships((r) => r.filter((x) => x.id !== deleteRelId));
      toast.success('Relationship removed.');
    } catch {
      toast.error('Could not remove relationship.');
    } finally {
      setDeleteRelId(null);
    }
  }

  async function addMember() {
    if (!addMemberFamilyId || !newMemberId) return;
    try {
      await addPersonToFamily(addMemberFamilyId, newMemberId);
      toast.success('Person added to family.');
      setNewMemberId('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add member.');
    }
  }

  async function removeMember(familyId: string, personId: string) {
    try {
      await removePersonFromFamily(familyId, personId);
      await load();
    } catch {
      toast.error('Could not remove member.');
    }
  }

  const personName = (id: string) =>
    people.find((p) => p.id === id)?.full_name ?? 'Unknown';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Families"
        description="Group people into families and define the relationships between them. The data you store here will power the visual family tree in a future phase."
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setRelOpen(true)}>
          <Link2 className="mr-2 h-4 w-4" />
          Add relationship
        </Button>
        <Button onClick={() => setFamilyOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create family
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Families */}
          {families.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No families created yet"
              description="Create a family to bring people together, share memories, and invite relatives to add their own stories to the same archive."
              actionLabel="Create your first family"
              actionHref="#"
              className="border-solid"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {families.map((f) => {
                const members = memberMap[f.id] ?? [];
                return (
                  <Card key={f.id} className="border-border/70 bg-card shadow-soft">
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="font-serif text-xl">{f.name}</CardTitle>
                        {f.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {f.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteFamilyId(f.id)}
                        aria-label={`Delete ${f.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No members yet.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {members.map((m) => {
                            const initials = m.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            return (
                              <li
                                key={m.id}
                                className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2.5"
                              >
                                <Avatar className="h-8 w-8 border border-border/60">
                                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="flex-1 text-sm font-medium">
                                  {m.full_name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeMember(f.id, m.id)}
                                  aria-label={`Remove ${m.full_name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <Select value={newMemberId} onValueChange={setNewMemberId}>
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Add a person…" />
                          </SelectTrigger>
                          <SelectContent>
                            {people
                              .filter((p) => !members.find((m) => m.id === p.id))
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.full_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAddMemberFamilyId(f.id);
                            addMember();
                          }}
                          disabled={!newMemberId}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Relationships */}
          {relationships.length > 0 && (
            <Card className="border-border/70 bg-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Link2 className="h-5 w-5 text-primary" />
                  Relationships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {relationships.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2.5"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">
                        <span className="font-medium">{personName(r.person_id)}</span>
                        <span className="mx-2 text-muted-foreground">is</span>
                        <Badge variant="secondary" className="mx-1 bg-accent/20 text-accent-foreground capitalize">
                          {r.relationship_type}
                        </Badge>
                        <span className="mx-1 text-muted-foreground">of</span>
                        <span className="font-medium">{personName(r.related_person_id)}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteRelId(r.id)}
                        aria-label="Remove relationship"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create family dialog */}
      <Dialog open={familyOpen} onOpenChange={setFamilyOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create a family</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fam-name">Name *</Label>
              <Input
                id="fam-name"
                value={familyForm.name}
                onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                placeholder="e.g. The Whitfield Family"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fam-desc">Description</Label>
              <Textarea
                id="fam-desc"
                rows={3}
                value={familyForm.description}
                onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}
                placeholder="A note about this family…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamilyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFamily} disabled={savingFamily}>
              {savingFamily && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create family
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add relationship dialog */}
      <Dialog open={relOpen} onOpenChange={setRelOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add a relationship</DialogTitle>
          </DialogHeader>
          {people.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              You need at least two people in your archive to define a relationship.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Person</Label>
                <Select
                  value={relForm.person_id}
                  onValueChange={(v) => setRelForm({ ...relForm, person_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a person…" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relationship type</Label>
                <Select
                  value={relForm.relationship_type}
                  onValueChange={(v) => setRelForm({ ...relForm, relationship_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['parent','child','sibling','spouse','grandparent','cousin','aunt','uncle','friend','guardian','custom'] as const).map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Related to</Label>
                <Select
                  value={relForm.related_person_id}
                  onValueChange={(v) => setRelForm({ ...relForm, related_person_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a person…" />
                  </SelectTrigger>
                  <SelectContent>
                    {people
                      .filter((p) => p.id !== relForm.person_id)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveRelationship}
              disabled={savingRel || people.length < 2}
            >
              {savingRel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteFamilyId}
        onOpenChange={(o) => !o && setDeleteFamilyId(null)}
        title="Delete this family?"
        description="This will remove the family group. People in your archive will not be deleted."
        onConfirm={handleDeleteFamily}
      />
      <ConfirmDialog
        open={!!deleteRelId}
        onOpenChange={(o) => !o && setDeleteRelId(null)}
        title="Remove this relationship?"
        description="This will remove the relationship between these two people."
        onConfirm={handleDeleteRel}
      />
    </div>
  );
}
