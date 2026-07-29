// Phase 7 — Advanced AI & Intelligent Automation types

export type AISettings = {
  id: string;
  user_id: string;
  memory_suggestions: boolean;
  photo_analysis: boolean;
  ocr_enabled: boolean;
  voice_analysis: boolean;
  relationship_suggestions: boolean;
  timeline_suggestions: boolean;
  creative_recommendations: boolean;
  content_repurposing: boolean;
  learning_preferences: boolean;
  intelligent_notifications: boolean;
  face_detection_consent: boolean;
  created_at: string;
  updated_at: string;
};

export type AITask = {
  id: string;
  user_id: string;
  task_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AISuggestion = {
  id: string;
  user_id: string;
  suggestion_type: string;
  title: string;
  description: string | null;
  explanation: string | null;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_ref_2_type: string | null;
  entity_ref_2_id: string | null;
  action_label: string | null;
  action_href: string | null;
  metadata: Record<string, unknown> | null;
  status: 'pending' | 'dismissed' | 'accepted' | 'review_later';
  created_at: string;
  updated_at: string;
};

export type AIPreference = {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: string;
  preference_category: string;
  confidence_score: number;
  times_observed: number;
  created_at: string;
  updated_at: string;
};

export type AIJobHistory = {
  id: string;
  user_id: string;
  task_type: string;
  task_title: string | null;
  status: string;
  input_summary: string | null;
  output_summary: string | null;
  duration_seconds: number | null;
  created_at: string;
};

export type DuplicateReview = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_1_id: string;
  entity_1_title: string | null;
  entity_2_id: string;
  entity_2_title: string;
  similarity_score: number | null;
  explanation: string | null;
  status: 'pending' | 'merged' | 'ignored' | 'review_later';
  created_at: string;
  updated_at: string;
};

export type RelationshipSuggestion = {
  id: string;
  user_id: string;
  person_1_id: string;
  person_1_name: string | null;
  person_2_id: string;
  person_2_name: string;
  suggested_relationship: string;
  evidence: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number | null;
  status: 'pending' | 'confirmed' | 'dismissed' | 'review_later';
  created_at: string;
  updated_at: string;
};

export type TimelineGap = {
  id: string;
  user_id: string;
  gap_start_year: number;
  gap_end_year: number;
  gap_description: string | null;
  surrounding_context: string | null;
  status: 'pending' | 'documented' | 'dismissed' | 'review_later';
  created_at: string;
  updated_at: string;
};

export type OCRResult = {
  id: string;
  user_id: string;
  document_id: string | null;
  extracted_text: string | null;
  edited_text: string | null;
  suggested_people: string[] | null;
  suggested_places: string[] | null;
  suggested_dates: string[] | null;
  confidence_score: number | null;
  status: 'pending_review' | 'edited' | 'saved' | 'dismissed';
  created_at: string;
  updated_at: string;
};

export type VoiceTranscript = {
  id: string;
  user_id: string;
  voice_recording_id: string | null;
  transcript_text: string | null;
  edited_transcript: string | null;
  speakers: Record<string, unknown> | null;
  summary: string | null;
  important_quotes: string[] | null;
  suggested_memories: Record<string, unknown> | null;
  suggested_timeline_events: Record<string, unknown> | null;
  confidence_score: number | null;
  status: 'pending_review' | 'edited' | 'saved' | 'dismissed';
  created_at: string;
  updated_at: string;
};

export type PhotoAnalysis = {
  id: string;
  user_id: string;
  photo_id: string;
  faces_detected: Record<string, unknown> | null;
  suggested_people: Record<string, unknown> | null;
  suggested_location: string | null;
  suggested_event: string | null;
  suggested_date: string | null;
  is_duplicate: boolean;
  duplicate_of_photo_id: string | null;
  related_memories: Record<string, unknown> | null;
  confidence_score: number | null;
  analysis_consent_given: boolean;
  status: 'pending_review' | 'reviewed' | 'saved' | 'dismissed';
  created_at: string;
  updated_at: string;
};

export type ArchiveHealth = {
  id: string;
  user_id: string;
  total_people: number;
  complete_profiles: number;
  incomplete_profiles: number;
  profile_completeness_pct: number;
  total_memories: number;
  total_recipes: number;
  total_traditions: number;
  total_photos: number;
  total_voice_recordings: number;
  total_documents: number;
  total_places: number;
  total_events: number;
  missing_generations: string[] | null;
  timeline_coverage: Record<string, unknown> | null;
  geographic_coverage: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  calculated_at: string;
};

export type FamilyInsights = {
  id: string;
  user_id: string;
  most_documented_members: Record<string, unknown> | null;
  oldest_preserved_memory: string | null;
  oldest_memory_date: string | null;
  most_common_traditions: Record<string, unknown> | null;
  frequently_visited_locations: Record<string, unknown> | null;
  most_photographed_person: Record<string, unknown> | null;
  most_contributed_recipes: Record<string, unknown> | null;
  timeline_coverage: Record<string, unknown> | null;
  archive_growth: Record<string, unknown> | null;
  monthly_activity: Record<string, unknown> | null;
  calculated_at: string;
};

export type IntelligentNotification = {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string | null;
  action_label: string | null;
  action_href: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
};

// ============ Constants ============

export const SUGGESTION_TYPES = [
  { value: 'missing_memory', label: 'Missing Memory' },
  { value: 'missing_photo', label: 'Missing Photograph' },
  { value: 'missing_voice', label: 'Missing Voice Recording' },
  { value: 'missing_timeline_event', label: 'Missing Timeline Event' },
  { value: 'missing_recipe', label: 'Missing Recipe' },
  { value: 'missing_tradition', label: 'Missing Tradition' },
  { value: 'missing_location', label: 'Missing Location' },
  { value: 'missing_biography', label: 'Missing Biography' },
  { value: 'incomplete_profile', label: 'Incomplete Person Profile' },
  { value: 'incomplete_relationships', label: 'Incomplete Relationships' },
  { value: 'creative_recommendation', label: 'Creative Recommendation' },
  { value: 'quality_review', label: 'Quality Review' },
] as const;

export const AI_TASK_TYPES = [
  { value: 'ocr', label: 'OCR Document Processing' },
  { value: 'voice_transcription', label: 'Voice Transcription' },
  { value: 'photo_analysis', label: 'Photo Analysis' },
  { value: 'duplicate_detection', label: 'Duplicate Detection' },
  { value: 'relationship_analysis', label: 'Relationship Analysis' },
  { value: 'timeline_analysis', label: 'Timeline Analysis' },
  { value: 'archive_health', label: 'Archive Health Analysis' },
  { value: 'family_insights', label: 'Family Insights Analysis' },
  { value: 'content_generation', label: 'Content Generation' },
  { value: 'semantic_search', label: 'Semantic Search' },
  { value: 'archive_qa', label: 'Archive Q&A' },
] as const;

export const CONFIDENCE_LEVELS = [
  { value: 'high', label: 'High Confidence', color: 'text-emerald-600', bg: 'bg-emerald-100', threshold: 80 },
  { value: 'medium', label: 'Medium Confidence', color: 'text-amber-600', bg: 'bg-amber-100', threshold: 50 },
  { value: 'low', label: 'Low Confidence', color: 'text-muted-foreground', bg: 'bg-muted', threshold: 0 },
] as const;

export const REPURPOSE_OPTIONS = [
  { value: 'childrens_story', label: "Children's Story", icon: 'Baby' },
  { value: 'illustrated_book', label: 'Illustrated Book', icon: 'BookMarked' },
  { value: 'audiobook', label: 'Audiobook', icon: 'Headphones' },
  { value: 'podcast', label: 'Podcast', icon: 'Mic' },
  { value: 'documentary', label: 'Documentary', icon: 'Film' },
  { value: 'timeline', label: 'Timeline', icon: 'CalendarClock' },
  { value: 'poster', label: 'Poster', icon: 'Image' },
  { value: 'instagram_carousel', label: 'Instagram Carousel', icon: 'Images' },
  { value: 'facebook_story', label: 'Facebook Story', icon: 'Share2' },
  { value: 'family_newsletter', label: 'Family Newsletter', icon: 'Newspaper' },
  { value: 'recipe_book', label: 'Recipe Book', icon: 'UtensilsCrossed' },
  { value: 'keepsake', label: 'Keepsake', icon: 'Gift' },
  { value: 'greeting_card', label: 'Greeting Card', icon: 'Mail' },
  { value: 'video', label: 'Video', icon: 'Video' },
  { value: 'slideshow', label: 'Memory Slideshow', icon: 'GalleryHorizontalEnd' },
] as const;

export const PREFERENCE_CATEGORIES = [
  { value: 'writing_style', label: 'Writing Style' },
  { value: 'image_style', label: 'Image Style' },
  { value: 'narration_voice', label: 'Narration Voice' },
  { value: 'language', label: 'Language' },
  { value: 'export_format', label: 'Export Format' },
  { value: 'template', label: 'Template' },
] as const;

export const AI_SETTING_KEYS: (keyof AISettings)[] = [
  'memory_suggestions',
  'photo_analysis',
  'ocr_enabled',
  'voice_analysis',
  'relationship_suggestions',
  'timeline_suggestions',
  'creative_recommendations',
  'content_repurposing',
  'learning_preferences',
  'intelligent_notifications',
  'face_detection_consent',
];

export const AI_SETTING_LABELS: Record<string, { label: string; description: string }> = {
  memory_suggestions: { label: 'Memory Suggestions', description: 'AI suggests missing memories, photos, and recordings based on your archive.' },
  photo_analysis: { label: 'Photo Analysis', description: 'AI can analyze photos for faces, locations, and events. Requires explicit consent.' },
  ocr_enabled: { label: 'OCR Document Processing', description: 'Extract text from uploaded documents like letters, recipe cards, and certificates.' },
  voice_analysis: { label: 'Voice Analysis', description: 'Transcribe recordings, separate speakers, and extract important quotes.' },
  relationship_suggestions: { label: 'Relationship Suggestions', description: 'AI detects likely relationships between people mentioned in your stories.' },
  timeline_suggestions: { label: 'Timeline Suggestions', description: 'AI identifies missing years and chronological gaps in your family timeline.' },
  creative_recommendations: { label: 'Creative Recommendations', description: 'AI suggests creative projects like documentaries, cookbooks, and storybooks.' },
  content_repurposing: { label: 'Content Repurposing', description: 'Transform existing content into new formats — biography to audiobook, story to video, etc.' },
  learning_preferences: { label: 'Learning Preferences', description: 'AI gradually learns your preferred writing style, image style, and narration voice.' },
  intelligent_notifications: { label: 'Intelligent Notifications', description: 'Receive contextual reminders about your archive activity.' },
  face_detection_consent: { label: 'Face Detection Consent', description: 'Explicitly allow AI to detect and suggest faces in your photographs. This is separate from general photo analysis.' },
};
