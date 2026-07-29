'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPeople } from '@/lib/queries';
import type { Person } from '@/lib/types';
import { cn } from '@/lib/utils';

type PersonSelectorProps = {
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  className?: string;
};

export function PersonSelector({
  selected,
  onChange,
  label = 'Associated people',
  className,
}: PersonSelectorProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getPeople().then(setPeople).catch(() => {});
  }, []);

  const filtered = people.filter((p) =>
    p.full_name.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const selectedPeople = people.filter((p) => selected.includes(p.id));

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{label}</p>
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPeople.map((p) => (
            <Badge
              key={p.id}
              variant="secondary"
              className="gap-1 bg-primary/10 text-primary"
            >
              {p.full_name}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="ml-0.5 rounded-full text-xs hover:opacity-70"
                aria-label={`Remove ${p.full_name}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          onClick={() => setOpen((o) => !o)}
          className="w-full justify-between font-normal"
          aria-expanded={open}
        >
          {selected.length === 0 ? 'Select people…' : `${selected.length} selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover p-2 shadow-md">
            <Input
              type="text"
              placeholder="Search people…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2 h-9"
            />
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No people found.
                </p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent/20"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{p.full_name}</span>
                    {selected.includes(p.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
