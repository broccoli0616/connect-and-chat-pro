import { supabase } from "@/lib/supabase";
import type { Profile } from "@/components/AuthProvider";

export interface LearnerWithStats {
  learner: Profile;
  supportNeed: string | null;
  notes: string | null;
  weeklyGoal: number;
  linkedAt: string;
  completedSessions: number;
  totalSessions: number;
  acceptanceRate: number;
  lastActive: string | null;
}

export const getTherapistLearners = async (
  therapistId: string
): Promise<LearnerWithStats[]> => {
  // Fetch therapist-learner links with learner profiles
  const { data: links, error: linksError } = await supabase
    .from("therapist_learners")
    .select("*, learner:profiles!learner_id(*)")
    .eq("therapist_id", therapistId);

  if (linksError || !links) {
    console.warn("[therapistData] Failed to fetch learners:", linksError?.message);
    return [];
  }

  // Fetch aggregated stats
  const { data: stats, error: statsError } = await supabase
    .from("learner_stats")
    .select("*");

  if (statsError) {
    console.warn("[therapistData] Failed to fetch stats:", statsError.message);
  }

  const statsMap = new Map(
    (stats ?? []).map((s: Record<string, unknown>) => [s.user_id as string, s])
  );

  return links.map((link: Record<string, unknown>) => {
    const learner = link.learner as Profile;
    const learnerStats = statsMap.get(learner.id) as Record<string, unknown> | undefined;

    return {
      learner,
      supportNeed: link.support_need as string | null,
      notes: link.notes as string | null,
      weeklyGoal: (link.weekly_goal as number) ?? 12,
      linkedAt: link.linked_at as string,
      completedSessions: (learnerStats?.completed_sessions as number) ?? 0,
      totalSessions: (learnerStats?.total_sessions as number) ?? 0,
      acceptanceRate: (learnerStats?.acceptance_rate as number) ?? 0,
      lastActive: (learnerStats?.last_active as string) ?? null,
    };
  });
};

export const addLearnerByEmail = async (
  therapistId: string,
  learnerEmail: string
): Promise<{ error: string | null }> => {
  // Look up the learner's profile by matching auth email
  // We need to find the user by email through profiles + auth
  const { data: users, error: lookupError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("role", "learner");

  if (lookupError || !users) {
    return { error: "Failed to look up learner." };
  }

  // Since we can't directly query auth.users from client, we use a workaround:
  // The therapist enters the learner's name instead, or we match by a shared code.
  // For now, this is a simplified version that requires the learner's user ID.
  // In production, you'd use a Supabase Edge Function to look up by email.

  // Simplified: search by name (case-insensitive partial match)
  const { data: matchedProfiles, error: matchError } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("role", "learner")
    .ilike("name", `%${learnerEmail}%`);

  if (matchError || !matchedProfiles?.length) {
    return { error: "No learner found with that name." };
  }

  const learnerId = matchedProfiles[0].id;

  const { error: insertError } = await supabase.from("therapist_learners").insert({
    therapist_id: therapistId,
    learner_id: learnerId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This learner is already linked to you." };
    }
    return { error: insertError.message };
  }

  return { error: null };
};

export const updateLearnerNotes = async (
  therapistId: string,
  learnerId: string,
  updates: { notes?: string; supportNeed?: string; weeklyGoal?: number }
): Promise<{ error: string | null }> => {
  const payload: Record<string, unknown> = {};
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.supportNeed !== undefined) payload.support_need = updates.supportNeed;
  if (updates.weeklyGoal !== undefined) payload.weekly_goal = updates.weeklyGoal;

  const { error } = await supabase
    .from("therapist_learners")
    .update(payload)
    .eq("therapist_id", therapistId)
    .eq("learner_id", learnerId);

  if (error) return { error: error.message };
  return { error: null };
};
