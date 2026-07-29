// Rooted Heritage Experience & Media Studio — types and constants (Phase 6)

export type HeritageCollection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  collection_type: string;
  cover_image_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type HeritageCollectionItem = {
  id: string;
  collection_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  sort_order: number;
  created_at: string;
};

export type TimeCapsule = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  recipients: string | null;
  unlock_date: string;
  notify_on_unlock: boolean;
  is_opened: boolean;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TimeCapsuleMedia = {
  id: string;
  time_capsule_id: string;
  user_id: string;
  media_type: string;
  media_url: string;
  created_at: string;
};

export type MemoryMapPin = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  pin_type: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type MemoryMapConnection = {
  id: string;
  pin_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

export type GeneratedAudio = {
  id: string;
  user_id: string;
  title: string;
  audio_type: string;
  source_entity_type: string | null;
  source_entity_id: string | null;
  source_document_id: string | null;
  narrator_voice: string;
  speaking_speed: string;
  speaking_style: string;
  emotional_tone: string;
  background_ambience: string | null;
  background_music: string | null;
  output_language: string;
  storage_path: string | null;
  public_url: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  status: 'draft' | 'ready' | 'processing' | 'error';
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
};

export type GeneratedVideo = {
  id: string;
  user_id: string;
  title: string;
  video_type: string;
  source_entity_type: string | null;
  source_entity_id: string | null;
  source_project_id: string | null;
  duration_seconds: number | null;
  theme: string;
  animation_style: string;
  transition_style: string;
  music_track: string | null;
  narration_audio_id: string | null;
  font_style: string;
  color_scheme: string;
  storage_path: string | null;
  public_url: string | null;
  thumbnail_url: string | null;
  captions: string | null;
  subtitles: string | null;
  status: 'draft' | 'ready' | 'processing' | 'error';
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
};

export type SocialAccount = {
  id: string;
  user_id: string;
  platform: string;
  account_handle: string | null;
  account_name: string | null;
  account_avatar_url: string | null;
  encrypted_token: string | null;
  token_expires_at: string | null;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  permissions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SocialPost = {
  id: string;
  user_id: string;
  platform: string;
  content: string;
  caption: string | null;
  hashtags: string[] | null;
  media_urls: string[] | null;
  media_type: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  source_audio_id: string | null;
  source_video_id: string | null;
  source_document_id: string | null;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  scheduled_for: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  privacy_reminder_shown: boolean;
  created_at: string;
  updated_at: string;
};

export type MediaLibraryItem = {
  id: string;
  user_id: string;
  title: string;
  media_category: 'text' | 'image' | 'audio' | 'video' | 'social_draft' | 'downloaded' | 'published';
  source_type: string;
  source_id: string | null;
  storage_path: string | null;
  public_url: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  alt_text: string | null;
  transcript: string | null;
  is_archived: boolean;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
};

export type AIRecommendation = {
  id: string;
  user_id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  action_label: string | null;
  action_href: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_dismissed: boolean;
  created_at: string;
};

// ============ Constants ============

export const COLLECTION_TYPES = [
  { value: 'family_recipes', label: 'Family Recipes' },
  { value: 'weddings', label: 'Weddings' },
  { value: 'birthdays', label: 'Birthdays' },
  { value: 'family_businesses', label: 'Family Businesses' },
  { value: 'military_service', label: 'Military Service' },
  { value: 'education', label: 'Education' },
  { value: 'holidays', label: 'Holidays' },
  { value: 'cultural_traditions', label: 'Cultural Traditions' },
  { value: 'family_reunions', label: 'Family Reunions' },
  { value: 'custom', label: 'Custom Collection' },
] as const;

export const PIN_TYPES = [
  { value: 'childhood_home', label: 'Childhood Home' },
  { value: 'school', label: 'School' },
  { value: 'church', label: 'Church' },
  { value: 'family_business', label: 'Family Business' },
  { value: 'ancestral_village', label: 'Ancestral Village' },
  { value: 'holiday_destination', label: 'Holiday Destination' },
  { value: 'cemetery', label: 'Cemetery' },
  { value: 'wedding_venue', label: 'Wedding Venue' },
  { value: 'workplace', label: 'Workplace' },
  { value: 'other', label: 'Other Significant Place' },
] as const;

export const AUDIO_TYPES = [
  { value: 'narrated_biography', label: 'Narrated Biography' },
  { value: 'narrated_memoir', label: 'Narrated Memoir' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'legacy_letter', label: 'Legacy Letter Read Aloud' },
  { value: 'bedtime_story', label: "Children's Bedtime Story" },
  { value: 'tribute_speech', label: 'Tribute Speech Narration' },
  { value: 'family_storytelling', label: 'Family Storytelling Session' },
  { value: 'guided_memory', label: 'Guided Memory Experience' },
  { value: 'podcast_episode', label: 'Podcast-Style Family Episode' },
] as const;

export const NARRATOR_VOICES = [
  { value: 'warm_female', label: 'Warm Female' },
  { value: 'warm_male', label: 'Warm Male' },
  { value: 'gentle_female', label: 'Gentle Female' },
  { value: 'gentle_male', label: 'Gentle Male' },
  { value: 'narrator_female', label: 'Narrator Female' },
  { value: 'narrator_male', label: 'Narrator Male' },
  { value: 'elderly_female', label: 'Elderly Female' },
  { value: 'elderly_male', label: 'Elderly Male' },
] as const;

export const SPEAKING_SPEEDS = [
  { value: 'slow', label: 'Slow & Reflective' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast & Energetic' },
] as const;

export const SPEAKING_STYLES = [
  { value: 'narrative', label: 'Narrative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'storytelling', label: 'Storytelling' },
] as const;

export const EMOTIONAL_TONES = [
  { value: 'warm', label: 'Warm' },
  { value: 'nostalgic', label: 'Nostalgic' },
  { value: 'celebratory', label: 'Celebratory' },
  { value: 'reflective', label: 'Reflective' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'respectful', label: 'Respectful' },
] as const;

export const BACKGROUND_AMBIENCES = [
  { value: 'none', label: 'No Ambience' },
  { value: 'nature', label: 'Nature Sounds' },
  { value: 'fireplace', label: 'Fireplace' },
  { value: 'rain', label: 'Gentle Rain' },
  { value: 'ocean', label: 'Ocean Waves' },
] as const;

export const BACKGROUND_MUSIC = [
  { value: 'none', label: 'No Music' },
  { value: 'acoustic', label: 'Soft Acoustic' },
  { value: 'piano', label: 'Gentle Piano' },
  { value: 'strings', label: 'Warm Strings' },
  { value: 'folk', label: 'Folk Melody' },
] as const;

export const VIDEO_TYPES = [
  { value: 'tribute', label: 'Tribute Video' },
  { value: 'documentary', label: 'Family Documentary' },
  { value: 'slideshow', label: 'Memory Slideshow' },
  { value: 'birthday', label: 'Birthday Video' },
  { value: 'wedding', label: 'Wedding Video' },
  { value: 'anniversary', label: 'Anniversary Video' },
  { value: 'reunion', label: 'Family Reunion Video' },
  { value: 'storybook', label: "Children's Animated Storybook" },
  { value: 'heritage', label: 'Heritage Documentary' },
  { value: 'holiday_recap', label: 'Holiday Recap Video' },
  { value: 'legacy', label: 'Legacy Presentation' },
] as const;

export const VIDEO_THEMES = [
  { value: 'classic', label: 'Classic' },
  { value: 'vintage', label: 'Vintage Film' },
  { value: 'modern', label: 'Modern' },
  { value: 'botanical', label: 'Botanical' },
  { value: 'warm', label: 'Warm & Cozy' },
  { value: 'elegant', label: 'Elegant' },
] as const;

export const ANIMATION_STYLES = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'ken_burns', label: 'Ken Burns' },
  { value: 'flip', label: 'Flip' },
] as const;

export const TRANSITION_STYLES = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'cut', label: 'Cut' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'wipe', label: 'Wipe' },
] as const;

export const FONT_STYLES = [
  { value: 'serif', label: 'Serif (Fraunces)' },
  { value: 'sans', label: 'Sans (Inter)' },
  { value: 'handwritten', label: 'Handwritten' },
  { value: 'classic', label: 'Classic' },
] as const;

export const COLOR_SCHEMES = [
  { value: 'warm', label: 'Warm Earthy' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'botanical', label: 'Botanical Green' },
  { value: 'rose', label: 'Soft Rose' },
] as const;

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X' },
  { value: 'threads', label: 'Threads' },
  { value: 'whatsapp', label: 'WhatsApp Status' },
] as const;

export const MEDIA_CATEGORIES = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Images' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Videos' },
  { value: 'social_draft', label: 'Social Media Drafts' },
  { value: 'downloaded', label: 'Downloaded Files' },
  { value: 'published', label: 'Published Content' },
] as const;

export const MEMORY_TO_MEDIA_OPTIONS = [
  { value: 'story', label: 'Story', icon: 'BookOpen' },
  { value: 'biography', label: 'Biography', icon: 'User' },
  { value: 'childrens_story', label: "Children's Story", icon: 'Baby' },
  { value: 'illustration', label: 'Illustration', icon: 'Palette' },
  { value: 'poster', label: 'Poster', icon: 'Image' },
  { value: 'greeting_card', label: 'Greeting Card', icon: 'Mail' },
  { value: 'audiobook', label: 'Audiobook', icon: 'Headphones' },
  { value: 'narrated_story', label: 'Narrated Story', icon: 'Mic' },
  { value: 'documentary', label: 'Documentary', icon: 'Film' },
  { value: 'slideshow', label: 'Slideshow', icon: 'GalleryHorizontalEnd' },
  { value: 'video', label: 'Video', icon: 'Video' },
  { value: 'quote_card', label: 'Quote Card', icon: 'Quote' },
  { value: 'printable_keepsake', label: 'Printable Keepsake', icon: 'Gift' },
  { value: 'timeline_page', label: 'Timeline Page', icon: 'CalendarClock' },
] as const;
