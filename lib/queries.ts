import { supabase } from '@/lib/supabase-client';
import type {
  Person,
  Family,
  Memory,
  Photo,
  Document,
  VoiceRecording,
  Recipe,
  Tradition,
  Place,
  FamilyEvent,
  Activity,
} from '@/lib/types';

// ---------- Activity logging ----------
export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  entityTitle?: string,
  metadata?: Record<string, unknown>
) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase.from('activity_feed').insert({
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    entity_title: entityTitle ?? null,
    metadata: metadata ?? null,
  });
}

// ---------- People ----------
export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPerson(
  input: Omit<Person, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  await logActivity('created', 'person', data.id, data.full_name);
  return data;
}

export async function updatePerson(
  id: string,
  input: Partial<Person>
): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  await logActivity('updated', 'person', data.id, data.full_name);
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'person', id);
}

export async function duplicatePerson(id: string): Promise<Person | null> {
  const original = await getPerson(id);
  if (!original) return null;
  const { id: _id, user_id: _uid, created_at: _c, updated_at: _u, ...rest } =
    original;
  const copy = await createPerson({ ...rest, full_name: `${original.full_name} (Copy)` });
  return copy;
}

// ---------- Families ----------
export async function getFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFamily(
  input: Pick<Family, 'name' | 'description'>
): Promise<Family> {
  const { data, error } = await supabase
    .from('families')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  await logActivity('created', 'family', data.id, data.name);
  return data;
}

export async function deleteFamily(id: string): Promise<void> {
  const { error } = await supabase.from('families').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'family', id);
}

export async function addPersonToFamily(
  familyId: string,
  personId: string,
  role?: string
): Promise<void> {
  const { error } = await supabase.from('family_members').insert({
    family_id: familyId,
    person_id: personId,
    role: role ?? null,
  });
  if (error) throw error;
}

export async function removePersonFromFamily(
  familyId: string,
  personId: string
): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('person_id', personId);
  if (error) throw error;
}

export async function getFamilyMembers(familyId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('person:people(*)')
    .eq('family_id', familyId);
  if (error) throw error;
  return (data ?? []).map((r) => r.person as unknown as Person);
}

// ---------- Relationships ----------
export async function getRelationships(): Promise<
  { id: string; person_id: string; related_person_id: string; relationship_type: string }[]
> {
  const { data, error } = await supabase
    .from('relationships')
    .select('id, person_id, related_person_id, relationship_type')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRelationship(
  personId: string,
  relatedPersonId: string,
  relationshipType: string
): Promise<void> {
  const { error } = await supabase.from('relationships').insert({
    person_id: personId,
    related_person_id: relatedPersonId,
    relationship_type: relationshipType,
  });
  if (error) throw error;
}

export async function deleteRelationship(id: string): Promise<void> {
  const { error } = await supabase
    .from('relationships')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---------- Memories ----------
export async function getMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMemory(id: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMemory(
  input: Pick<
    Memory,
    'title' | 'description' | 'memory_date' | 'location' | 'tags' | 'emotional_category'
  > & { person_ids?: string[] }
): Promise<Memory> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('memories')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('memory_people').insert(
      person_ids.map((pid) => ({ memory_id: data.id, person_id: pid }))
    );
  }
  await logActivity('created', 'memory', data.id, data.title);
  return data;
}

export async function updateMemory(
  id: string,
  input: Partial<Memory> & { person_ids?: string[] }
): Promise<Memory> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('memories')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (person_ids !== undefined) {
    await supabase.from('memory_people').delete().eq('memory_id', id);
    if (person_ids.length > 0) {
      await supabase.from('memory_people').insert(
        person_ids.map((pid) => ({ memory_id: id, person_id: pid }))
      );
    }
  }
  await logActivity('updated', 'memory', data.id, data.title);
  return data;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from('memories').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'memory', id);
}

export async function getMemoriesForPerson(personId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memory_people')
    .select('memory:memories(*)')
    .eq('person_id', personId);
  if (error) throw error;
  return (data ?? []).map((r) => r.memory as unknown as Memory);
}

// ---------- Photos ----------
export async function getPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPhoto(
  input: Partial<Omit<Photo, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    storage_path: string;
    public_url: string;
    person_ids?: string[];
  }
): Promise<Photo> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('photos')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('photo_people').insert(
      person_ids.map((pid) => ({ photo_id: data.id, person_id: pid }))
    );
  }
  await logActivity('uploaded', 'photo', data.id, data.title ?? 'Photo');
  return data;
}

export async function updatePhoto(
  id: string,
  input: Partial<Photo>
): Promise<Photo> {
  const { data, error } = await supabase
    .from('photos')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePhoto(id: string): Promise<void> {
  const { data: photo } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (photo?.storage_path) {
    await supabase.storage.from('photos').remove([photo.storage_path]);
  }
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'photo', id);
}

export async function getPhotosForPerson(personId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photo_people')
    .select('photo:photos(*)')
    .eq('person_id', personId);
  if (error) throw error;
  return (data ?? []).map((r) => r.photo as unknown as Photo);
}

// ---------- Documents ----------
export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDocument(
  input: Partial<Omit<Document, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    storage_path: string;
    public_url: string;
    person_ids?: string[];
  }
): Promise<Document> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('documents')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('document_people').insert(
      person_ids.map((pid) => ({ document_id: data.id, person_id: pid }))
    );
  }
  await logActivity('uploaded', 'document', data.id, data.title);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (doc?.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path]);
  }
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'document', id);
}

export async function getDocumentsForPerson(personId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('document_people')
    .select('document:documents(*)')
    .eq('person_id', personId);
  if (error) throw error;
  return (data ?? []).map((r) => r.document as unknown as Document);
}

// ---------- Voice ----------
export async function getVoiceRecordings(): Promise<VoiceRecording[]> {
  const { data, error } = await supabase
    .from('voice_recordings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createVoice(
  input: Partial<Omit<VoiceRecording, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    storage_path: string;
    public_url: string;
    person_ids?: string[];
  }
): Promise<VoiceRecording> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('voice_recordings')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('voice_people').insert(
      person_ids.map((pid) => ({ voice_id: data.id, person_id: pid }))
    );
  }
  await logActivity('uploaded', 'voice', data.id, data.title);
  return data;
}

export async function deleteVoice(id: string): Promise<void> {
  const { data: rec } = await supabase
    .from('voice_recordings')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (rec?.storage_path) {
    await supabase.storage.from('voice').remove([rec.storage_path]);
  }
  const { error } = await supabase.from('voice_recordings').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'voice', id);
}

export async function getVoiceForPerson(personId: string): Promise<VoiceRecording[]> {
  const { data, error } = await supabase
    .from('voice_people')
    .select('voice:voice_recordings(*)')
    .eq('person_id', personId);
  if (error) throw error;
  return (data ?? []).map((r) => r.voice as unknown as VoiceRecording);
}

// ---------- Recipes ----------
export async function getRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRecipe(
  input: Partial<Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    title: string;
    person_ids?: string[];
  }
): Promise<Recipe> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('recipes')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('recipe_people').insert(
      person_ids.map((pid) => ({ recipe_id: data.id, person_id: pid }))
    );
  }
  await logActivity('created', 'recipe', data.id, data.title);
  return data;
}

export async function updateRecipe(
  id: string,
  input: Partial<Recipe>
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'recipe', id);
}

export async function getRecipesForPerson(personId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipe_people')
    .select('recipe:recipes(*)')
    .eq('person_id', personId);
  if (error) throw error;
  return (data ?? []).map((r) => r.recipe as unknown as Recipe);
}

// ---------- Traditions ----------
export async function getTraditions(): Promise<Tradition[]> {
  const { data, error } = await supabase
    .from('traditions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTradition(
  input: Partial<Omit<Tradition, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    title: string;
    person_ids?: string[];
  }
): Promise<Tradition> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('traditions')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('tradition_people').insert(
      person_ids.map((pid) => ({ tradition_id: data.id, person_id: pid }))
    );
  }
  await logActivity('created', 'tradition', data.id, data.title);
  return data;
}

export async function deleteTradition(id: string): Promise<void> {
  const { error } = await supabase.from('traditions').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'tradition', id);
}

// ---------- Places ----------
export async function getPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPlace(
  input: Partial<Omit<Place, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    name: string;
    person_ids?: string[];
  }
): Promise<Place> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('places')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('place_people').insert(
      person_ids.map((pid) => ({ place_id: data.id, person_id: pid }))
    );
  }
  await logActivity('created', 'place', data.id, data.name);
  return data;
}

export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('places').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'place', id);
}

// ---------- Events ----------
export async function getEvents(): Promise<FamilyEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(
  input: Partial<Omit<FamilyEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
    title: string;
    person_ids?: string[];
  }
): Promise<FamilyEvent> {
  const { person_ids, ...fields } = input;
  const { data, error } = await supabase
    .from('events')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  if (person_ids && person_ids.length > 0) {
    await supabase.from('event_people').insert(
      person_ids.map((pid) => ({ event_id: data.id, person_id: pid }))
    );
  }
  await logActivity('created', 'event', data.id, data.title);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
  await logActivity('deleted', 'event', id);
}

// ---------- Activity ----------
export async function getActivities(limit = 20): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ---------- Dashboard summary ----------
export async function getDashboardSummary() {
  const [people, memories, photos, recipes, traditions, events] = await Promise.all([
    supabase.from('people').select('id', { count: 'exact', head: true }),
    supabase.from('memories').select('id', { count: 'exact', head: true }),
    supabase.from('photos').select('id', { count: 'exact', head: true }),
    supabase.from('recipes').select('id', { count: 'exact', head: true }),
    supabase.from('traditions').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
  ]);

  return {
    people: people.count ?? 0,
    memories: memories.count ?? 0,
    photos: photos.count ?? 0,
    recipes: recipes.count ?? 0,
    traditions: traditions.count ?? 0,
    events: events.count ?? 0,
  };
}

// ---------- Global search ----------
export type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const like = `%${query}%`;
  const [people, memories, recipes, events, places, documents] = await Promise.all([
    supabase
      .from('people')
      .select('id, full_name, preferred_name')
      .or(`full_name.ilike.${like},preferred_name.ilike.${like}`)
      .limit(10),
    supabase
      .from('memories')
      .select('id, title, description')
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(10),
    supabase
      .from('recipes')
      .select('id, title')
      .ilike('title', like)
      .limit(10),
    supabase
      .from('events')
      .select('id, title')
      .ilike('title', like)
      .limit(10),
    supabase
      .from('places')
      .select('id, name, location')
      .or(`name.ilike.${like},location.ilike.${like}`)
      .limit(10),
    supabase
      .from('documents')
      .select('id, title')
      .ilike('title', like)
      .limit(10),
  ]);

  const results: SearchResult[] = [];
  (people.data ?? []).forEach((p) =>
    results.push({
      type: 'person',
      id: p.id,
      title: p.full_name,
      subtitle: p.preferred_name,
      href: `/app/people/${p.id}`,
    })
  );
  (memories.data ?? []).forEach((m) =>
    results.push({
      type: 'memory',
      id: m.id,
      title: m.title,
      subtitle: m.description,
      href: `/app/memories`,
    })
  );
  (recipes.data ?? []).forEach((r) =>
    results.push({
      type: 'recipe',
      id: r.id,
      title: r.title,
      subtitle: null,
      href: `/app/recipes`,
    })
  );
  (events.data ?? []).forEach((e) =>
    results.push({
      type: 'event',
      id: e.id,
      title: e.title,
      subtitle: null,
      href: `/app/timeline`,
    })
  );
  (places.data ?? []).forEach((p) =>
    results.push({
      type: 'place',
      id: p.id,
      title: p.name,
      subtitle: p.location,
      href: `/app/places`,
    })
  );
  (documents.data ?? []).forEach((d) =>
    results.push({
      type: 'document',
      id: d.id,
      title: d.title,
      subtitle: null,
      href: `/app/documents`,
    })
  );
  return results;
}
