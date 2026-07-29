import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      contentType,
      sourceContext,
      writingStyle,
      tone,
      targetAudience,
      detailLevel,
      documentLength,
      language,
      customInstructions,
      template,
    } = body;

    if (!contentType) {
      return new Response(JSON.stringify({ error: "Content type is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the system prompt
    const systemPrompt = `You are Rooted Studio, an AI writing assistant for a family heritage platform called Rooted.
Your role is to help users transform their preserved memories into beautifully written content.

CRITICAL RULES:
1. Only use information provided in the source context. NEVER invent personal facts, relationships, events, dates, or memories.
2. If information is missing, note it in the "suggestions" field so the user can add it.
3. Write in a warm, elegant, respectful tone that honours the family's story.
4. Format the output as clean HTML with <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote> tags as appropriate.
5. Do NOT include <html>, <head>, or <body> tags — just the content body.
6. If the source context is empty or very sparse, generate a template structure with placeholder notes like "[Add more details about...]"`;

    // Build the user prompt
    const contentTypeLabel = contentType.replace(/_/g, " ");
    let userPrompt = `Please write a ${contentTypeLabel}.\n\n`;

    if (sourceContext && sourceContext.trim()) {
      userPrompt += `=== ARCHIVE CONTEXT ===\n${sourceContext}\n\n`;
    } else {
      userPrompt += `=== ARCHIVE CONTEXT ===\n(No specific archive items were selected. Create a template structure the user can fill in.)\n\n`;
    }

    if (writingStyle) userPrompt += `Writing style: ${writingStyle}\n`;
    if (tone) userPrompt += `Tone: ${tone}\n`;
    if (targetAudience) userPrompt += `Target audience: ${targetAudience}\n`;
    if (detailLevel) userPrompt += `Level of detail: ${detailLevel}\n`;
    if (documentLength) userPrompt += `Document length: ${documentLength}\n`;
    if (language && language !== "en") userPrompt += `Language: write in ${language}\n`;
    if (template) userPrompt += `Template/layout: ${template}\n`;
    if (customInstructions) userPrompt += `Additional instructions: ${customInstructions}\n`;

    userPrompt += `\nReturn a JSON object with this exact shape:\n{"content": "<html content>", "title": "<suggested title>", "suggestions": ["<suggestion 1>", "<suggestion 2>"]}\n\nThe "suggestions" array should list any missing information that would improve the document, based on what was provided in the archive context. If everything looks complete, return an empty array.`;

    // Call the AI API
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let result: { content: string; title: string; suggestions: string[] };

    if (openaiKey) {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        return new Response(
          JSON.stringify({ error: `AI service error: ${aiResponse.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.choices?.[0]?.message?.content;
      if (!rawContent) {
        return new Response(
          JSON.stringify({ error: "AI returned no content" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        result = JSON.parse(rawContent);
      } catch {
        result = { content: rawContent, title: contentTypeLabel, suggestions: [] };
      }
    } else {
      // No API key configured — return a realistic placeholder structure
      result = generatePlaceholder(contentTypeLabel, sourceContext, customInstructions);
    }

    return new Response(
      JSON.stringify({
        content: result.content,
        title: result.title || contentTypeLabel,
        suggestions: result.suggestions || [],
        generated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generatePlaceholder(
  contentType: string,
  sourceContext: string,
  customInstructions?: string
): { content: string; title: string; suggestions: string[] } {
  const hasContext = sourceContext && sourceContext.trim().length > 0;
  const suggestions: string[] = [];

  if (!hasContext) {
    suggestions.push("Select people, memories, or events from your archive to personalise this content.");
  }

  const content = `<h1>${hasContext ? "A Story Worth Telling" : `[Title: Your ${contentType}]`}</h1>
<p>${hasContext ? "Every family has a story worth preserving. This document is a starting point — edit it freely to make it yours." : "This is a template structure. Replace the bracketed text with your own stories and memories."}</p>

<h2>Beginnings</h2>
<p>${hasContext ? "[The AI will weave your archive content into a narrative here. Edit this section to add your personal voice.]" : "[Describe where the story begins — a childhood home, a first meeting, a place that shaped everything.]"}</p>

<h2>The Journey</h2>
<p>${hasContext ? "[Key moments from your archive will appear here, connected into a flowing narrative.]" : "[Add the milestones, challenges, and triumphs that define this story.]"}</p>

<h2>Reflections</h2>
<blockquote>${hasContext ? "[A meaningful quote or reflection drawn from your archive will appear here.]" : "[Add a favourite saying, lesson, or reflection that captures the heart of this story.]"}</blockquote>

<h2>Legacy</h2>
<p>${hasContext ? "[The document will close with a reflection on what this story means for future generations.]" : "[What do you want future generations to remember? Close with the meaning this story holds.]"}</p>`;

  if (hasContext && sourceContext.toLowerCase().includes("childhood")) {
    // Could add specific suggestions based on context
  }

  return {
    content,
    title: hasContext ? `A Story Worth Telling` : `New ${contentType}`,
    suggestions,
  };
}
