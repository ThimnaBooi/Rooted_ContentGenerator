'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { PersonForm } from '@/components/app/people/person-form';
import { ItemActions } from '@/components/app/item-actions';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getPeople, deletePerson, duplicatePerson } from '@/lib/queries';
import type { Person } from '@/lib/types';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function PeoplePage() {
  const { isGuest } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getPeople();
      setPeople(data);
    } catch {
      toast.error('Could not load people.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePerson(deleteId);
      setPeople((p) => p.filter((x) => x.id !== deleteId));
      toast.success('Person removed.');
    } catch {
      toast.error('Could not delete person.');
    } finally {
      setDeleteId(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const copy = await duplicatePerson(id);
      if (copy) {
        setPeople((p) => [copy, ...p]);
        toast.success('Person duplicated.');
      }
    } catch {
      toast.error('Could not duplicate person.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="People"
        description="The individuals who make your family story what it is. Each person becomes a thread connecting memories, photos, traditions, and recipes."
      />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a person
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people added yet"
          description="Begin by adding the people at the heart of your story. Each person becomes a thread connecting memories, photos, and traditions."
          actionLabel="Add your first person"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => {
            const initials = p.full_name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <Card
                key={p.id}
                className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <Link href={`/app/people/${p.id}`} className="flex flex-1 items-center gap-3">
                      <Avatar className="h-12 w-12 border border-border/60">
                        {p.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photo_url}
                            alt={p.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-base font-semibold">
                          {p.full_name}
                        </p>
                        {p.preferred_name && (
                          <p className="truncate text-xs text-muted-foreground">
                            &ldquo;{p.preferred_name}&rdquo;
                          </p>
                        )}
                      </div>
                    </Link>
                    <ItemActions
                      entityLabel={p.full_name}
                      onEdit={() => {
                        setEditTarget(p);
                        setFormOpen(true);
                      }}
                      onDuplicate={() => handleDuplicate(p.id)}
                      onDelete={() => setDeleteId(p.id)}
                    />
                  </div>
                  {p.relationship_to_owner && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {p.relationship_to_owner}
                    </p>
                  )}
                  {p.occupation && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.occupation}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PersonForm
        open={formOpen}
        onOpenChange={setFormOpen}
        person={editTarget}
        onSaved={() => load()}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this person?"
        description="This will permanently remove their profile and all connections to memories, photos, and recipes. This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
