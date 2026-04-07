import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface MultiplayerState {
  sessionId: string | null;
  currentTurn: string | null;
  opponentName: string | null;
  state: "active" | "completed" | "abandoned";
}

interface TurnEvent {
  playerId: string;
  checkpointId: string;
  userSpeech: string;
  accepted: boolean;
}

export const useMultiplayerSession = (sessionId: string | null, userId: string | null) => {
  const [mpState, setMpState] = useState<MultiplayerState>({
    sessionId: null,
    currentTurn: null,
    opponentName: null,
    state: "active",
  });
  const [latestTurn, setLatestTurn] = useState<TurnEvent | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    setMpState((prev) => ({ ...prev, sessionId }));

    // Subscribe to the broadcast channel for this session
    const channel = supabase.channel(`mp-session:${sessionId}`);

    channel
      .on("broadcast", { event: "turn_submitted" }, (payload) => {
        const data = payload.payload as TurnEvent;
        if (data.playerId !== userId) {
          setLatestTurn(data);
        }
      })
      .on("broadcast", { event: "checkpoint_advanced" }, (payload) => {
        setMpState((prev) => ({
          ...prev,
          currentTurn: payload.payload.nextTurn as string,
        }));
      })
      .on("broadcast", { event: "session_ended" }, () => {
        setMpState((prev) => ({ ...prev, state: "completed" }));
      })
      .subscribe();

    // Fetch initial session state
    supabase
      .from("multiplayer_sessions")
      .select("*, player_a_profile:profiles!player_a(name), player_b_profile:profiles!player_b(name)")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) {
          const isPlayerA = data.player_a === userId;
          const opponentProfile = isPlayerA
            ? (data.player_b_profile as { name: string })
            : (data.player_a_profile as { name: string });

          setMpState((prev) => ({
            ...prev,
            currentTurn: data.current_turn,
            opponentName: opponentProfile?.name ?? "Opponent",
            state: data.state,
          }));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  const submitTurn = useCallback(
    async (checkpointId: string, userSpeech: string, accepted: boolean) => {
      if (!sessionId || !userId) return;

      // Insert turn record
      await supabase.from("multiplayer_turns").insert({
        session_id: sessionId,
        player_id: userId,
        checkpoint_id: checkpointId,
        user_speech: userSpeech,
        accepted,
      });

      // Broadcast to opponent
      const channel = supabase.channel(`mp-session:${sessionId}`);
      await channel.send({
        type: "broadcast",
        event: "turn_submitted",
        payload: { playerId: userId, checkpointId, userSpeech, accepted },
      });
    },
    [sessionId, userId]
  );

  const advanceCheckpoint = useCallback(
    async (nextTurn: string) => {
      if (!sessionId) return;

      await supabase
        .from("multiplayer_sessions")
        .update({ current_turn: nextTurn })
        .eq("id", sessionId);

      const channel = supabase.channel(`mp-session:${sessionId}`);
      await channel.send({
        type: "broadcast",
        event: "checkpoint_advanced",
        payload: { nextTurn },
      });
    },
    [sessionId]
  );

  const endSession = useCallback(async () => {
    if (!sessionId) return;

    await supabase
      .from("multiplayer_sessions")
      .update({ state: "completed" })
      .eq("id", sessionId);

    const channel = supabase.channel(`mp-session:${sessionId}`);
    await channel.send({
      type: "broadcast",
      event: "session_ended",
      payload: {},
    });
  }, [sessionId]);

  const isMyTurn = mpState.currentTurn === userId;

  return {
    ...mpState,
    latestTurn,
    isMyTurn,
    submitTurn,
    advanceCheckpoint,
    endSession,
  };
};
