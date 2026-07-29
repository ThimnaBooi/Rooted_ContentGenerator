import { supabase } from '@/lib/supabase-client';
import { logActivity } from '@/lib/queries';
import type {
  AISettings,
  AITask,
  AISuggestion,
  AIPreference,
  AIJobHistory,
  DuplicateReview,
  RelationshipSuggestion,
  TimelineGap,
  OCRResult,
  VoiceTranscript,
  PhotoAnalysis,
  ArchiveHealth,
  FamilyInsights,
  IntelligentNotification,
} from '@/lib/ai-types';

// ---------- AI Settings ----------
export async function getAISettings(): Promise<AISettings | null> {
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAISettings(
  input: Partial<AISettings>
): Promise<AISettings> {
  const { data: existing } = await supabase
    .from('ai_settings')
    .select('id')
    .maybeSingle();
  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('ai_settings')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from('ai_settings')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    result = data;
  }
  return result;
}

export async function resetAIPreferences(): Promise<void> {
  const { error } = await supabase.from('ai_preferences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// ---------- AI Tasks ----------
export async function getAITasks(status?: string): Promise<AITask[]> {
  let q = supabase.from('ai_tasks').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createAITask(input: {
  taskType: string;
  inputData?: Record<string, unknown>;
}): Promise<AITask> {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      task_type: input.taskType,
      input_data: input.inputData ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAITask(
  id: string,
  input: Partial<AITask>
): Promise<AITask> {
  const { data, error } = await supabase
    .from('ai_tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAITask(id: string): Promise<void> {
  const { error } = await supabase.from('ai_tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function cancelAITask(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_tasks')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}

export async function retryAITask(id: string): Promise<AITask> {
  const { data, error } = await supabase
    .from('ai_tasks')
    .update({ status: 'pending', retry_count: 0, error_message: null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- AI Job History ----------
export async function getAIJobHistory(limit = 50): Promise<AIJobHistory[]> {
  const { data, error } = await supabase
    .from('ai_job_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function deleteAIJobHistory(id: string): Promise<void> {
  const { error } = await supabase.from('ai_job_history').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAIJobHistory(): Promise<void> {
  const { error } = await supabase.from('ai_job_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// ---------- AI Suggestions ----------
export async function getAISuggestions(status?: string): Promise<AISuggestion[]> {
  let q = supabase.from('ai_suggestions').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createAISuggestion(input: {
  suggestionType: string;
  title: string;
  description?: string;
  explanation?: string;
  confidence?: string;
  confidenceScore?: number;
  entityType?: string;
  entityId?: string;
  actionLabel?: string;
  actionHref?: string;
  metadata?: Record<string, unknown>;
}): Promise<AISuggestion> {
  const { data, error } = await supabase
    .from('ai_suggestions')
    .insert({
      suggestion_type: input.suggestionType,
      title: input.title,
      description: input.description ?? null,
      explanation: input.explanation ?? null,
      confidence: input.confidence ?? 'medium',
      confidence_score: input.confidenceScore ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      action_label: input.actionLabel ?? null,
      action_href: input.actionHref ?? null,
      metadata: input.metadata ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSuggestionStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_suggestions')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function dismissAISuggestion(id: string): Promise<void> {
  await updateSuggestionStatus(id, 'dismissed');
}

export async function acceptAISuggestion(id: string): Promise<void> {
  await updateSuggestionStatus(id, 'accepted');
}

export async function reviewLaterAISuggestion(id: string): Promise<void> {
  await updateSuggestionStatus(id, 'review_later');
}

// ---------- AI Preferences ----------
export async function getAIPreferences(): Promise<AIPreference[]> {
  const { data, error } = await supabase
    .from('ai_preferences')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertAIPreference(input: {
  preferenceKey: string;
  preferenceValue: string;
  preferenceCategory: string;
  confidenceScore?: number;
}): Promise<void> {
  const { data: existing } = await supabase
    .from('ai_preferences')
    .select('id, times_observed')
    .eq('preference_key', input.preferenceKey)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('ai_preferences')
      .update({
        preference_value: input.preferenceValue,
        confidence_score: input.confidenceScore ?? 50,
        times_observed: (existing.times_observed ?? 0) + 1,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('ai_preferences').insert({
      preference_key: input.preferenceKey,
      preference_value: input.preferenceValue,
      preference_category: input.preferenceCategory,
      confidence_score: input.confidenceScore ?? 50,
    });
  }
}

export async function deleteAIPreference(id: string): Promise<void> {
  const { error } = await supabase.from('ai_preferences').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Duplicate Reviews ----------
export async function getDuplicateReviews(status?: string): Promise<DuplicateReview[]> {
  let q = supabase.from('duplicate_reviews').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateDuplicateReviewStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('duplicate_reviews')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDuplicateReview(id: string): Promise<void> {
  const { error } = await supabase.from('duplicate_reviews').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Relationship Suggestions ----------
export async function getRelationshipSuggestions(status?: string): Promise<RelationshipSuggestion[]> {
  let q = supabase.from('relationship_suggestions').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateRelationshipSuggestionStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('relationship_suggestions')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRelationshipSuggestion(id: string): Promise<void> {
  const { error } = await supabase.from('relationship_suggestions').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Timeline Gaps ----------
export async function getTimelineGaps(status?: string): Promise<TimelineGap[]> {
  let q = supabase.from('timeline_gaps').select('*').order('gap_start_year', { ascending: true });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateTimelineGapStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('timeline_gaps')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTimelineGap(id: string): Promise<void> {
  const { error } = await supabase.from('timeline_gaps').delete().eq('id', id);
  if (error) throw error;
}

// ---------- OCR Results ----------
export async function getOCRResults(status?: string): Promise<OCRResult[]> {
  let q = supabase.from('ocr_results').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateOCRResult(
  id: string,
  input: Partial<OCRResult>
): Promise<OCRResult> {
  const { data, error } = await supabase
    .from('ocr_results')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOCRResult(id: string): Promise<void> {
  const { error } = await supabase.from('ocr_results').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Voice Transcripts ----------
export async function getVoiceTranscripts(status?: string): Promise<VoiceTranscript[]> {
  let q = supabase.from('voice_transcripts').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateVoiceTranscript(
  id: string,
  input: Partial<VoiceTranscript>
): Promise<VoiceTranscript> {
  const { data, error } = await supabase
    .from('voice_transcripts')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVoiceTranscript(id: string): Promise<void> {
  const { error } = await supabase.from('voice_transcripts').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Photo Analysis ----------
export async function getPhotoAnalyses(status?: string): Promise<PhotoAnalysis[]> {
  let q = supabase.from('photo_analysis').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updatePhotoAnalysis(
  id: string,
  input: Partial<PhotoAnalysis>
): Promise<PhotoAnalysis> {
  const { data, error } = await supabase
    .from('photo_analysis')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePhotoAnalysis(id: string): Promise<void> {
  const { error } = await supabase.from('photo_analysis').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Archive Health ----------
export async function getArchiveHealth(): Promise<ArchiveHealth | null> {
  const { data, error } = await supabase
    .from('archive_health')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteArchiveHealth(): Promise<void> {
  const { error } = await supabase.from('archive_health').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// ---------- Family Insights ----------
export async function getFamilyInsights(): Promise<FamilyInsights | null> {
  const { data, error } = await supabase
    .from('family_insights')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteFamilyInsights(): Promise<void> {
  const { error } = await supabase.from('family_insights').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// ---------- Intelligent Notifications ----------
export async function getIntelligentNotifications(unreadOnly = false): Promise<IntelligentNotification[]> {
  let q = supabase.from('intelligent_notifications').select('*').order('created_at', { ascending: false });
  if (unreadOnly) q = q.eq('is_read', false).eq('is_dismissed', false);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('intelligent_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function dismissNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('intelligent_notifications')
    .update({ is_dismissed: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('intelligent_notifications')
    .update({ is_read: true })
    .eq('is_read', false);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('intelligent_notifications').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Archive Q&A (semantic search via edge function) ----------
export async function askArchiveAssistant(
  query: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  sessionAccessToken: string | undefined
): Promise<{ answer: string; references: { type: string; id: string; title: string; href: string }[] } | { error: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionAccessToken ?? supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { error: errBody.error ?? `Request failed (${res.status})` };
    }
    const body = await res.json();
    if (body.error) return { error: body.error };
    return {
      answer: body.answer ?? '',
      references: body.references ?? [],
    };
  } catch {
    return { error: 'Could not reach the AI assistant. Please try again.' };
  }
}

// ---------- AI Analysis (edge function) ----------
export async function triggerAIAnalysis(
  taskType: string,
  inputData: Record<string, unknown>,
  supabaseUrl: string,
  supabaseAnonKey: string,
  sessionAccessToken: string | undefined
): Promise<{ taskId: string; status: string; result?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionAccessToken ?? supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ taskType, inputData }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { taskId: '', status: 'failed', error: errBody.error ?? `Request failed (${res.status})` };
    }
    const body = await res.json();
    return {
      taskId: body.taskId ?? '',
      status: body.status ?? 'completed',
      result: body.result,
      error: body.error,
    };
  } catch {
    return { taskId: '', status: 'failed', error: 'Could not reach the AI analysis service.' };
  }
}
