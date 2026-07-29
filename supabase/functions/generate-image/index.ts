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
    const { imageId, prompt, style, imageType } = body;

    if (!imageId) {
      return errorResponse("Image ID is required.", 400, "validation");
    }
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return errorResponse("A prompt is required to generate an image. Please describe what you'd like to create.", 400, "validation");
    }

    log("VALIDATION", "Request validated", { imageId, promptLength: prompt.length, style, imageType });

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
      return errorResponse("You don't have permission to generate this image.", 403, "auth");
    }

    log("DB", "Image record verified", { imageId, status: imageRecord.status });

    await supabase.from("studio_images").update({ status: "processing" }).eq("id", imageId);

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      await supabase.from("studio_images").update({ status: "draft" }).eq("id", imageId);
      log("CONFIG", "OPENAI_API_KEY not configured");
      return errorResponse(
        "AI image generation is not yet configured on this server. The image project has been saved — you can generate it once the feature is enabled.",
        503,
        "config"
      );
    }

    // Build a clean, single-line prompt — strip any newlines from the frontend
    const cleanPrompt = prompt.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    const typeLabel = imageType ? imageType.replace(/_/g, " ") : "family heritage artwork";

    // Avoid duplicating style info — the frontend may already include "Style: X" in the prompt
    const styleAlreadyIncluded = style && cleanPrompt.toLowerCase().includes(style.toLowerCase());
    const styleSuffix = style && !styleAlreadyIncluded ? ` Artistic style: ${style}.` : "";

    const fullPrompt = [
      `Create a ${typeLabel}.`,
      cleanPrompt,
      styleSuffix,
      "Warm, elegant, respectful tone suitable for a family heritage archive.",
    ].filter(Boolean).join(" ");

    // Truncate to DALL-E 3's 4000 character limit
    const truncatedPrompt = fullPrompt.slice(0, 4000);

    log("PROMPT", "Built DALL-E prompt", { fullPrompt: truncatedPrompt.slice(0, 200) });

    // Call DALL-E 3 API — use "url" response format (more reliable than b64_json)
    log("OPENAI", "Calling DALL-E 3 API...");

    let aiResponse: Response | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      log("OPENAI", `Attempt ${attempt}/3`);

      aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: truncatedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      });

      if (aiResponse.ok) {
        log("OPENAI", `DALL-E 3 succeeded on attempt ${attempt}`);
        break;
      }

      const errText = await aiResponse.text();
      lastError = errText;
      let errStatus = aiResponse.status;
      log("OPENAI", `Attempt ${attempt} failed`, { status: errStatus, errText: errText.slice(0, 500) });

      // Don't retry on 400 (bad prompt) or 401/403 (auth issues)
      if (errStatus === 400 || errStatus === 401 || errStatus === 403) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < 3) {
        const waitMs = attempt * 2000;
        log("OPENAI", `Waiting ${waitMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      const status = aiResponse?.status ?? 500;
      log("OPENAI", "All attempts failed", { status, lastError: lastError?.slice(0, 500) });

      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);

      let userMessage = "The AI image service returned an error.";
      if (status === 429) {
        userMessage = "The AI image service is busy right now. Please wait a moment and try again.";
      } else if (status === 400) {
        userMessage = "The prompt was rejected by the AI. Please rephrase your description and try again.";
      } else if (status === 401 || status === 403) {
        userMessage = "The AI image service is not properly configured. Please contact support.";
      } else if (status >= 500) {
        userMessage = "The AI image service is temporarily unavailable. Please try again shortly.";
      }

      return errorResponse(userMessage, 502, "openai-api");
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.data?.[0]?.url;
    const revisedPrompt = aiData.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      log("OPENAI", "DALL-E returned no image URL");
      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);
      return errorResponse("The AI image service returned an empty result. Please try again.", 502, "openai-parse");
    }

    log("OPENAI", "DALL-E image URL received", { revisedPrompt: revisedPrompt?.slice(0, 100) });

    // Download the image from the OpenAI URL
    log("DOWNLOAD", "Downloading image from OpenAI URL...");
    const imageDownloadRes = await fetch(imageUrl);

    if (!imageDownloadRes.ok) {
      log("DOWNLOAD", "Failed to download image", { status: imageDownloadRes.status });
      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);
      return errorResponse("The image was generated but could not be downloaded. Please try again.", 502, "image-download");
    }

    const imageBuffer = new Uint8Array(await imageDownloadRes.arrayBuffer());
    log("DOWNLOAD", "Image downloaded", { bytes: imageBuffer.length });

    // Upload to Supabase Storage
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

    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    if (!publicUrl) {
      log("STORAGE", "Could not get public URL");
      await supabase.from("studio_images").update({ status: "error" }).eq("id", imageId);
      return errorResponse("The image was saved but the URL could not be generated. Please contact support.", 500, "storage-url");
    }

    log("STORAGE", "Public URL generated", { publicUrl: publicUrl.slice(0, 80) });

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
