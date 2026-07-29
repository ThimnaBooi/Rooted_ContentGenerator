// Rooted archive — database row types (mirror the Supabase schema)

export type Person = {
  id: string;
  user_id: string;
  full_name: string;
  preferred_name: string | null;
  date_of_birth: string | null;
  date_of_passing: string | null;
  gender: string | null;
  occupation: string | null;
  bio: string | null;
  personality_traits: string[] | null;
  favourite_quotes: string[] | null;
  interests: string[] | null;
  hobbies: string[] | null;
  achievements: string[] | null;
  life_lessons: string[] | null;
  relationship_to_owner: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Family = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Relationship = {
  id: string;
  user_id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: string;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  memory_date: string | null;
  location: string | null;
  tags: string[] | null;
  emotional_category: string | null;
  created_at: string;
  updated_at: string;
};

export type Photo = {
  id: string;
  user_id: string;
  title: string | null;
  caption: string | null;
  description: string | null;
  storage_path: string;
  public_url: string;
  approximate_date: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  storage_path: string;
  public_url: string;
  file_type: string | null;
  created_at: string;
  updated_at: string;
};

export type VoiceRecording = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  public_url: string;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  ingredients: string | null;
  instructions: string | null;
  created_by: string | null;
  occasions: string | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Tradition = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  when_it_happens: string | null;
  participants: string | null;
  created_at: string;
  updated_at: string;
};

export type Place = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type FamilyEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  event_type: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export const EMOTIONAL_CATEGORIES = [
  'celebration',
  'childhood',
  'travel',
  'family',
  'education',
  'friendship',
  'tradition',
  'milestone',
  'achievement',
] as const;

export const RELATIONSHIP_TYPES = [
  'parent',
  'child',
  'sibling',
  'spouse',
  'grandparent',
  'cousin',
  'aunt',
  'uncle',
  'friend',
  'guardian',
  'custom',
] as const;

export const DOCUMENT_CATEGORIES = [
  'letter',
  'certificate',
  'note',
  'recipe',
  'newspaper',
  'other',
] as const;
