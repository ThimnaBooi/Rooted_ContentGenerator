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
    const { taskType, inputData } = await req.json();
    if (!taskType) {
      return new Response(JSON.stringify({ error: "taskType is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a task record
    const { data: task } = await supabase.from("ai_tasks").insert({
      user_id: userId,
      task_type: taskType,
      status: "processing",
      input_data: inputData ?? null,
      started_at: new Date().toISOString(),
    }).select().single();

    const startTime = Date.now();

    let result: Record<string, unknown> = {};
    let outputSummary = "";
    let taskTitle = taskType;

    switch (taskType) {
      case "archive_health": {
        result = await analyzeArchiveHealth(supabase, userId);
        outputSummary = `Archive health: ${result.profile_completeness_pct ?? 0}% profile completeness, ${result.total_people ?? 0} people, ${result.total_memories ?? 0} memories.`;
        taskTitle = "Archive Health Analysis";
        break;
      }
      case "family_insights": {
        result = await analyzeFamilyInsights(supabase, userId);
        outputSummary = `Family insights calculated for ${result.total_people ?? 0} people.`;
        taskTitle = "Family Insights Analysis";
        break;
      }
      case "duplicate_detection": {
        result = await detectDuplicates(supabase, userId);
        outputSummary = `Found ${result.duplicates_found ?? 0} potential duplicates.`;
        taskTitle = "Duplicate Detection";
        break;
      }
      case "relationship_analysis": {
        result = await analyzeRelationships(supabase, userId);
        outputSummary = `Found ${result.suggestions_found ?? 0} relationship suggestions.`;
        taskTitle = "Relationship Analysis";
        break;
      }
      case "timeline_analysis": {
        result = await analyzeTimeline(supabase, userId);
        outputSummary = `Found ${result.gaps_found ?? 0} timeline gaps.`;
        taskTitle = "Timeline Analysis";
        break;
      }
      case "smart_recommendations": {
        result = await generateSmartRecommendations(supabase, userId);
        outputSummary = `Generated ${result.recommendations_count ?? 0} recommendations.`;
        taskTitle = "Smart Recommendations";
        break;
      }
      case "intelligent_notifications": {
        result = await generateIntelligentNotifications(supabase, userId);
        outputSummary = `Generated ${result.notifications_count ?? 0} notifications.`;
        taskTitle = "Intelligent Notifications";
        break;
      }
      default:
        result = { error: `Unknown task type: ${taskType}` };
        outputSummary = `Unknown task type: ${taskType}`;
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update task
    if (task) {
      await supabase.from("ai_tasks").update({
        status: "completed",
        progress: 100,
        output_data: result,
        completed_at: new Date().toISOString(),
      }).eq("id", task.id);
    }

    // Log to job history
    await supabase.from("ai_job_history").insert({
      user_id: userId,
      task_type: taskType,
      task_title: taskTitle,
      status: "completed",
      input_summary: JSON.stringify(inputData ?? {}).slice(0, 200),
      output_summary: outputSummary.slice(0, 200),
      duration_seconds: duration,
    });

    return new Response(JSON.stringify({
      taskId: task?.id ?? "",
      status: "completed",
      result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============ Analysis Functions ============

async function analyzeArchiveHealth(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [people, memories, recipes, traditions, photos, voice, documents, places, events] = await Promise.all([
    supabase.from("people").select("*").eq("user_id", userId),
    supabase.from("memories").select("id, memory_date").eq("user_id", userId),
    supabase.from("recipes").select("id").eq("user_id", userId),
    supabase.from("traditions").select("id").eq("user_id", userId),
    supabase.from("photos").select("id").eq("user_id", userId),
    supabase.from("voice_recordings").select("id").eq("user_id", userId),
    supabase.from("documents").select("id").eq("user_id", userId),
    supabase.from("places").select("id").eq("user_id", userId),
    supabase.from("events").select("id, event_date").eq("user_id", userId),
  ]);

  const peopleData = people.data ?? [];
  let completeProfiles = 0;
  let incompleteProfiles = 0;
  const recommendations: string[] = [];

  peopleData.forEach((p: Record<string, unknown>) => {
    const hasBio = !!p.bio;
    const hasDOB = !!p.date_of_birth;
    const hasPhoto = !!p.photo_url;
    const hasOccupation = !!p.occupation;
    const filledFields = [hasBio, hasDOB, hasPhoto, hasOccupation].filter(Boolean).length;
    if (filledFields >= 3) completeProfiles++;
    else incompleteProfiles++;
  });

  const totalPeople = peopleData.length;
  const profileCompletenessPct = totalPeople > 0 ? Math.round((completeProfiles / totalPeople) * 100) : 0;

  // Timeline coverage
  const allDates: string[] = [];
  (memories.data ?? []).forEach((m: Record<string, unknown>) => { if (m.memory_date) allDates.push(String(m.memory_date)); });
  (events.data ?? []).forEach((e: Record<string, unknown>) => { if (e.event_date) allDates.push(String(e.event_date)); });
  const years = allDates.map((d) => new Date(d).getFullYear()).filter((y) => !isNaN(y));
  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;
  const timelineCoverage = { minYear, maxYear, totalDatedItems: years.length };

  // Geographic coverage
  const placesCount = places.data?.length ?? 0;
  const geographicCoverage = { totalPlaces: placesCount };

  // Missing generations detection
  const missingGenerations: string[] = [];
  if (years.length > 0) {
    const yearSet = new Set(years);
    for (let y = minYear!; y <= maxYear!; y++) {
      if (!yearSet.has(y) && y % 10 === 0) {
        missingGenerations.push(String(y));
      }
    }
  }

  // Generate recommendations
  if (totalPeople > 0 && (memories.data?.length ?? 0) === 0) recommendations.push("You have people in your archive but no memories yet. Start adding stories to bring them to life.");
  if (totalPeople > 0 && (photos.data?.length ?? 0) === 0) recommendations.push("No photographs have been uploaded yet. Photos add a visual dimension to your family history.");
  if (totalPeople > 0 && (voice.data?.length ?? 0) === 0) recommendations.push("No voice recordings have been added. Consider recording family members telling stories.");
  if (incompleteProfiles > 0) recommendations.push(`${incompleteProfiles} person profile${incompleteProfiles === 1 ? "" : "s"} need more details (bio, date of birth, photo, or occupation).`);
  if (totalPeople > 0 && (recipes.data?.length ?? 0) === 0) recommendations.push("No recipes have been preserved yet. Family recipes are a beautiful part of your heritage.");
  if (totalPeople > 0 && (traditions.data?.length ?? 0) === 0) recommendations.push("No traditions have been documented yet. Consider recording family customs and rituals.");
  if (missingGenerations.length > 0) recommendations.push(`There may be gaps in your timeline around: ${missingGenerations.join(", ")}.`);

  const healthData = {
    total_people: totalPeople,
    complete_profiles: completeProfiles,
    incomplete_profiles: incompleteProfiles,
    profile_completeness_pct: profileCompletenessPct,
    total_memories: memories.data?.length ?? 0,
    total_recipes: recipes.data?.length ?? 0,
    total_traditions: traditions.data?.length ?? 0,
    total_photos: photos.data?.length ?? 0,
    total_voice_recordings: voice.data?.length ?? 0,
    total_documents: documents.data?.length ?? 0,
    total_places: placesCount,
    total_events: events.data?.length ?? 0,
    missing_generations: missingGenerations,
    timeline_coverage: timelineCoverage,
    geographic_coverage: geographicCoverage,
    recommendations: recommendations,
  };

  // Upsert archive health
  const { data: existing } = await supabase.from("archive_health").select("id").eq("user_id", userId).maybeSingle();
  if (existing) {
    await supabase.from("archive_health").update({ ...healthData, calculated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("archive_health").insert({ user_id: userId, ...healthData });
  }

  return healthData;
}

async function analyzeFamilyInsights(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [people, memories, photos, recipes, traditions, places, events, activities] = await Promise.all([
    supabase.from("people").select("id, full_name, photo_url").eq("user_id", userId),
    supabase.from("memory_people").select("person_id, person:people(full_name)").eq("person_id", "neq", "00000000-0000-0000-0000-000000000000"),
    supabase.from("photo_people").select("person_id").eq("person_id", "neq", "00000000-0000-0000-0000-000000000000"),
    supabase.from("recipe_people").select("person_id").eq("person_id", "neq", "00000000-0000-0000-0000-000000000000"),
    supabase.from("traditions").select("title, when_it_happens").eq("user_id", userId),
    supabase.from("places").select("name, location").eq("user_id", userId),
    supabase.from("events").select("event_date").eq("user_id", userId),
    supabase.from("activity_feed").select("created_at, entity_type").eq("user_id", userId).order("created_at", { ascending: true }).limit(500),
  ]);

  // Most documented members (by memory count)
  const memoryCounts: Record<string, number> = {};
  (memories.data ?? []).forEach((r: Record<string, unknown>) => {
    const pid = String(r.person_id ?? "");
    if (pid) memoryCounts[pid] = (memoryCounts[pid] ?? 0) + 1;
  });

  const peopleData = people.data ?? [];
  const mostDocumented = Object.entries(memoryCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([pid, count]) => {
      const person = peopleData.find((p: Record<string, unknown>) => String(p.id) === pid);
      return { name: person?.full_name ?? "Unknown", count };
    });

  // Most photographed
  const photoCounts: Record<string, number> = {};
  (photos.data ?? []).forEach((r: Record<string, unknown>) => {
    const pid = String(r.person_id ?? "");
    if (pid) photoCounts[pid] = (photoCounts[pid] ?? 0) + 1;
  });
  const mostPhotographed = Object.entries(photoCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 1)
    .map(([pid, count]) => {
      const person = peopleData.find((p: Record<string, unknown>) => String(p.id) === pid);
      return { name: person?.full_name ?? "Unknown", count };
    })[0];

  // Most contributed recipes
  const recipeCounts: Record<string, number> = {};
  (recipes.data ?? []).forEach((r: Record<string, unknown>) => {
    const pid = String(r.person_id ?? "");
    if (pid) recipeCounts[pid] = (recipeCounts[pid] ?? 0) + 1;
  });
  const mostRecipes = Object.entries(recipeCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 1)
    .map(([pid, count]) => {
      const person = peopleData.find((p: Record<string, unknown>) => String(p.id) === pid);
      return { name: person?.full_name ?? "Unknown", count };
    })[0];

  // Oldest memory
  const allDates: string[] = [];
  (events.data ?? []).forEach((e: Record<string, unknown>) => { if (e.event_date) allDates.push(String(e.event_date)); });
  const oldestDate = allDates.length > 0 ? allDates.sort()[0] : null;

  // Most common traditions
  const traditionCounts: Record<string, number> = {};
  (traditions.data ?? []).forEach((t: Record<string, unknown>) => {
    const when = String(t.when_it_happens ?? "Unspecified");
    traditionCounts[when] = (traditionCounts[when] ?? 0) + 1;
  });
  const commonTraditions = Object.entries(traditionCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5);

  // Monthly activity
  const monthlyActivity: Record<string, number> = {};
  (activities.data ?? []).forEach((a: Record<string, unknown>) => {
    const d = new Date(String(a.created_at));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyActivity[key] = (monthlyActivity[key] ?? 0) + 1;
  });

  const insightsData = {
    total_people: peopleData.length,
    most_documented_members: mostDocumented,
    oldest_preserved_memory: oldestDate,
    oldest_memory_date: oldestDate,
    most_common_traditions: commonTraditions,
    frequently_visited_locations: (places.data ?? []).slice(0, 5).map((p: Record<string, unknown>) => ({ name: p.name, location: p.location })),
    most_photographed_person: mostPhotographed,
    most_contributed_recipes: mostRecipes,
    timeline_coverage: { totalEvents: events.data?.length ?? 0 },
    archive_growth: { totalActivities: activities.data?.length ?? 0 },
    monthly_activity: monthlyActivity,
  };

  // Upsert
  const { data: existing } = await supabase.from("family_insights").select("id").eq("user_id", userId).maybeSingle();
  if (existing) {
    await supabase.from("family_insights").update({ ...insightsData, calculated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("family_insights").insert({ user_id: userId, ...insightsData });
  }

  return insightsData;
}

async function detectDuplicates(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [people, memories, recipes, traditions, places, events, documents, photos] = await Promise.all([
    supabase.from("people").select("id, full_name, preferred_name, date_of_birth").eq("user_id", userId),
    supabase.from("memories").select("id, title, description").eq("user_id", userId),
    supabase.from("recipes").select("id, title, ingredients").eq("user_id", userId),
    supabase.from("traditions").select("id, title, description").eq("user_id", userId),
    supabase.from("places").select("id, name, location").eq("user_id", userId),
    supabase.from("events").select("id, title, event_date").eq("user_id", userId),
    supabase.from("documents").select("id, title").eq("user_id", userId),
    supabase.from("photos").select("id, title, caption").eq("user_id", userId),
  ]);

  let duplicatesFound = 0;

  // Helper: compute string similarity (Jaccard on word sets)
  function similarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return Math.round((intersection.size / union.size) * 100);
  }

  function checkDuplicates(items: Record<string, unknown>[], type: string, field: string, extraField?: string) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = String(items[i][field] ?? "");
        const b = String(items[j][field] ?? "");
        const score = similarity(a, b);
        if (score >= 75) {
          duplicatesFound++;
          supabase.from("duplicate_reviews").insert({
            user_id: userId,
            entity_type: type,
            entity_1_id: String(items[i].id),
            entity_1_title: a,
            entity_2_id: String(items[j].id),
            entity_2_title: b,
            similarity_score: score,
            explanation: `Both ${type}s share ${score}% similar content in their ${field} field.`,
          }).then(() => {});
        }
      }
    }
  }

  checkDuplicates(people.data ?? [], "person", "full_name");
  checkDuplicates(memories.data ?? [], "memory", "title");
  checkDuplicates(recipes.data ?? [], "recipe", "title");
  checkDuplicates(traditions.data ?? [], "tradition", "title");
  checkDuplicates(places.data ?? [], "place", "name");
  checkDuplicates(events.data ?? [], "event", "title");
  checkDuplicates(documents.data ?? [], "document", "title");

  return { duplicates_found: duplicatesFound };
}

async function analyzeRelationships(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [memories, existingRels] = await Promise.all([
    supabase.from("memories").select("id, title, description, tags").eq("user_id", userId),
    supabase.from("relationships").select("person_id, related_person_id").eq("user_id", userId),
  ]);

  const people = await supabase.from("people").select("id, full_name").eq("user_id", userId);
  const peopleData = people.data ?? [];
  const peopleNames = peopleData.map((p: Record<string, unknown>) => ({ id: String(p.id), name: String(p.full_name).toLowerCase() }));

  let suggestionsFound = 0;
  const relKeywords = /\b(sister|brother|mother|father|daughter|son|aunt|uncle|cousin|grandmother|grandfather|grandparent|spouse|wife|husband|niece|nephew)\b/i;

  (memories.data ?? []).forEach((m: Record<string, unknown>) => {
    const text = `${m.title ?? ""} ${m.description ?? ""}`.toLowerCase();
    const matches = text.match(relKeywords);
    if (!matches) return;

    // Find which people are mentioned in this memory
    const mentioned = peopleNames.filter((p) => text.includes(p.name));
    if (mentioned.length >= 2) {
      const relType = matches[0];
      const p1 = mentioned[0];
      const p2 = mentioned[1];

      // Check if relationship already exists
      const exists = (existingRels.data ?? []).some((r: Record<string, unknown>) =>
        (String(r.person_id) === p1.id && String(r.related_person_id) === p2.id) ||
        (String(r.person_id) === p2.id && String(r.related_person_id) === p1.id)
      );

      if (!exists) {
        suggestionsFound++;
        supabase.from("relationship_suggestions").insert({
          user_id: userId,
          person_1_id: p1.id,
          person_1_name: p1.name,
          person_2_id: p2.id,
          person_2_name: p2.name,
          suggested_relationship: relType,
          evidence: `Both names appear in the memory "${String(m.title ?? "")}" which mentions the word "${relType}".`,
          source_entity_type: "memory",
          source_entity_id: String(m.id),
          confidence: "medium",
          confidence_score: 60,
        }).then(() => {});
      }
    }
  });

  return { suggestions_found: suggestionsFound };
}

async function analyzeTimeline(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [memories, events] = await Promise.all([
    supabase.from("memories").select("memory_date").eq("user_id", userId).not("memory_date", "is", null),
    supabase.from("events").select("event_date").eq("user_id", userId).not("event_date", "is", null),
  ]);

  const years: number[] = [];
  (memories.data ?? []).forEach((m: Record<string, unknown>) => {
    if (m.memory_date) {
      const y = new Date(String(m.memory_date)).getFullYear();
      if (!isNaN(y)) years.push(y);
    }
  });
  (events.data ?? []).forEach((e: Record<string, unknown>) => {
    if (e.event_date) {
      const y = new Date(String(e.event_date)).getFullYear();
      if (!isNaN(y)) years.push(y);
    }
  });

  if (years.length === 0) return { gaps_found: 0 };

  const sortedYears = [...new Set(years)].sort((a, b) => a - b);
  let gapsFound = 0;

  for (let i = 0; i < sortedYears.length - 1; i++) {
    const gap = sortedYears[i + 1] - sortedYears[i];
    if (gap >= 3) {
      gapsFound++;
      const gapStart = sortedYears[i] + 1;
      const gapEnd = sortedYears[i + 1] - 1;
      const context = `You have memories/events from ${sortedYears[i]} and ${sortedYears[i + 1]} but none from ${gapStart}${gapStart === gapEnd ? "" : `–${gapEnd}`}.`;
      supabase.from("timeline_gaps").insert({
        user_id: userId,
        gap_start_year: gapStart,
        gap_end_year: gapEnd,
        gap_description: `No documented memories or events between ${gapStart} and ${gapEnd}.`,
        surrounding_context: context,
      }).then(() => {});
    }
  }

  return { gaps_found: gapsFound };
}

async function generateSmartRecommendations(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [people, memories, photos, recipes, traditions, events, documents, voice, places] = await Promise.all([
    supabase.from("people").select("id, full_name, bio, date_of_birth, photo_url, occupation").eq("user_id", userId),
    supabase.from("memories").select("id").eq("user_id", userId),
    supabase.from("photos").select("id").eq("user_id", userId),
    supabase.from("recipes").select("id").eq("user_id", userId),
    supabase.from("traditions").select("id").eq("user_id", userId),
    supabase.from("events").select("id").eq("user_id", userId),
    supabase.from("documents").select("id").eq("user_id", userId),
    supabase.from("voice_recordings").select("id").eq("user_id", userId),
    supabase.from("places").select("id").eq("user_id", userId),
  ]);

  let count = 0;
  const recs: { type: string; title: string; description: string; explanation: string; actionLabel: string; actionHref: string; confidence: string; confidenceScore: number }[] = [];

  const peopleData = people.data ?? [];
  const memCount = memories.data?.length ?? 0;
  const photoCount = photos.data?.length ?? 0;
  const recipeCount = recipes.data?.length ?? 0;
  const traditionCount = traditions.data?.length ?? 0;
  const eventCount = events.data?.length ?? 0;
  const docCount = documents.data?.length ?? 0;
  const voiceCount = voice.data?.length ?? 0;
  const placeCount = places.data?.length ?? 0;

  // Missing biographies
  peopleData.forEach((p: Record<string, unknown>) => {
    if (!p.bio) {
      recs.push({
        type: "missing_biography",
        title: `${p.full_name} doesn't have a biography yet`,
        description: "A biography helps tell their life story in their own words or yours.",
        explanation: "I noticed this person profile has no biography field filled in.",
        actionLabel: "Add Biography",
        actionHref: `/app/people/${p.id}`,
        confidence: "high",
        confidenceScore: 90,
      });
    }
  });

  // Missing photos for people
  peopleData.forEach((p: Record<string, unknown>) => {
    if (!p.photo_url) {
      recs.push({
        type: "missing_photo",
        title: `No photo for ${p.full_name}`,
        description: "Adding a photo helps bring their profile to life.",
        explanation: "This person profile has no photo attached.",
        actionLabel: "Upload Photo",
        actionHref: `/app/people/${p.id}`,
        confidence: "medium",
        confidenceScore: 65,
      });
    }
  });

  // Creative recommendations
  if (memCount >= 10) {
    recs.push({
      type: "creative_recommendation",
      title: "You have enough memories to create a documentary",
      description: `With ${memCount} preserved memories, the AI can weave them into a beautiful family documentary.`,
      explanation: "10+ memories is a strong foundation for a documentary video.",
      actionLabel: "Create Documentary",
      actionHref: "/app/studio/create-video",
      confidence: "high",
      confidenceScore: 85,
    });
  }

  if (recipeCount >= 5) {
    recs.push({
      type: "creative_recommendation",
      title: "This recipe collection would make a beautiful cookbook",
      description: `With ${recipeCount} recipes preserved, you can create a stunning family recipe book.`,
      explanation: "5+ recipes is enough for a meaningful recipe book.",
      actionLabel: "Create Recipe Book",
      actionHref: "/app/studio/create?type=recipe_book",
      confidence: "high",
      confidenceScore: 85,
    });
  }

  if (photoCount >= 20) {
    recs.push({
      type: "creative_recommendation",
      title: "You've preserved enough photographs for a memory slideshow",
      description: `With ${photoCount} photos, the AI can create a beautiful slideshow video set to music.`,
      explanation: "20+ photos is ideal for a slideshow video.",
      actionLabel: "Create Slideshow",
      actionHref: "/app/studio/create-video",
      confidence: "high",
      confidenceScore: 85,
    });
  }

  // Missing voice recordings
  if (peopleData.length > 0 && voiceCount === 0) {
    recs.push({
      type: "missing_voice",
      title: "No voice recordings in your archive",
      description: "Voice recordings capture the tone and personality of your family members.",
      explanation: "0 voice recordings found despite having people in the archive.",
      actionLabel: "Add Voice Recording",
      actionHref: "/app/voice",
      confidence: "medium",
      confidenceScore: 60,
    });
  }

  // Missing traditions
  if (peopleData.length > 0 && traditionCount === 0) {
    recs.push({
      type: "missing_tradition",
      title: "No traditions documented yet",
      description: "Traditions are the customs and rituals that connect generations.",
      explanation: "0 traditions found despite having people in the archive.",
      actionLabel: "Add Tradition",
      actionHref: "/app/traditions",
      confidence: "medium",
      confidenceScore: 60,
    });
  }

  // Missing places
  if (memCount > 5 && placeCount === 0) {
    recs.push({
      type: "missing_location",
      title: "No places documented yet",
      description: "Documenting significant locations adds geographic context to your memories.",
      explanation: "0 places found despite having 5+ memories.",
      actionLabel: "Add Place",
      actionHref: "/app/places",
      confidence: "low",
      confidenceScore: 40,
    });
  }

  // Insert suggestions (avoid duplicates)
  for (const rec of recs) {
    const { data: existing } = await supabase.from("ai_suggestions")
      .select("id")
      .eq("suggestion_type", rec.type)
      .eq("title", rec.title)
      .eq("status", "pending")
      .maybeSingle();
    if (!existing) {
      count++;
      await supabase.from("ai_suggestions").insert({
        user_id: userId,
        suggestion_type: rec.type,
        title: rec.title,
        description: rec.description,
        explanation: rec.explanation,
        confidence: rec.confidence,
        confidence_score: rec.confidenceScore,
        action_label: rec.actionLabel,
        action_href: rec.actionHref,
      });
    }
  }

  return { recommendations_count: count };
}

async function generateIntelligentNotifications(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  const [activities, people, photos, memories] = await Promise.all([
    supabase.from("activity_feed").select("created_at, entity_type").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    supabase.from("people").select("id, full_name").eq("user_id", userId),
    supabase.from("photos").select("id, title, caption, description").eq("user_id", userId),
    supabase.from("memories").select("id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
  ]);

  let count = 0;
  const notifs: { type: string; title: string; body: string; actionLabel: string; actionHref: string }[] = [];

  // Check if user hasn't added a memory in a while
  const lastActivity = activities.data?.[0] as Record<string, unknown> | undefined;
  if (lastActivity?.created_at) {
    const days = Math.floor((Date.now() - new Date(String(lastActivity.created_at)).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 14) {
      notifs.push({
        type: "inactivity_reminder",
        title: "You haven't added a memory in a while",
        body: `It's been ${days} days since your last activity. Every story preserved is a gift to future generations.`,
        actionLabel: "Add a Memory",
        actionHref: "/app/memories",
      });
    }
  }

  // Check for photos without descriptions
  const photosWithoutDesc = (photos.data ?? []).filter((p: Record<string, unknown>) => !p.caption && !p.description);
  if (photosWithoutDesc.length >= 3) {
    notifs.push({
      type: "undescribed_photos",
      title: "You have several photographs without descriptions",
      body: `${photosWithoutDesc.length} photos have no caption or description. Adding descriptions helps future generations understand the context.`,
      actionLabel: "View Photos",
      actionHref: "/app/photos",
    });
  }

  // Check for people without memories
  const peopleData = people.data ?? [];
  if (peopleData.length > 0 && (memories.data?.length ?? 0) === 0) {
    notifs.push({
      type: "no_memories",
      title: "You have people but no memories yet",
      body: "Start adding stories to bring your family members to life in the archive.",
      actionLabel: "Add a Memory",
      actionHref: "/app/memories",
    });
  }

  for (const n of notifs) {
    const { data: existing } = await supabase.from("intelligent_notifications")
      .select("id")
      .eq("notification_type", n.type)
      .eq("is_dismissed", false)
      .maybeSingle();
    if (!existing) {
      count++;
      await supabase.from("intelligent_notifications").insert({
        user_id: userId,
        notification_type: n.type,
        title: n.title,
        body: n.body,
        action_label: n.actionLabel,
        action_href: n.actionHref,
      });
    }
  }

  return { notifications_count: count };
}
