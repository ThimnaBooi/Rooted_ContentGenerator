// Rooted Studio — AI content creation types

export type StudioDocument = {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string | null;
  content_type: string;
  content_format: string;
  writing_style: string | null;
  tone: string | null;
  target_audience: string | null;
  detail_level: string | null;
  document_length: string | null;
  language: string;
  template_id: string | null;
  source_refs: Record<string, unknown> | null;
  custom_instructions: string | null;
  is_favourite: boolean;
  is_draft: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type StudioDocumentVersion = {
  id: string;
  document_id: string;
  user_id: string;
  title: string;
  content: string | null;
  version_number: number;
  created_at: string;
};

export type StudioImage = {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  image_type: string;
  prompt: string | null;
  style: string | null;
  storage_path: string | null;
  public_url: string | null;
  source_photo_url: string | null;
  is_favourite: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type StudioProject = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: string;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioProjectItem = {
  id: string;
  project_id: string;
  user_id: string;
  item_type: string;
  document_id: string | null;
  image_id: string | null;
  sort_order: number;
  created_at: string;
};

export type StudioFolder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type StudioTemplate = {
  id: string;
  user_id: string;
  name: string;
  template_type: string;
  description: string | null;
  layout_config: Record<string, unknown> | null;
  is_system: boolean;
  created_at: string;
};

// Content type definitions
export const CONTENT_TYPES = [
  { value: 'biography', label: 'Biography', icon: 'BookOpen', category: 'story' },
  { value: 'autobiography', label: 'Autobiography', icon: 'BookOpen', category: 'story' },
  { value: 'memoir', label: 'Memoir', icon: 'BookOpen', category: 'story' },
  { value: 'life_story', label: 'Life Story', icon: 'BookOpen', category: 'story' },
  { value: 'memory_book', label: 'Memory Book', icon: 'BookMarked', category: 'book' },
  { value: 'childrens_storybook', label: "Children's Storybook", icon: 'Baby', category: 'book' },
  { value: 'family_history_book', label: 'Family History Book', icon: 'Library', category: 'book' },
  { value: 'tribute_speech', label: 'Tribute Speech', icon: 'Mic', category: 'speech' },
  { value: 'wedding_speech', label: 'Wedding Speech', icon: 'Heart', category: 'speech' },
  { value: 'anniversary_speech', label: 'Anniversary Speech', icon: 'Heart', category: 'speech' },
  { value: 'birthday_speech', label: 'Birthday Speech', icon: 'Cake', category: 'speech' },
  { value: 'retirement_speech', label: 'Retirement Speech', icon: 'Award', category: 'speech' },
  { value: 'legacy_letter', label: 'Legacy Letter', icon: 'Mail', category: 'letter' },
  { value: 'letter_to_future', label: 'Letter to Future Generations', icon: 'Mail', category: 'letter' },
  { value: 'family_newsletter', label: 'Family Newsletter', icon: 'Newspaper', category: 'document' },
  { value: 'recipe_book', label: 'Recipe Book', icon: 'UtensilsCrossed', category: 'book' },
  { value: 'journal', label: 'Journal', icon: 'PenLine', category: 'document' },
  { value: 'event_summary', label: 'Event Summary', icon: 'CalendarClock', category: 'document' },
  { value: 'cultural_heritage_book', label: 'Cultural Heritage Book', icon: 'Globe', category: 'book' },
  { value: 'photo_book_captions', label: 'Photo Book Captions', icon: 'Camera', category: 'document' },
  { value: 'blog_article', label: 'Blog Article', icon: 'Globe', category: 'document' },
  { value: 'website_content', label: 'Website Content', icon: 'Globe', category: 'document' },
  { value: 'printable_keepsake', label: 'Printable Keepsake', icon: 'Gift', category: 'keepsake' },
  { value: 'invitation_wording', label: 'Invitation Wording', icon: 'Mail', category: 'document' },
  { value: 'thank_you_message', label: 'Thank-You Message', icon: 'Heart', category: 'document' },
  { value: 'social_media_caption', label: 'Social Media Caption', icon: 'Share2', category: 'document' },
];

export const IMAGE_TYPES = [
  { value: 'storybook_illustration', label: 'Storybook Illustration', icon: 'Baby' },
  { value: 'family_tree_artwork', label: 'Family Tree Artwork', icon: 'GitBranch' },
  { value: 'watercolour_painting', label: 'Watercolour Painting', icon: 'Palette' },
  { value: 'oil_painting', label: 'Oil Painting', icon: 'Palette' },
  { value: 'pencil_sketch', label: 'Pencil Sketch', icon: 'Pencil' },
  { value: 'scrapbook_page', label: 'Scrapbook Page', icon: 'Scissors' },
  { value: 'greeting_card', label: 'Greeting Card', icon: 'Mail' },
  { value: 'family_poster', label: 'Family Poster', icon: 'Image' },
  { value: 'quote_card', label: 'Inspirational Quote Card', icon: 'Quote' },
  { value: 'decorative_certificate', label: 'Decorative Certificate', icon: 'Award' },
  { value: 'book_cover', label: 'Book Cover', icon: 'BookMarked' },
  { value: 'timeline_artwork', label: 'Timeline Artwork', icon: 'CalendarClock' },
  { value: 'heritage_artwork', label: 'Heritage Artwork', icon: 'Landmark' },
  { value: 'invitation_design', label: 'Invitation Design', icon: 'Mail' },
  { value: 'printable_keepsake', label: 'Printable Keepsake', icon: 'Gift' },
];

export const WRITING_STYLES = [
  { value: 'narrative', label: 'Narrative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'formal', label: 'Formal' },
  { value: 'literary', label: 'Literary' },
  { value: 'journalistic', label: 'Journalistic' },
  { value: 'poetic', label: 'Poetic' },
];

export const TONES = [
  { value: 'warm', label: 'Warm' },
  { value: 'celebratory', label: 'Celebratory' },
  { value: 'reflective', label: 'Reflective' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'respectful', label: 'Respectful' },
  { value: 'playful', label: 'Playful' },
  { value: 'nostalgic', label: 'Nostalgic' },
];

export const DETAIL_LEVELS = [
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'comprehensive', label: 'Comprehensive' },
];

export const DOCUMENT_LENGTHS = [
  { value: 'short', label: 'Short (1–2 pages)' },
  { value: 'medium', label: 'Medium (3–5 pages)' },
  { value: 'long', label: 'Long (6–10 pages)' },
  { value: 'extended', label: 'Extended (10+ pages)' },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
];

export const TEMPLATE_TYPES = [
  { value: 'book', label: 'Book Layout' },
  { value: 'speech', label: 'Speech Format' },
  { value: 'greeting_card', label: 'Greeting Card' },
  { value: 'poster', label: 'Poster' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'keepsake', label: 'Keepsake' },
];
