import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOG_PREFIX = "[generate-image]";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    log("START", "Image generation request received");

    // --- 1. Authenticate ---
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

    // --- 2. Parse and validate request body ---
    const body = await req.json();
    const { imageId, prompt, style, imageType, sourcePhotoUrl } = body;

    if (!imageId) {
      return errorResponse("Image ID is required.", 400, "validation");
    }
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return errorResponse("A prompt is required to generate an image. Please describe what you'd like to create.", 400, "validation");
    }

    log("VALIDATION", "Request validated", { imageId, promptLength: prompt.length, style, imageType });

    // --- 3. Verify the image record belongs to this user ---
    const { data: imageRecord, error: dbError } = await supabase
      .from("studio_images")
      .select("*")
      .eq("id", imageId)
      .maybeSingle();

    if (dbError) {
      log("DB", "Failed to fetch image record", { dbError });
      return errorResponse("Could not find the image project. Please refresh and try again.", 500, "db-fetch");
    }
    if (!imageRecord) {
      return errorResponse("Image project not found. It may have been deleted.", 404, "db-fetch");
    }
    if (imageRecord.user_id !== userId) {
      log("AUTH", "User does not own this image record", { imageRecordUserId: imageRecord.user_id, requestUserId: userId });
      return errorResponse("You don't have permission to generate this image.", 403, "auth");
    }

    log("DB", "Image record verified", { imageId, status: imageRecord.status });

    // --- 4. Update status to processing ---
    const { error: statusUpdateError } = await supabase
      .from("studio_images")
      .update({ status: "processing" })
      .eq("id", imageId);

    if (statusUpdateError) {
      log("DB", "Could not update status to processing", { statusUpdateError });
    }

    // --- 5. Check for OpenAI API key ---
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      // Revert status and return a clear message
      await supabase.from("studio_images").update({ status: "draft" }).eq("id", imageId);
      log("CONFIG", "OPENAI_API_KEY not configured");
      return errorResponse(
        "AI image generation is not yet configured on this server. The image project has been saved — you can generate it once the feature is enabled.",
        503,
        "config"
      );
    }

    // --- 6. Build the DALL-E prompt ---
    const typeLabel = imageType ? imageType.replace(/_/g, " ") : "family heritage artwork";
    const fullPrompt = [
      `Create a ${typeLabel}.`,
      prompt.trim(),
      style ? `Artistic style: ${style}.` : "",
      "Warm, elegant, respectful tone suitable for a family heritage archive.",
    ].filter(Boolean).join(" ");

    log("PROMPT", "Built DALL-E prompt", { fullPrompt: fullPrompt.slice(0, 200) });

    // --- 7. Call DALL-E API ---
    log("OPENAI", "Calling DALL-E 3 API...");
    const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      log("OPENAI", "DALL-E API returned error", { status: aiResponse.status, errText });

      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);

      let userMessage = "The AI image service returned an error.";
      if (aiResponse.status === 429) userMessage = "The AI image service is busy right now. Please wait a moment and try again.";
      else if (aiResponse.status === 400) userMessage = "The prompt was rejected by the AI. Please rephrase your description and try again.";
      else if (aiResponse.status >= 500) userMessage = "The AI image service is temporarily unavailable. Please try again shortly.";

      return errorResponse(userMessage, 502, "openai-api");
    }

    const aiData = await aiResponse.json();
    const b64Image = aiData.data?.[0]?.b64_json;
    const revisedPrompt = aiData.data?.[0]?.revised_prompt;

    if (!b64Image) {
      log("OPENAI", "DALL-E returned no image data");
      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);
      return errorResponse("The AI image service returned an empty result. Please try again.", 502, "openai-parse");
    }

    log("OPENAI", "DALL-E image received", { revisedPrompt: revisedPrompt?.slice(0, 100) });

    // --- 8. Upload to Supabase Storage ---
    const imageBuffer = Uint8Array.from(atob(b64Image), (c) => c.charCodeAt(0));
    const storagePath = `${userId}/${imageId}.png`;

    log("STORAGE", "Uploading to Supabase Storage", { bucket: "photos", path: storagePath });

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      log("STORAGE", "Upload failed", { uploadError });
      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);
      return errorResponse("The image was generated but could not be saved to storage. Please try again.", 500, "storage-upload");
    }

    log("STORAGE", "Upload successful");

    // --- 9. Get the public URL ---
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    if (!publicUrl) {
      log("STORAGE", "Could not get public URL");
      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);
      return errorResponse("The image was saved but the URL could not be generated. Please contact support.", 500, "storage-url");
    }

    log("STORAGE", "Public URL generated", { publicUrl: publicUrl.slice(0, 80) });

    // --- 10. Update the studio_images record ---
    const { error: updateError } = await supabase
      .from("studio_images")
      .update({
        storage_path: storagePath,
        public_url: publicUrl,
        status: "ready",
        prompt: revisedPrompt ? `${prompt}\n\n[AI-revised prompt: ${revisedPrompt}]` : prompt,
      })
      .eq("id", imageId);

    if (updateError) {
      log("DB", "Failed to update image record", { updateError });
      return errorResponse("The image was generated and saved, but the database record could not be updated. Please refresh the page.", 500, "db-update");
    }

    log("DB", "Image record updated to 'ready'");

    // --- 11. Create a Media Library entry ---
    const { error: mediaError } = await supabase.from("media_library_items").insert({
      user_id: userId,
      title: imageRecord.title,
      media_category: "image",
      source_type: "studio_image",
      source_id: imageId,
      storage_path: storagePath,
      public_url: publicUrl,
      alt_text: prompt.slice(0, 200),
    });

    if (mediaError) {
      log("DB", "Failed to create Media Library entry (non-fatal)", { mediaError });
    } else {
      log("DB", "Media Library entry created");
    }

    // --- 12. Log to AI job history ---
    const duration = Math.round((Date.now() - startTime) / 1000);
    await supabase.from("ai_job_history").insert({
      user_id: userId,
      task_type: "image_generation",
      task_title: imageRecord.title,
      status: "completed",
      input_summary: prompt.slice(0, 200),
      output_summary: `Image generated and saved to storage (${duration}s)`,
      duration_seconds: duration,
    });

    log("COMPLETE", `Image generation complete in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        imageId,
        publicUrl,
        storagePath,
        revisedPrompt: revisedPrompt ?? null,
        duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(`${LOG_PREFIX} UNCAUGHT ERROR:`, err);
    return errorResponse(
      "An unexpected error occurred while generating the image. Please try again.",
      500,
      "uncaught"
    );
  }
});
