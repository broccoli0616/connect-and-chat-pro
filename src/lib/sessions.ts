import { supabase } from "@/lib/supabase";

export interface SessionRecord {
  id: string;
  user_id: string;
  scenario_id: string;
  mode: "voice" | "aac" | "text";
  ai_mode: "coaching" | "realistic" | null;
  started_at: string;
  completed_at: string | null;
  is_complete: boolean;
}

export interface CheckpointResultRecord {
  id: string;
  session_id: string;
  checkpoint_id: string;
  user_speech: string | null;
  accepted: boolean;
  feedback: string | null;
  extracted_value: string | null;
  coaching_tip: string | null;
  attempts: number;
  responded_at: string;
}

export const createSession = async (
  userId: string,
  scenarioId: string,
  mode: "voice" | "aac" | "text",
  aiMode?: "coaching" | "realistic"
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, scenario_id: scenarioId, mode, ai_mode: aiMode ?? null })
    .select("id")
    .single();

  if (error) {
    console.warn("[sessions] Failed to create session:", error.message);
    return null;
  }
  return data.id;
};

export const recordCheckpointResult = async (
  sessionId: string,
  result: {
    checkpointId: string;
    userSpeech: string;
    accepted: boolean;
    feedback?: string;
    extractedValue?: string;
    coachingTip?: string;
    attempts?: number;
  }
): Promise<void> => {
  const { error } = await supabase.from("checkpoint_results").insert({
    session_id: sessionId,
    checkpoint_id: result.checkpointId,
    user_speech: result.userSpeech,
    accepted: result.accepted,
    feedback: result.feedback ?? null,
    extracted_value: result.extractedValue ?? null,
    coaching_tip: result.coachingTip ?? null,
    attempts: result.attempts ?? 1,
  });

  if (error) {
    console.warn("[sessions] Failed to record checkpoint result:", error.message);
  }
};

export const completeSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from("sessions")
    .update({ is_complete: true, completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    console.warn("[sessions] Failed to complete session:", error.message);
  }
};

export const getUserSessions = async (userId: string): Promise<SessionRecord[]> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error) {
    console.warn("[sessions] Failed to fetch sessions:", error.message);
    return [];
  }
  return data as SessionRecord[];
};
