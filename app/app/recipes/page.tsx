'use client';

import { useEffect, useState } from 'react';
import { Plus, UtensilsCrossed, Loader2, ChefHat } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { PersonSelector } from '@/components/app/person-selector';
import { ItemActions } from '@/components/app/item-actions';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { CreateWithAI } from '@/components/app/studio/create-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getRecipes, createRecipe, deleteRecipe, updateRecipe } from '@/lib/queries';
import type { Recipe } from '@/lib/types';
import { toast } from 'sonner';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Recipe | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    created_by: '',
    occasions: '',
    personal_notes: '',
  });
  const [personIds, setPersonIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await getRecipes();
      setRecipes(data);
    } catch {
      toast.error('Could not load recipes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditTarget(null);
    setForm({
      title: '',
      ingredients: '',
      instructions: '',
      created_by: '',
      occasions: '',
      personal_notes: '',
    });
    setPersonIds([]);
    setFormOpen(true);
  }

  function openEdit(r: Recipe) {
    setEditTarget(r);
    setForm({
      title: r.title,
      ingredients: r.ingredients ?? '',
      instructions: r.instructions ?? '',
      created_by: r.created_by ?? '',
      occasions: r.occasions ?? '',
      personal_notes: r.personal_notes ?? '',
    });
    setPersonIds([]);
    setFormOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        ingredients: form.ingredients.trim() || null,
        instructions: form.instructions.trim() || null,
        created_by: form.created_by.trim() || null,
        occasions: form.occasions.trim() || null,
        personal_notes: form.personal_notes.trim() || null,
        person_ids: personIds,
      };
      if (editTarget) {
        await updateRecipe(editTarget.id, payload);
        toast.success('Recipe updated.');
      } else {
        await createRecipe(payload);
        toast.success('Recipe added to your collection.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save recipe.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteRecipe(deleteId);
      setRecipes((r) => r.filter((x) => x.id !== deleteId));
      toast.success('Recipe deleted.');
    } catch {
      toast.error('Could not delete recipe.');
    } finally {
      setDeleteId(null);
    }
  }

  async function handleDuplicate(r: Recipe) {
    try {
      const copy = await createRecipe({
        title: `${r.title} (Copy)`,
        ingredients: r.ingredients,
        instructions: r.instructions,
        created_by: r.created_by,
        occasions: r.occasions,
        personal_notes: r.personal_notes,
      });
      setRecipes((prev) => [copy, ...prev]);
      toast.success('Recipe duplicated.');
    } catch {
      toast.error('Could not duplicate recipe.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Recipes"
        description="The dishes that carry your family's history. Keep the recipes, the notes in the margins, and the stories behind them."
      />

      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add a recipe
        </Button>
      </div>

      <CreateWithAI sourceType="recipe" sourceId="" sourceName="this recipe" />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No recipes saved yet"
          description="Add a family recipe — the way it was really made, with the notes and stories that make it yours. A living cookbook, one dish at a time."
          actionLabel="Add your first recipe"
          actionHref="#"
          className="border-solid"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <Card
              key={r.id}
              className="group border-border/70 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <ItemActions
                    entityLabel={r.title}
                    onEdit={() => openEdit(r)}
                    onDuplicate={() => handleDuplicate(r)}
                    onDelete={() => setDeleteId(r.id)}
                  />
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold">{r.title}</h3>
                {r.created_by && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    By {r.created_by}
                  </p>
                )}
                {r.personal_notes && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {r.personal_notes}
                  </p>
                )}
                {r.occasions && (
                  <p className="mt-2 text-xs italic text-accent-foreground">
                    {r.occasions}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editTarget ? 'Edit recipe' : 'Add a recipe'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipe-title">Title *</Label>
              <Input
                id="recipe-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Nonna's Sunday sauce"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-ingredients">Ingredients</Label>
              <Textarea
                id="recipe-ingredients"
                rows={5}
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                placeholder="One per line…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-instructions">Cooking instructions</Label>
              <Textarea
                id="recipe-instructions"
                rows={6}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Step by step…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipe-by">Who created this recipe</Label>
                <Input
                  id="recipe-by"
                  value={form.created_by}
                  onChange={(e) => setForm({ ...form, created_by: e.target.value })}
                  placeholder="e.g. Nonna Maria"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-occasions">Traditional occasions</Label>
                <Input
                  id="recipe-occasions"
                  value={form.occasions}
                  onChange={(e) => setForm({ ...form, occasions: e.target.value })}
                  placeholder="e.g. Sundays, Christmas Eve"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-notes">Why this recipe is meaningful</Label>
              <Textarea
                id="recipe-notes"
                rows={3}
                value={form.personal_notes}
                onChange={(e) => setForm({ ...form, personal_notes: e.target.value })}
                placeholder="The story behind this dish…"
              />
            </div>
            <PersonSelector selected={personIds} onChange={setPersonIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editTarget ? 'Save changes' : 'Add recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this recipe?"
        description="This will permanently remove the recipe from your collection."
        onConfirm={handleDelete}
      />
    </div>
  );
}
