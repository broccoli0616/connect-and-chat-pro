// Supabase Edge Function: Matchmaking
// Deploy with: supabase functions deploy matchmake

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { scenarioId = "airport-checkin" } = await req.json();

    // Use service role for matchmaking operations (bypasses RLS)
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Insert or update queue entry
    await admin.from("matchmaking_queue").upsert(
      { user_id: user.id, scenario_id: scenarioId, joined_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    // Check for another waiting player on the same scenario
    const { data: waitingPlayers } = await admin
      .from("matchmaking_queue")
      .select("user_id")
      .eq("scenario_id", scenarioId)
      .is("matched_session_id", null)
      .neq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (!waitingPlayers?.length) {
      return new Response(
        JSON.stringify({ status: "waiting", message: "Waiting for an opponent..." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const opponentId = waitingPlayers[0].user_id;

    // Create multiplayer session
    const { data: session, error: sessionError } = await admin
      .from("multiplayer_sessions")
      .insert({
        player_a: opponentId, // first in queue
        player_b: user.id,
        scenario_id: scenarioId,
        current_turn: opponentId, // player_a goes first
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update both queue entries with the session ID
    await admin
      .from("matchmaking_queue")
      .update({ matched_session_id: session.id })
      .in("user_id", [user.id, opponentId]);

    // Clean up queue entries
    await admin
      .from("matchmaking_queue")
      .delete()
      .in("user_id", [user.id, opponentId]);

    return new Response(
      JSON.stringify({
        status: "matched",
        sessionId: session.id,
        opponentId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[matchmake] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
