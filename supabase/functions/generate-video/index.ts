import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LOG_PREFIX = "[generate-video]";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    log("START", "Video generation request received");

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
      return errorResponse("Your session has expired. Please sign in again.", 401, "auth");
    }

    const userId = userData.user.id;
    log("AUTH", `Authenticated user: ${userId}`);

    const body = await req.json();
    const { videoId, title, videoType, theme, animationStyle, fontStyle, colorScheme, includeNarration, includeSubtitles, sourceText } = body;

    if (!videoId) {
      return errorResponse("Video ID is required.", 400, "validation");
    }
    if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
      return errorResponse("Source text is required to generate a video. Please provide content from your archive.", 400, "validation");
    }

    log("VALIDATION", "Request validated", { videoId, videoType, theme, textLength: sourceText.length });

    // Verify ownership
    const { data: videoRecord, error: dbError } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();

    if (dbError || !videoRecord) {
      return errorResponse("Video project not found. It may have been deleted.", 404, "db-fetch");
    }
    if (videoRecord.user_id !== userId) {
      return errorResponse("You don't have permission to generate this video.", 403, "auth");
    }

    log("DB", "Video record verified", { videoId, status: videoRecord.status });

    await supabase.from("generated_videos").update({ status: "processing" }).eq("id", videoId);

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse(
        "AI video generation is not yet configured on this server. The video project has been saved — you can generate it once the feature is enabled.",
        503,
        "config"
      );
    }

    // Clean source text
    const cleanText = sourceText
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();

    // Step 1: Use GPT-4o to create a video storyboard (3-5 scenes)
    log("STORYBOARD", "Generating video storyboard with GPT-4o...");

    const storyboardPrompt = `You are a family heritage video director. Create a storyboard for a ${videoType.replace(/_/g, " ")} video based on the following archive content.

ARCHIVE CONTENT:
${cleanText.slice(0, 3000)}

Create exactly 4 scenes. For each scene, provide:
1. "narration" — the narration text for this scene (2-3 sentences, warm and respectful tone)
2. "image_prompt" — a DALL-E image generation prompt for this scene (describe a warm, elegant family heritage illustration, no text in the image, style: ${theme}, ${animationStyle})
3. "subtitle" — a short subtitle/caption for this scene (max 10 words)

Return a JSON object: {"scenes": [{"narration": "...", "image_prompt": "...", "subtitle": "..."}, ...]}

IMPORTANT RULES:
- Only use information from the archive content above. Never invent family facts.
- If the archive content is sparse, create general heritage-themed scenes.
- Keep narration natural and spoken-aloud friendly.
- Image prompts should describe warm, nostalgic, family-heritage-style illustrations.`;

    const storyboardRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a family heritage video director. Always return valid JSON." },
          { role: "user", content: storyboardPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!storyboardRes.ok) {
      log("STORYBOARD", "GPT-4o storyboard failed", { status: storyboardRes.status });
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse("Could not create the video storyboard. Please try again.", 502, "storyboard");
    }

    const storyboardData = await storyboardRes.json();
    const storyboardRaw = storyboardData.choices?.[0]?.message?.content;
    if (!storyboardRaw) {
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse("The AI returned an empty storyboard. Please try again.", 502, "storyboard-parse");
    }

    let storyboard: { scenes: { narration: string; image_prompt: string; subtitle: string }[] };
    try {
      storyboard = JSON.parse(storyboardRaw);
    } catch {
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse("Could not parse the video storyboard. Please try again.", 502, "storyboard-parse");
    }

    if (!storyboard.scenes || storyboard.scenes.length === 0) {
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse("The storyboard contained no scenes. Please try again.", 502, "storyboard-empty");
    }

    log("STORYBOARD", `Created ${storyboard.scenes.length} scenes`);

    // Step 2: Generate scene images with DALL-E 3
    log("IMAGES", "Generating scene images with DALL-E 3...");

    const sceneImageUrls: string[] = [];
    const sceneStoragePaths: string[] = [];

    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      log("IMAGES", `Generating image for scene ${i + 1}/${storyboard.scenes.length}`);

      const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: scene.image_prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json",
        }),
      });

      if (!imageRes.ok) {
        log("IMAGES", `DALL-E failed for scene ${i + 1}`, { status: imageRes.status });
        await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
        return errorResponse(`Could not generate image for scene ${i + 1}. Please try again.`, 502, "image-gen");
      }

      const imageData = await imageRes.json();
      const b64Image = imageData.data?.[0]?.b64_json;
      if (!b64Image) {
        await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
        return errorResponse(`No image returned for scene ${i + 1}.`, 502, "image-parse");
      }

      const imageBuffer = Uint8Array.from(atob(b64Image), (c) => c.charCodeAt(0));
      const imgPath = `${userId}/${videoId}-scene-${i + 1}.png`;

      const { error: imgUploadError } = await supabase.storage
        .from("photos")
        .upload(imgPath, imageBuffer, { contentType: "image/png", upsert: true });

      if (imgUploadError) {
        log("IMAGES", `Upload failed for scene ${i + 1}`, { imgUploadError });
        await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
        return errorResponse(`Could not save image for scene ${i + 1}.`, 500, "image-upload");
      }

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(imgPath);
      sceneImageUrls.push(urlData.publicUrl);
      sceneStoragePaths.push(imgPath);
      log("IMAGES", `Scene ${i + 1} image saved`);
    }

    // Step 3: Generate narration audio with TTS (if requested)
    let narrationUrl: string | null = null;
    let narrationPath: string | null = null;

    if (includeNarration) {
      log("NARRATION", "Generating narration audio with TTS...");

      const fullNarration = storyboard.scenes.map((s) => s.narration).join(" ");
      const narrationChunks: string[] = [];
      if (fullNarration.length <= 4000) {
        narrationChunks.push(fullNarration);
      } else {
        let remaining = fullNarration;
        while (remaining.length > 4000) {
          let idx = remaining.lastIndexOf(".", 4000);
          if (idx < 2000) idx = 4000;
          narrationChunks.push(remaining.slice(0, idx + 1));
          remaining = remaining.slice(idx + 1).trim();
        }
        if (remaining.length > 0) narrationChunks.push(remaining);
      }

      const narrationBuffers: Uint8Array[] = [];
      for (let i = 0; i < narrationChunks.length; i++) {
        log("NARRATION", `TTS chunk ${i + 1}/${narrationChunks.length}`);
        const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "tts-1",
            voice: VOICE_MAP.warm_female,
            input: narrationChunks[i],
            speed: 1.0,
            response_format: "mp3",
          }),
        });

        if (!ttsRes.ok) {
          log("NARRATION", `TTS failed for chunk ${i + 1}`, { status: ttsRes.status });
          break;
        }

        narrationBuffers.push(new Uint8Array(await ttsRes.arrayBuffer()));
      }

      if (narrationBuffers.length > 0) {
        const totalLen = narrationBuffers.reduce((s, b) => s + b.length, 0);
        const combined = new Uint8Array(totalLen);
        let off = 0;
        for (const buf of narrationBuffers) {
          combined.set(buf, off);
          off += buf.length;
        }

        narrationPath = `${userId}/${videoId}-narration.mp3`;
        const { error: narrUploadErr } = await supabase.storage
          .from("voice")
          .upload(narrationPath, combined, { contentType: "audio/mpeg", upsert: true });

        if (narrUploadErr) {
          log("NARRATION", "Narration upload failed", { narrUploadErr });
        } else {
          const { data: signedData } = await supabase.storage.from("voice").createSignedUrl(narrationPath, 60 * 60 * 24 * 365);
          narrationUrl = signedData?.signedUrl ?? null;
          log("NARRATION", "Narration audio saved");
        }
      }
    }

    // Step 4: Build a self-contained HTML video player page
    log("ASSEMBLY", "Building HTML video player page");

    const scenesHtml = storyboard.scenes.map((scene, i) => {
      const img = sceneImageUrls[i] || "";
      const subtitle = includeSubtitles ? `<div class="subtitle">${scene.subtitle}</div>` : "";
      const narration = includeNarration && narrationUrl ? `<div class="narration-text">${scene.narration}</div>` : "";
      return `<div class="scene" data-scene="${i + 1}">
        <img src="${img}" alt="${scene.subtitle}" />
        ${subtitle}
        ${narration}
      </div>`;
    }).join("\n");

    const fontStack = fontStyle === "serif" ? "'Georgia', 'Times New Roman', serif" : fontStyle === "modern" ? "'Inter', sans-serif" : "'Georgia', serif";
    const colorBg = colorScheme === "warm" ? "#faf6f0" : colorScheme === "vintage" ? "#f5f0e6" : colorScheme === "botanical" ? "#f0f5f0" : "#ffffff";
    const colorText = colorScheme === "warm" ? "#3d2b1f" : "#333333";
    const colorAccent = colorScheme === "warm" ? "#8b6f47" : colorScheme === "vintage" ? "#7a6650" : "#4a7c59";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title || "Family Video"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${colorBg}; color: ${colorText}; font-family: ${fontStack}; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .video-container { max-width: 800px; width: 100%; margin: 2rem auto; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12); background: #000; }
  .scene { position: relative; display: none; animation: fadeIn 1s ease-in-out; }
  .scene.active { display: block; }
  .scene img { width: 100%; height: auto; display: block; }
  .subtitle { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: #fff; padding: 8px 20px; border-radius: 6px; font-size: 16px; text-align: center; max-width: 80%; }
  .narration-text { display: none; }
  .controls { display: flex; gap: 12px; justify-content: center; margin: 20px 0; }
  .controls button { background: ${colorAccent}; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; font-family: ${fontStack}; transition: opacity 0.2s; }
  .controls button:hover { opacity: 0.85; }
  .controls button:disabled { opacity: 0.4; cursor: not-allowed; }
  .progress { width: 100%; height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; margin: 0 20px; }
  .progress-bar { height: 100%; background: ${colorAccent}; border-radius: 2px; transition: width 0.3s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .title-bar { text-align: center; padding: 20px; }
  .title-bar h1 { font-size: 24px; font-weight: 600; }
</style>
</head>
<body>
  <div class="title-bar"><h1>${title || "Family Video"}</h1></div>
  ${narrationUrl ? `<audio id="narration" src="${narrationUrl}" preload="auto"></audio>` : ""}
  <div class="video-container" id="videoContainer">
    ${scenesHtml}
  </div>
  <div class="progress"><div class="progress-bar" id="progressBar" style="width: 0%"></div></div>
  <div class="controls">
    <button id="playBtn" onclick="playVideo()">Play</button>
    <button id="pauseBtn" onclick="pauseVideo()" disabled>Pause</button>
    <button id="restartBtn" onclick="restartVideo()">Restart</button>
  </div>
  <script>
    const scenes = document.querySelectorAll('.scene');
    const narration = document.getElementById('narration');
    const progressBar = document.getElementById('progressBar');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    let currentScene = 0;
    let sceneTimer = null;
    const sceneDuration = ${includeNarration ? "0" : "5000"}; // 5s per scene if no narration, else driven by audio

    function showScene(idx) {
      scenes.forEach((s, i) => s.classList.toggle('active', i === idx));
      currentScene = idx;
      progressBar.style.width = ((idx + 1) / scenes.length * 100) + '%';
    }

    function playVideo() {
      showScene(0);
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      if (narration) {
        narration.currentTime = 0;
        narration.play();
        sceneTimer = setInterval(() => {
          const progress = narration.currentTime / narration.duration;
          const sceneIdx = Math.min(Math.floor(progress * scenes.length), scenes.length - 1);
          if (sceneIdx !== currentScene) showScene(sceneIdx);
          if (narration.ended) { stopVideo(); }
        }, 200);
      } else {
        sceneTimer = setInterval(() => {
          if (currentScene < scenes.length - 1) showScene(currentScene + 1);
          else stopVideo();
        }, sceneDuration);
      }
    }

    function pauseVideo() {
      if (sceneTimer) { clearInterval(sceneTimer); sceneTimer = null; }
      if (narration) narration.pause();
      playBtn.disabled = false;
      pauseBtn.disabled = true;
    }

    function stopVideo() {
      if (sceneTimer) { clearInterval(sceneTimer); sceneTimer = null; }
      if (narration) narration.pause();
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      progressBar.style.width = '100%';
    }

    function restartVideo() {
      stopVideo();
      showScene(0);
      progressBar.style.width = '0%';
    }

    showScene(0);
  </script>
</body>
</html>`;

    // Upload the HTML player to documents bucket
    const htmlPath = `${userId}/${videoId}.html`;
    const htmlBuffer = new TextEncoder().encode(htmlContent);

    log("STORAGE", "Uploading HTML video player", { path: htmlPath });

    const { error: htmlUploadError } = await supabase.storage
      .from("documents")
      .upload(htmlPath, htmlBuffer, { contentType: "text/html", upsert: true });

    if (htmlUploadError) {
      log("STORAGE", "HTML upload failed", { htmlUploadError });
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse("The video was generated but the player could not be saved. Please try again.", 500, "html-upload");
    }

    const { data: htmlSignedData, error: htmlSignedErr } = await supabase.storage
      .from("documents")
      .createSignedUrl(htmlPath, 60 * 60 * 24 * 365);

    if (htmlSignedErr || !htmlSignedData) {
      log("STORAGE", "Could not create signed URL for HTML");
      await supabase.from("generated_videos").update({ status: "error" }).eq("id", videoId);
      return errorResponse("The video player was saved but the URL could not be generated.", 500, "html-url");
    }

    const htmlUrl = htmlSignedData.signedUrl;
    const thumbnailUrl = sceneImageUrls[0] || null;
    const captions = storyboard.scenes.map((s) => s.subtitle).join("\n");
    const subtitles = includeSubtitles ? captions : null;
    const estimatedDuration = includeNarration ? Math.round(storyboard.scenes.length * 8) : storyboard.scenes.length * 5;

    log("STORAGE", "HTML video player saved");

    // Update the video record
    const { error: updateError } = await supabase
      .from("generated_videos")
      .update({
        storage_path: htmlPath,
        public_url: htmlUrl,
        thumbnail_url: thumbnailUrl,
        captions: captions,
        subtitles: subtitles,
        duration_seconds: estimatedDuration,
        status: "ready",
      })
      .eq("id", videoId);

    if (updateError) {
      log("DB", "Failed to update video record", { updateError });
      return errorResponse("The video was generated and saved, but the database record could not be updated. Please refresh the page.", 500, "db-update");
    }

    log("DB", "Video record updated to 'ready'");

    // Create a Media Library entry
    const { error: mediaError } = await supabase.from("media_library_items").insert({
      user_id: userId,
      title: title || videoRecord.title,
      media_category: "video",
      source_type: "generated_video",
      source_id: videoId,
      storage_path: htmlPath,
      public_url: htmlUrl,
      duration_seconds: estimatedDuration,
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
      task_type: "video_generation",
      task_title: title || videoRecord.title,
      status: "completed",
      input_summary: cleanText.slice(0, 200),
      output_summary: `Video generated with ${storyboard.scenes.length} scenes (${duration}s)`,
      duration_seconds: duration,
    });

    log("COMPLETE", `Video generation complete in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        publicUrl: htmlUrl,
        thumbnailUrl,
        storagePath: htmlPath,
        sceneCount: storyboard.scenes.length,
        duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(`${LOG_PREFIX} UNCAUGHT ERROR:`, err);
    return errorResponse(
      "An unexpected error occurred while generating the video. Please try again.",
      500,
      "uncaught"
    );
  }
});
