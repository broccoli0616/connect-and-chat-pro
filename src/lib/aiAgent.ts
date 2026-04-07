import { Checkpoint } from "@/data/airportScenario";

export type AgentMode = "coaching" | "realistic";

export interface AgentCheckpointResult {
  accepted: boolean;
  feedback: string;
  extractedValue?: string;
  coachingTip?: string;
}

export interface AgentProfile {
  name: string;
  age: string | number | null;
  role: string;
  preferredLanguage?: string;
  preferred_language?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

const isAcceptedByRules = (checkpoint: Checkpoint, userSpeech: string) => {
  const lower = normalize(userSpeech);
  if (checkpoint.id === "greeting") {
    return lower.length >= 3;
  }
  return checkpoint.keywords.some((kw) => lower.includes(normalize(kw)));
};

const fallbackAnalyze = (
  checkpoint: Checkpoint,
  userSpeech: string,
  profile: AgentProfile,
  mode: AgentMode
): AgentCheckpointResult => {
  const accepted = isAcceptedByRules(checkpoint, userSpeech);
  const firstName = profile.name.split(" ")[0] || profile.name;

  if (!accepted) {
    if (mode === "realistic") {
      return {
        accepted: false,
        feedback: "Sorry, I didn't catch that. Please answer clearly with the required booking detail.",
        extractedValue: "",
      };
    }

    return {
      accepted: false,
      feedback: `${firstName}, ${checkpoint.hintPrompt}`,
      coachingTip:
        "Try a short complete sentence so the counter staff can understand quickly.",
    };
  }

  if (mode === "realistic") {
    return {
      accepted: true,
      feedback: checkpoint.successResponse,
      extractedValue: userSpeech,
      coachingTip: "",
    };
  }

  return {
    accepted: true,
    feedback: checkpoint.successResponse,
    extractedValue: userSpeech,
    coachingTip: "Nice work. Keep your tone clear and confident.",
  };
};

export const analyzeCheckpointWithAgent = async (
  checkpoint: Checkpoint,
  userSpeech: string,
  profile: AgentProfile,
  mode: AgentMode = "coaching"
): Promise<AgentCheckpointResult> => {
  try {
    const response = await fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpoint, userSpeech, profile, mode }),
    });

    if (!response.ok) {
      console.warn(`[aiAgent] Server API returned status ${response.status}. Using fallback evaluator.`);
      return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
    }

    const parsed = await response.json();

    if (typeof parsed.accepted !== "boolean" || typeof parsed.feedback !== "string") {
      console.warn("[aiAgent] Server response shape invalid. Using fallback evaluator.");
      return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
    }

    return {
      accepted: parsed.accepted,
      feedback: parsed.feedback,
      extractedValue: parsed.extractedValue,
      coachingTip: parsed.coachingTip ?? (mode === "realistic" ? "" : undefined),
    };
  } catch {
    console.warn("[aiAgent] Server request failed. Using fallback evaluator.");
    return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
  }
};
