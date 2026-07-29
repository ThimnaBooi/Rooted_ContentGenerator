import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOG_PREFIX = "[generate-audio]";

function log(step: string, message: string, data?: unknown) {
  const ts = new Date().toISOString();
  if (data !== undefined) {
    console.log(`${ts} ${LOG_PREFIX} ${step}: ${message}`, JSON.stringify(data));
  } else {
    console.log(`${ts} ${LOG_PREFIX} ${step}: ${message}`);
  }
}

function errorResponse(message: string, status: number, step: string) {
  log("ERROR", `${step}: ${message}`);
  return new Response(
    JSON.stringify({ error: message, step }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Map the app's voice names to OpenAI TTS voice names
const VOICE_MAP: Record<string, string> = {
  warm_female: "nova",
  warm_male: "onyx",
  gentle_female: "shimmer",
  gentle_male: "echo",
  narrator_female: "alloy",
  narrator_male: "onyx",
  elderly_female: "shimmer",
  elderly_male: "fable",
};

// Map speaking speed to TTS speed multiplier
const SPEED_MAP: Record<string, number> = {
  slow: 0.85,
  normal: 1.0,
  fast: 1.15,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    log("START", "Audio generation request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return errorResponse("Server is missing required configuration. Please contact support.", 500, "env-check");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Authentication required. Please sign in and try again.", 401, "auth");
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData.user) {
      log("AUTH", "Authentication failed", { authError });
      return errorResponse("Your session has expired. Please sign in again.", 401, "auth");
    }

    const userId = userData.user.id;
    log("AUTH", `Authenticated user: ${userId}`);

    const body = await req.json();
    const { audioId, title, audioType, narratorVoice, speakingSpeed, speakingStyle, emotionalTone, outputLanguage, sourceText } = body;

    if (!audioId) {
      return errorResponse("Audio ID is required.", 400, "validation");
    }
    if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
      return errorResponse("Source text is required to generate audio. Please provide text content.", 400, "validation");
    }

    log("VALIDATION", "Request validated", { audioId, audioType, narratorVoice, textLength: sourceText.length });

    // Verify the audio record belongs to this user
    const { data: audioRecord, error: dbError } = await supabase
      .from("generated_audio")
      .select("*")
      .eq("id", audioId)
      .maybeSingle();

    if (dbError) {
      log("DB", "Failed to fetch audio record", { dbError });
      return errorResponse("Could not find the audio project. Please refresh and try again.", 500, "db-fetch");
    }
    if (!audioRecord) {
      return errorResponse("Audio project not found. It may have been deleted.", 404, "db-fetch");
    }
    if (audioRecord.user_id !== userId) {
      return errorResponse("You don't have permission to generate this audio.", 403, "auth");
    }

    log("DB", "Audio record verified", { audioId, status: audioRecord.status });

    // Update status to processing
    await supabase.from("generated_audio").update({ status: "processing" }).eq("id", audioId);

    // Check for OpenAI API key
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      await supabase.from("generated_audio").update({ status: "error" }).eq("id", audioId);
      log("CONFIG", "OPENAI_API_KEY not configured");
      return errorResponse(
        "AI audio generation is not yet configured on this server. The audio project has been saved — you can generate it once the feature is enabled.",
        503,
        "config"
      );
    }

    // Build the text to be spoken — prepend a context-aware intro
    const typeLabel = audioType ? audioType.replace(/_/g, " ") : "family story";
    const toneInstruction = emotionalTone ? `Read in a ${emotionalTone} tone.` : "";
    const styleInstruction = speakingStyle ? `Speaking style: ${speakingStyle}.` : "";

    // Clean up the source text — strip HTML tags if present
    const cleanText = sourceText
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    // TTS has a ~4096 character limit per request, so chunk if needed
    const MAX_CHARS = 4000;
    const chunks: string[] = [];
    if (cleanText.length <= MAX_CHARS) {
      chunks.push(cleanText);
    } else {
      let remaining = cleanText;
      while (remaining.length > MAX_CHARS) {
        let splitIdx = remaining.lastIndexOf(".", MAX_CHARS);
        if (splitIdx < MAX_CHARS * 0.5) splitIdx = remaining.lastIndexOf(" ", MAX_CHARS);
        if (splitIdx < MAX_CHARS * 0.5) splitIdx = MAX_CHARS;
        chunks.push(remaining.slice(0, splitIdx + 1));
        remaining = remaining.slice(splitIdx + 1).trim();
      }
      if (remaining.length > 0) chunks.push(remaining);
    }

    log("TTS", `Generating speech for ${chunks.length} chunk(s)`, { totalLength: cleanText.length });

    const ttsVoice = VOICE_MAP[narratorVoice] || "nova";
    const ttsSpeed = SPEED_MAP[speakingSpeed] || 1.0;

    // Generate audio for each chunk
    const audioBuffers: Uint8Array[] = [];

    for (let i = 0; i < chunks.length; i++) {
      log("TTS", `Processing chunk ${i + 1}/${chunks.length}`, { chunkLength: chunks[i].length });

      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: ttsVoice,
          input: chunks[i],
          speed: ttsSpeed,
          response_format: "mp3",
        }),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        log("TTS", `OpenAI TTS API error for chunk ${i + 1}`, { status: ttsResponse.status, errText });
        await supabase.from("generated_audio").update({ status: "error" }).eq("id", audioId);
        let userMessage = "The AI audio service returned an error.";
        if (ttsResponse.status === 429) userMessage = "The AI audio service is busy right now. Please wait a moment and try again.";
        else if (ttsResponse.status >= 500) userMessage = "The AI audio service is temporarily unavailable. Please try again shortly.";
        return errorResponse(userMessage, 502, "tts-api");
      }

      const audioBuffer = new Uint8Array(await ttsResponse.arrayBuffer());
      audioBuffers.push(audioBuffer);
      log("TTS", `Chunk ${i + 1} received`, { bytes: audioBuffer.length });
    }

    // Combine all chunks into a single buffer
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      combinedBuffer.set(buf, offset);
      offset += buf.length;
    }

    log("TTS", "All chunks combined", { totalBytes: totalLength });

    // Upload to Supabase Storage
    const storagePath = `${userId}/${audioId}.mp3`;

    log("STORAGE", "Uploading to Supabase Storage", { bucket: "voice", path: storagePath });

    const { error: uploadError } = await supabase.storage
      .from("voice")
      .upload(storagePath, combinedBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      log("STORAGE", "Upload failed", { uploadError });
      await supabase.from("generated_audio").update({ status: "error" }).eq("id", audioId);
      return errorResponse("The audio was generated but could not be saved to storage. Please try again.", 500, "storage-upload");
    }

    log("STORAGE", "Upload successful");

    // Create a signed URL (voice bucket is private)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("voice")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (signedUrlError || !signedUrlData) {
      log("STORAGE", "Could not create signed URL", { signedUrlError });
      await supabase.from("generated_audio").update({ status: "error" }).eq("id", audioId);
      return errorResponse("The audio was saved but the URL could not be generated. Please contact support.", 500, "storage-url");
    }

    const publicUrl = signedUrlData.signedUrl;
    log("STORAGE", "Signed URL generated");

    // Estimate duration (~1.5 seconds per 100 characters at normal speed)
    const estimatedDuration = Math.round((cleanText.length / 100) * 1.5 / (ttsSpeed || 1));

    // Update the audio record
    const { error: updateError } = await supabase
      .from("generated_audio")
      .update({
        storage_path: storagePath,
        public_url: publicUrl,
        duration_seconds: estimatedDuration,
        transcript: cleanText,
        status: "ready",
      })
      .eq("id", audioId);

    if (updateError) {
      log("DB", "Failed to update audio record", { updateError });
      return errorResponse("The audio was generated and saved, but the database record could not be updated. Please refresh the page.", 500, "db-update");
    }

    log("DB", "Audio record updated to 'ready'");

    // Create a Media Library entry
    const { error: mediaError } = await supabase.from("media_library_items").insert({
      user_id: userId,
      title: title || audioRecord.title,
      media_category: "audio",
      source_type: "generated_audio",
      source_id: audioId,
      storage_path: storagePath,
      public_url: publicUrl,
      transcript: cleanText.slice(0, 5000),
    });

    if (mediaError) {
      log("DB", "Failed to create Media Library entry (non-fatal)", { mediaError });
    } else {
      log("DB", "Media Library entry created");
    }

    // Log to AI job history
    const duration = Math.round((Date.now() - startTime) / 1000);
    await supabase.from("ai_job_history").insert({
      user_id: userId,
      task_type: "audio_generation",
      task_title: title || audioRecord.title,
      status: "completed",
      input_summary: cleanText.slice(0, 200),
      output_summary: `Audio generated (${estimatedDuration}s, ${totalLength} bytes)`,
      duration_seconds: duration,
    });

    log("COMPLETE", `Audio generation complete in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        audioId,
        publicUrl,
        storagePath,
        durationSeconds: estimatedDuration,
        duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(`${LOG_PREFIX} UNCAUGHT ERROR:`, err);
    return errorResponse(
      "An unexpected error occurred while generating the audio. Please try again.",
      500,
      "uncaught"
    );
  }
});
