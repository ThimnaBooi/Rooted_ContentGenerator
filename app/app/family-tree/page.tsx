'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Network, Loader2, Users, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { getPeople, getRelationships, getFamilies, getFamilyMembers } from '@/lib/queries';
import type { Person, Family } from '@/lib/types';
import { cn } from '@/lib/utils';

type RelRow = { id: string; person_id: string; related_person_id: string; relationship_type: string };

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function FamilyTreePage() {
  const { session, isGuest } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<RelRow[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Record<string, Person[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const load = useCallback(async () => {
    try {
      const [ppl, rels, fams] = await Promise.all([
        getPeople(),
        getRelationships(),
        getFamilies(),
      ]);
      setPeople(ppl);
      setRelationships(rels as RelRow[]);
      setFamilies(fams);

      const fm: Record<string, Person[]> = {};
      for (const f of fams) {
        fm[f.id] = await getFamilyMembers(f.id);
      }
      setFamilyMembers(fm);
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

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Family Tree" description="Visually explore the relationships that connect your family across generations." />
        <EmptyState
          icon={Network}
          title="Sign in to explore your family tree"
          description="Create an account to build and explore an interactive family tree from your preserved people and relationships."
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

  if (people.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Family Tree" description="Visually explore the relationships that connect your family across generations." />
        <EmptyState
          icon={Network}
          title="Your family tree is waiting"
          description="Add people to your archive and define their relationships. Your family tree will grow organically as you preserve each connection."
          actionLabel="Add your first person"
          actionHref="/app/people"
        />
      </div>
    );
  }

  // Build relationship map
  const relMap = new Map<string, RelRow[]>();
  for (const r of relationships) {
    const existing = relMap.get(r.person_id) ?? [];
    relMap.set(r.person_id, [...existing, r]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Tree"
        description="Visually explore the relationships that connect your family across generations. Click any person to see their full profile."
      />

      {/* Families overview */}
      {families.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Users className="h-5 w-5 text-muted-foreground" />
            Family Groups
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((fam) => {
              const members = familyMembers[fam.id] ?? [];
              return (
                <Card key={fam.id} className="border-border/70 bg-card shadow-soft">
                  <CardContent className="p-4">
                    <h3 className="font-serif text-base font-semibold">{fam.name}</h3>
                    {fam.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{fam.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {members.slice(0, 5).map((m) => (
                        <Link key={m.id} href={`/app/people/${m.id}`}>
                          <Avatar
                            className="h-8 w-8 ring-2 ring-background transition-transform hover:scale-110"
                            onMouseEnter={() => setSelectedPerson(m)}
                          >
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {initials(m.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ))}
                      {members.length > 5 && (
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs text-muted-foreground">
                          +{members.length - 5}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* People grid with relationships */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <Network className="h-5 w-5 text-muted-foreground" />
          All People
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {people.map((person, idx) => {
            const rels = relMap.get(person.id) ?? [];
            return (
              <Link
                key={person.id}
                href={`/app/people/${person.id}`}
                className="animate-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Card className="h-full border-border/70 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        {person.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.photo_url} alt={person.full_name} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-sm text-primary">
                            {initials(person.full_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-serif text-sm font-semibold">{person.full_name}</h3>
                        {person.preferred_name && (
                          <p className="text-xs text-muted-foreground">"{person.preferred_name}"</p>
                        )}
                        {person.occupation && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{person.occupation}</p>
                        )}
                      </div>
                    </div>
                    {rels.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {rels.slice(0, 4).map((r) => {
                          const related = people.find((p) => p.id === r.related_person_id);
                          if (!related) return null;
                          return (
                            <Badge key={r.id} variant="outline" className="text-xs">
                              {r.relationship_type} → {related.full_name.split(' ')[0]}
                            </Badge>
                          );
                        })}
                        {rels.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{rels.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View profile <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
