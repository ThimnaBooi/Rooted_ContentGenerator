import { supabase } from '@/lib/supabase-client';
import { logActivity } from '@/lib/queries';
import type {
  HeritageCollection,
  HeritageCollectionItem,
  TimeCapsule,
  TimeCapsuleMedia,
  MemoryMapPin,
  MemoryMapConnection,
  GeneratedAudio,
  GeneratedVideo,
  SocialAccount,
  SocialPost,
  MediaLibraryItem,
  AIRecommendation,
} from '@/lib/media-types';

// ---------- Heritage Collections ----------
export async function getHeritageCollections(): Promise<HeritageCollection[]> {
  const { data, error } = await supabase
    .from('heritage_collections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createHeritageCollection(input: {
  name: string;
  description?: string;
  collectionType?: string;
}): Promise<HeritageCollection> {
  const { data, error } = await supabase
    .from('heritage_collections')
    .insert({
      name: input.name,
      description: input.description ?? null,
      collection_type: input.collectionType ?? 'custom',
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity('created', 'heritage_collection', data.id, data.name);
  return data;
}

export async function deleteHeritageCollection(id: string): Promise<void> {
  const { error } = await supabase.from('heritage_collections').delete().eq('id', id);
  if (error) throw error;
}

export async function getCollectionItems(collectionId: string): Promise<HeritageCollectionItem[]> {
  const { data, error } = await supabase
    .from('heritage_collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addCollectionItem(input: {
  collectionId: string;
  entityType: string;
  entityId: string;
}): Promise<void> {
  const { error } = await supabase.from('heritage_collection_items').insert({
    collection_id: input.collectionId,
    entity_type: input.entityType,
    entity_id: input.entityId,
  });
  if (error) throw error;
}

export async function removeCollectionItem(id: string): Promise<void> {
  const { error } = await supabase.from('heritage_collection_items').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Time Capsules ----------
export async function getTimeCapsules(): Promise<TimeCapsule[]> {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .order('unlock_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTimeCapsule(input: {
  title: string;
  message?: string;
  recipients?: string;
  unlockDate: string;
  notifyOnUnlock?: boolean;
}): Promise<TimeCapsule> {
  const { data, error } = await supabase
    .from('time_capsules')
    .insert({
      title: input.title,
      message: input.message ?? null,
      recipients: input.recipients ?? null,
      unlock_date: input.unlockDate,
      notify_on_unlock: input.notifyOnUnlock ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity('created', 'time_capsule', data.id, data.title);
  return data;
}

export async function deleteTimeCapsule(id: string): Promise<void> {
  const { error } = await supabase.from('time_capsules').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Memory Map Pins ----------
export async function getMemoryMapPins(): Promise<MemoryMapPin[]> {
  const { data, error } = await supabase
    .from('memory_map_pins')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMemoryMapPin(input: {
  name: string;
  description?: string;
  pinType?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}): Promise<MemoryMapPin> {
  const { data, error } = await supabase
    .from('memory_map_pins')
    .insert({
      name: input.name,
      description: input.description ?? null,
      pin_type: input.pinType ?? 'other',
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity('created', 'map_pin', data.id, data.name);
  return data;
}

export async function deleteMemoryMapPin(id: string): Promise<void> {
  const { error } = await supabase.from('memory_map_pins').delete().eq('id', id);
  if (error) throw error;
}

export async function getPinConnections(pinId: string): Promise<MemoryMapConnection[]> {
  const { data, error } = await supabase
    .from('memory_map_connections')
    .select('*')
    .eq('pin_id', pinId);
  if (error) throw error;
  return data ?? [];
}

// ---------- Generated Audio ----------
export async function getGeneratedAudio(): Promise<GeneratedAudio[]> {
  const { data, error } = await supabase
    .from('generated_audio')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGeneratedAudio(input: {
  title: string;
  audioType: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceDocumentId?: string;
  narratorVoice?: string;
  speakingSpeed?: string;
  speakingStyle?: string;
  emotionalTone?: string;
  backgroundAmbience?: string;
  backgroundMusic?: string;
  outputLanguage?: string;
}): Promise<GeneratedAudio> {
  const { data, error } = await supabase
    .from('generated_audio')
    .insert({
      title: input.title,
      audio_type: input.audioType,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      source_document_id: input.sourceDocumentId ?? null,
      narrator_voice: input.narratorVoice ?? 'warm_female',
      speaking_speed: input.speakingSpeed ?? 'normal',
      speaking_style: input.speakingStyle ?? 'narrative',
      emotional_tone: input.emotionalTone ?? 'warm',
      background_ambience: input.backgroundAmbience ?? null,
      background_music: input.backgroundMusic ?? null,
      output_language: input.outputLanguage ?? 'en',
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity('generated', 'audio', data.id, data.title);
  return data;
}

export async function updateGeneratedAudio(id: string, input: Partial<GeneratedAudio>): Promise<GeneratedAudio> {
  const { data, error } = await supabase
    .from('generated_audio')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGeneratedAudio(id: string): Promise<void> {
  const { data: audio } = await supabase
    .from('generated_audio')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (audio?.storage_path) {
    await supabase.storage.from('voice').remove([audio.storage_path]);
  }
  const { error } = await supabase.from('generated_audio').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleAudioFavourite(id: string, fav: boolean): Promise<void> {
  const { error } = await supabase
    .from('generated_audio')
    .update({ is_favourite: fav })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Generated Videos ----------
export async function getGeneratedVideos(): Promise<GeneratedVideo[]> {
  const { data, error } = await supabase
    .from('generated_videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGeneratedVideo(input: {
  title: string;
  videoType: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceProjectId?: string;
  theme?: string;
  animationStyle?: string;
  transitionStyle?: string;
  musicTrack?: string;
  narrationAudioId?: string;
  fontStyle?: string;
  colorScheme?: string;
}): Promise<GeneratedVideo> {
  const { data, error } = await supabase
    .from('generated_videos')
    .insert({
      title: input.title,
      video_type: input.videoType,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      source_project_id: input.sourceProjectId ?? null,
      theme: input.theme ?? 'classic',
      animation_style: input.animationStyle ?? 'fade',
      transition_style: input.transitionStyle ?? 'smooth',
      music_track: input.musicTrack ?? null,
      narration_audio_id: input.narrationAudioId ?? null,
      font_style: input.fontStyle ?? 'serif',
      color_scheme: input.colorScheme ?? 'warm',
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity('generated', 'video', data.id, data.title);
  return data;
}

export async function updateGeneratedVideo(id: string, input: Partial<GeneratedVideo>): Promise<GeneratedVideo> {
  const { data, error } = await supabase
    .from('generated_videos')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGeneratedVideo(id: string): Promise<void> {
  const { data: video } = await supabase
    .from('generated_videos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (video?.storage_path) {
    await supabase.storage.from('documents').remove([video.storage_path]);
  }
  const { error } = await supabase.from('generated_videos').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleVideoFavourite(id: string, fav: boolean): Promise<void> {
  const { error } = await supabase
    .from('generated_videos')
    .update({ is_favourite: fav })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Social Accounts ----------
export async function getSocialAccounts(): Promise<SocialAccount[]> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function connectSocialAccount(input: {
  platform: string;
  accountHandle?: string;
  accountName?: string;
  accountAvatarUrl?: string;
  encryptedToken?: string;
  tokenExpiresAt?: string;
}): Promise<SocialAccount> {
  const { data, error } = await supabase
    .from('social_accounts')
    .upsert({
      platform: input.platform,
      account_handle: input.accountHandle ?? null,
      account_name: input.accountName ?? null,
      account_avatar_url: input.accountAvatarUrl ?? null,
      encrypted_token: input.encryptedToken ?? null,
      token_expires_at: input.tokenExpiresAt ?? null,
      status: 'connected',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function disconnectSocialAccount(platform: string): Promise<void> {
  const { error } = await supabase
    .from('social_accounts')
    .update({ status: 'disconnected', encrypted_token: null })
    .eq('platform', platform);
  if (error) throw error;
}

export async function deleteSocialAccount(id: string): Promise<void> {
  const { error } = await supabase.from('social_accounts').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Social Posts ----------
export async function getSocialPosts(): Promise<SocialPost[]> {
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSocialPost(input: {
  platform: string;
  content: string;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  mediaType?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceAudioId?: string;
  sourceVideoId?: string;
  sourceDocumentId?: string;
  status?: string;
  scheduledFor?: string;
  privacyReminderShown?: boolean;
}): Promise<SocialPost> {
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      platform: input.platform,
      content: input.content,
      caption: input.caption ?? null,
      hashtags: input.hashtags ?? null,
      media_urls: input.mediaUrls ?? null,
      media_type: input.mediaType ?? null,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      source_audio_id: input.sourceAudioId ?? null,
      source_video_id: input.sourceVideoId ?? null,
      source_document_id: input.sourceDocumentId ?? null,
      status: input.status ?? 'draft',
      scheduled_for: input.scheduledFor ?? null,
      privacy_reminder_shown: input.privacyReminderShown ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSocialPost(id: string, input: Partial<SocialPost>): Promise<SocialPost> {
  const { data, error } = await supabase
    .from('social_posts')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSocialPost(id: string): Promise<void> {
  const { error } = await supabase.from('social_posts').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Media Library ----------
export async function getMediaLibraryItems(category?: string): Promise<MediaLibraryItem[]> {
  let q = supabase.from('media_library_items').select('*').order('created_at', { ascending: false });
  if (category) q = q.eq('media_category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createMediaLibraryItem(input: {
  title: string;
  mediaCategory: string;
  sourceType: string;
  sourceId?: string;
  storagePath?: string;
  publicUrl?: string;
  altText?: string;
  transcript?: string;
}): Promise<MediaLibraryItem> {
  const { data, error } = await supabase
    .from('media_library_items')
    .insert({
      title: input.title,
      media_category: input.mediaCategory,
      source_type: input.sourceType,
      source_id: input.sourceId ?? null,
      storage_path: input.storagePath ?? null,
      public_url: input.publicUrl ?? null,
      alt_text: input.altText ?? null,
      transcript: input.transcript ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMediaLibraryItem(id: string, input: Partial<MediaLibraryItem>): Promise<MediaLibraryItem> {
  const { data, error } = await supabase
    .from('media_library_items')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMediaLibraryItem(id: string): Promise<void> {
  const { data: item } = await supabase
    .from('media_library_items')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (item?.storage_path) {
    await supabase.storage.from('documents').remove([item.storage_path]);
  }
  const { error } = await supabase.from('media_library_items').delete().eq('id', id);
  if (error) throw error;
}

// ---------- AI Recommendations ----------
export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function dismissAIRecommendation(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_recommendations')
    .update({ is_dismissed: true })
    .eq('id', id);
  if (error) throw error;
}

export async function generateRecommendations(
  counts: { people: number; memories: number; photos: number; recipes: number; traditions: number; events: number; documents: number; voice: number }
): Promise<void> {
  const recs: { type: string; title: string; description: string; actionLabel: string; actionHref: string }[] = [];

  if (counts.memories >= 10) {
    recs.push({
      type: 'documentary',
      title: 'You have enough memories to create a documentary',
      description: `With ${counts.memories} preserved memories, the AI can weave them into a beautiful family documentary video.`,
      actionLabel: 'Create Documentary',
      actionHref: '/app/studio/create-video',
    });
  }
  if (counts.people >= 1 && counts.memories >= 5) {
    recs.push({
      type: 'audiobook',
      title: 'This biography would make a beautiful narrated audiobook',
      description: 'Turn a family member\'s biography into a professionally narrated audiobook.',
      actionLabel: 'Create Audiobook',
      actionHref: '/app/studio/create-audio',
    });
  }
  if (counts.recipes >= 5) {
    recs.push({
      type: 'cookbook',
      title: 'These family recipes could become a professionally designed cookbook',
      description: `With ${counts.recipes} recipes preserved, you can create a stunning family recipe book.`,
      actionLabel: 'Create Recipe Book',
      actionHref: '/app/studio/create?type=recipe_book',
    });
  }
  if (counts.photos >= 20) {
    recs.push({
      type: 'slideshow',
      title: "You've preserved enough photographs for a memory slideshow",
      description: `With ${counts.photos} photos, the AI can create a beautiful slideshow video set to music.`,
      actionLabel: 'Create Slideshow',
      actionHref: '/app/studio/create-video',
    });
  }

  for (const rec of recs) {
    const { data: existing } = await supabase
      .from('ai_recommendations')
      .select('id')
      .eq('recommendation_type', rec.type)
      .eq('is_dismissed', false)
      .maybeSingle();
    if (!existing) {
      await supabase.from('ai_recommendations').insert({
        recommendation_type: rec.type,
        title: rec.title,
        description: rec.description,
        action_label: rec.actionLabel,
        action_href: rec.actionHref,
      });
    }
  }
}
