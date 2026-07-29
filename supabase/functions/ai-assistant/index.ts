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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Fetch all archive data for this user (bypass RLS with service role)
    const [people, memories, recipes, traditions, events, places, documents, photos, voice] = await Promise.all([
      supabase.from("people").select("*").eq("user_id", userId),
      supabase.from("memories").select("*").eq("user_id", userId),
      supabase.from("recipes").select("*").eq("user_id", userId),
      supabase.from("traditions").select("*").eq("user_id", userId),
      supabase.from("events").select("*").eq("user_id", userId),
      supabase.from("places").select("*").eq("user_id", userId),
      supabase.from("documents").select("*").eq("user_id", userId),
      supabase.from("photos").select("*").eq("user_id", userId),
      supabase.from("voice_recordings").select("*").eq("user_id", userId),
    ]);

    const peopleData = people.data ?? [];
    const memoriesData = memories.data ?? [];
    const recipesData = recipes.data ?? [];
    const traditionsData = traditions.data ?? [];
    const eventsData = events.data ?? [];
    const placesData = places.data ?? [];
    const documentsData = documents.data ?? [];
    const photosData = photos.data ?? [];
    const voiceData = voice.data ?? [];

    // Build a searchable index from the archive
    type Ref = { type: string; id: string; title: string; subtitle: string | null; href: string; text: string; tags: string[] };
    const index: Ref[] = [];

    peopleData.forEach((p: Record<string, unknown>) => {
      const name = String(p.full_name ?? "");
      const bio = String(p.bio ?? "");
      const pref = String(p.preferred_name ?? "");
      const occ = String(p.occupation ?? "");
      const notes = String(p.notes ?? "");
      const traits = Array.isArray(p.personality_traits) ? p.personality_traits as string[] : [];
      const interests = Array.isArray(p.interests) ? p.interests as string[] : [];
      const hobbies = Array.isArray(p.hobbies) ? p.hobbies as string[] : [];
      const achievements = Array.isArray(p.achievements) ? p.achievements as string[] : [];
      index.push({
        type: "person", id: String(p.id), title: name, subtitle: pref || null,
        href: `/app/people/${p.id}`,
        text: `${name} ${pref} ${occ} ${bio} ${notes} ${traits.join(" ")} ${interests.join(" ")} ${hobbies.join(" ")} ${achievements.join(" ")}`.toLowerCase(),
        tags: [...traits, ...interests, ...hobbies, ...achievements],
      });
    });

    memoriesData.forEach((m: Record<string, unknown>) => {
      const title = String(m.title ?? "");
      const desc = String(m.description ?? "");
      const loc = String(m.location ?? "");
      const tags = Array.isArray(m.tags) ? m.tags as string[] : [];
      const emo = String(m.emotional_category ?? "");
      const date = String(m.memory_date ?? "");
      index.push({
        type: "memory", id: String(m.id), title, subtitle: desc || null,
        href: "/app/memories",
        text: `${title} ${desc} ${loc} ${emo} ${date} ${tags.join(" ")}`.toLowerCase(),
        tags,
      });
    });

    recipesData.forEach((r: Record<string, unknown>) => {
      const title = String(r.title ?? "");
      const ing = String(r.ingredients ?? "");
      const instr = String(r.instructions ?? "");
      const by = String(r.created_by ?? "");
      const occ = String(r.occasions ?? "");
      index.push({
        type: "recipe", id: String(r.id), title, subtitle: by || null,
        href: "/app/recipes",
        text: `${title} ${ing} ${instr} ${by} ${occ}`.toLowerCase(),
        tags: occ ? [occ] : [],
      });
    });

    traditionsData.forEach((t: Record<string, unknown>) => {
      const title = String(t.title ?? "");
      const desc = String(t.description ?? "");
      const when = String(t.when_it_happens ?? "");
      const part = String(t.participants ?? "");
      index.push({
        type: "tradition", id: String(t.id), title, subtitle: when || null,
        href: "/app/traditions",
        text: `${title} ${desc} ${when} ${part}`.toLowerCase(),
        tags: when ? [when] : [],
      });
    });

    eventsData.forEach((e: Record<string, unknown>) => {
      const title = String(e.title ?? "");
      const desc = String(e.description ?? "");
      const date = String(e.event_date ?? "");
      const loc = String(e.location ?? "");
      const etype = String(e.event_type ?? "");
      index.push({
        type: "event", id: String(e.id), title, subtitle: date || null,
        href: "/app/timeline",
        text: `${title} ${desc} ${date} ${loc} ${etype}`.toLowerCase(),
        tags: etype ? [etype] : [],
      });
    });

    placesData.forEach((p: Record<string, unknown>) => {
      const name = String(p.name ?? "");
      const desc = String(p.description ?? "");
      const loc = String(p.location ?? "");
      index.push({
        type: "place", id: String(p.id), title: name, subtitle: loc || null,
        href: "/app/places",
        text: `${name} ${desc} ${loc}`.toLowerCase(),
        tags: [],
      });
    });

    documentsData.forEach((d: Record<string, unknown>) => {
      const title = String(d.title ?? "");
      const desc = String(d.description ?? "");
      const cat = String(d.category ?? "");
      index.push({
        type: "document", id: String(d.id), title, subtitle: cat || null,
        href: "/app/documents",
        text: `${title} ${desc} ${cat}`.toLowerCase(),
        tags: cat ? [cat] : [],
      });
    });

    photosData.forEach((p: Record<string, unknown>) => {
      const title = String(p.title ?? "Photo");
      const cap = String(p.caption ?? "");
      const desc = String(p.description ?? "");
      const loc = String(p.location ?? "");
      const date = String(p.approximate_date ?? "");
      index.push({
        type: "photo", id: String(p.id), title, subtitle: cap || null,
        href: "/app/photos",
        text: `${title} ${cap} ${desc} ${loc} ${date}`.toLowerCase(),
        tags: [],
      });
    });

    voiceData.forEach((v: Record<string, unknown>) => {
      const title = String(v.title ?? "Voice Recording");
      const desc = String(v.description ?? "");
      index.push({
        type: "voice", id: String(v.id), title, subtitle: desc || null,
        href: "/app/voice",
        text: `${title} ${desc}`.toLowerCase(),
        tags: [],
      });
    });

    // Semantic search: score each item by query term overlap
    const queryTerms = normalizedQuery.split(/\s+/).filter((t) => t.length > 2);
    const stopWords = new Set(["the", "and", "for", "are", "was", "were", "has", "had", "have", "did", "about", "from", "that", "this", "with", "their", "they", "them", "what", "which", "when", "where", "who", "how", "why", "all", "every", "show", "find", "list", "tell", "me", "our", "family", "my", "were", "been", "some", "any", "his", "her", "she", "him", "his", "its", "but", "not", "can", "you", "please"]);
    const meaningfulTerms = queryTerms.filter((t) => !stopWords.has(t));

    const scored = index.map((item) => {
      let score = 0;
      for (const term of meaningfulTerms) {
        if (item.text.includes(term)) score += 3;
        if (item.title.toLowerCase().includes(term)) score += 5;
        if (item.tags.some((t) => t.toLowerCase().includes(term))) score += 4;
      }
      // Also check for multi-word phrase matches
      if (meaningfulTerms.length > 1) {
        const phrase = meaningfulTerms.join(" ");
        if (item.text.includes(phrase)) score += 10;
      }
      return { item, score };
    }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

    const topResults = scored.slice(0, 20).map((s) => s.item);

    // Build answer text
    let answer = "";
    if (topResults.length === 0) {
      answer = `I searched your entire archive for "${query}" but couldn't find any matching items. Try rephrasing your question or adding more details to your archive.`;
    } else {
      const grouped: Record<string, typeof topResults> = {};
      topResults.forEach((r) => {
        (grouped[r.type] ??= []).push(r);
      });

      const typeLabels: Record<string, string> = {
        person: "People", memory: "Memories", recipe: "Recipes", tradition: "Traditions",
        event: "Events", place: "Places", document: "Documents", photo: "Photos", voice: "Voice Recordings",
      };

      const parts: string[] = [];
      parts.push(`I found ${topResults.length} item${topResults.length === 1 ? "" : "s"} in your archive related to "${query}":`);
      parts.push("");

      for (const [type, items] of Object.entries(grouped)) {
        parts.push(`${typeLabels[type] ?? type} (${items.length}):`);
        items.slice(0, 8).forEach((item) => {
          parts.push(`  • ${item.title}${item.subtitle ? ` — ${item.subtitle}` : ""}`);
        });
        parts.push("");
      }

      parts.push("All results include references back to the original archive items so you can verify the information.");
      answer = parts.join("\n");
    }

    const references = topResults.map((r) => ({
      type: r.type,
      id: r.id,
      title: r.title,
      href: r.href,
    }));

    // Log as a task
    await supabase.from("ai_job_history").insert({
      user_id: userId,
      task_type: "archive_qa",
      task_title: query,
      status: "completed",
      input_summary: query,
      output_summary: answer.slice(0, 200),
    });

    return new Response(JSON.stringify({ answer, references }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
