'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  Loader2,
  Trash2,
  Home,
  School,
  Church,
  Building2,
  Plane,
  Cross,
  Heart,
  Briefcase,
  MapPinned,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getMemoryMapPins, createMemoryMapPin, deleteMemoryMapPin,
} from '@/lib/media-queries';
import { PIN_TYPES } from '@/lib/media-types';
import type { MemoryMapPin } from '@/lib/media-types';
import { cn } from '@/lib/utils';

function pinIcon(type: string) {
  switch (type) {
    case 'childhood_home': return Home;
    case 'school': return School;
    case 'church': return Church;
    case 'family_business': return Building2;
    case 'ancestral_village': return MapPinned;
    case 'holiday_destination': return Plane;
    case 'cemetery': return Cross;
    case 'wedding_venue': return Heart;
    case 'workplace': return Briefcase;
    default: return MapPin;
  }
}

export default function MemoryMapPage() {
  const { session, isGuest } = useAuth();
  const [pins, setPins] = useState<MemoryMapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<MemoryMapPin | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('childhood_home');
  const [newAddress, setNewAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMemoryMapPins();
      setPins(data);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createMemoryMapPin({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        pinType: newType,
        address: newAddress.trim() || undefined,
      });
      toast.success('Location pinned to your memory map.');
      setNewName(''); setNewDesc(''); setNewAddress(''); setNewType('childhood_home');
      setCreateOpen(false);
      await load();
    } catch {
      toast.error('Could not pin location.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemoryMapPin(id);
      if (selectedPin?.id === id) setSelectedPin(null);
      toast.success('Location removed.');
      await load();
    } catch {
      toast.error('Could not remove location.');
    }
  }

  if (isGuest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Memory Map" description="Pin the places that shaped your family — childhood homes, schools, ancestral villages, and sacred spaces." />
        <EmptyState icon={MapPin} title="Sign in to see your memory map" description="Create an account to pin significant locations and connect them to your family's stories." actionLabel="Create your account" actionHref="/register" />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Memory Map"
          description="Pin the places that shaped your family — childhood homes, schools, ancestral villages, churches, and holiday destinations. Each location connects to the people and memories tied to it."
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Pin a Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Pin a Significant Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin-name">Location name</Label>
                <Input id="pin-name" placeholder="e.g. Grandmother's House" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin-type">Type of place</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="pin-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PIN_TYPES.map((t) => {
                      const Icon = pinIcon(t.value);
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {t.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin-address">Address or coordinates (optional)</Label>
                <Input id="pin-address" placeholder="e.g. 123 Main St, Old Town, Country" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin-desc">Description (optional)</Label>
                <Textarea id="pin-desc" placeholder="What makes this place special?" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Pin Location
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pins.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Your memory map is empty"
          description="Pin childhood homes, schools, churches, family businesses, ancestral villages, holiday spots, and cemeteries. Each pin anchors the stories connected to that place."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map placeholder */}
          <div className="lg:col-span-2">
            <div className="relative h-[500px] overflow-hidden rounded-2xl border border-border bg-secondary/40 shadow-soft">
              {/* Stylized map background */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(circle at 30% 40%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 70% 60%, var(--accent) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Interactive map — {pins.length} pinned {pins.length === 1 ? 'location' : 'locations'}</p>
              </div>
              {/* Pinned locations as visual markers */}
              {pins.map((pin, idx) => {
                const Icon = pinIcon(pin.pin_type);
                const left = 15 + (idx % 4) * 22 + (idx % 2) * 5;
                const top = 15 + Math.floor(idx / 4) * 30;
                return (
                  <button
                    key={pin.id}
                    onClick={() => setSelectedPin(pin)}
                    className={cn(
                      'absolute grid h-10 w-10 place-items-center rounded-full border-2 border-background shadow-soft transition-all hover:scale-110',
                      selectedPin?.id === pin.id ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'
                    )}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pin list / detail */}
          <div className="space-y-3">
            {selectedPin ? (
              <Card className="border-border/70 bg-card shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = pinIcon(selectedPin.pin_type);
                        return <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>;
                      })()}
                      <div>
                        <h3 className="font-serif text-base font-semibold">{selectedPin.name}</h3>
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          {PIN_TYPES.find((t) => t.value === selectedPin.pin_type)?.label ?? selectedPin.pin_type}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedPin(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedPin.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{selectedPin.description}</p>
                  )}
                  {selectedPin.address && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {selectedPin.address}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selectedPin.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove pin
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <p className="rounded-lg bg-card/40 p-3 text-sm text-muted-foreground">
                Select a pin to see its details, or pin a new location to add to your map.
              </p>
            )}

            {/* All pins list */}
            <div className="space-y-2">
              {pins.map((pin) => {
                const Icon = pinIcon(pin.pin_type);
                return (
                  <Card
                    key={pin.id}
                    className={cn(
                      'cursor-pointer border-border/70 bg-card/50 transition-all hover:bg-card hover:shadow-soft',
                      selectedPin?.id === pin.id && 'border-primary/30 bg-primary/5'
                    )}
                    onClick={() => setSelectedPin(pin)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{pin.name}</p>
                        {pin.address && <p className="truncate text-xs text-muted-foreground">{pin.address}</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
