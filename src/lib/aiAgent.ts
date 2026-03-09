import { Checkpoint } from "@/data/airportScenario";
import { UserProfile } from "@/lib/userProfile";

export type AgentMode = "coaching" | "realistic";

export interface AgentCheckpointResult {
  accepted: boolean;
  feedback: string;
  extractedValue?: string;
  coachingTip?: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.1-8b-instant";

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
  profile: UserProfile,
  mode: AgentMode
): AgentCheckpointResult => {
  const accepted = isAcceptedByRules(checkpoint, userSpeech);
  const firstName = profile.name.split(" ")[0] || profile.name;

  if (!accepted) {
    if (mode === "realistic") {
      return {
        accepted: false,
        feedback: "Sorry, I didn’t catch that. Please answer clearly with the required booking detail.",
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
      feedback: checkpoint.successResponse, // continue as staff, not tutor
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
  profile: UserProfile,
  mode: AgentMode = "coaching"
): Promise<AgentCheckpointResult> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[aiAgent] Missing VITE_GROQ_API_KEY. Using local fallback evaluator.");
    return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
  }

  try {
    const modeInstruction =
      mode === "realistic"
        ? [
            "Mode: REALISTIC.",
            "You are a busy airport check-in staff member in a real interaction.",
            "Do NOT coach, teach, or suggest how the learner should answer.",
            "If the response is unclear/incomplete, ask a short natural clarification question.",
            "Keep tone professional and time-pressured.",
            'Set coachingTip to an empty string ("").',
          ].join(" ")
        : [
            "Mode: COACHING.",
            "You are a supportive airport check-in roleplay coach.",
            "If not accepted, gently guide the learner with an example answer.",
            "If accepted, acknowledge and continue naturally as check-in staff.",
            "Provide a short coachingTip.",
          ].join(" ");

    const systemPrompt = [
      "Output only valid compact JSON with keys: accepted (boolean), feedback (string), extractedValue (string), coachingTip (string).",
      "accepted should be true only if the user's latest response satisfies the checkpoint intent.",
      `Learner profile: age=${profile.age}, role=${profile.role}, language=${profile.preferredLanguage}.`,
      modeInstruction,
    ].join(" ");

    const userPrompt = JSON.stringify({
      mode,
      checkpointId: checkpoint.id,
      mascotPrompt: checkpoint.mascotPrompt,
      hintPrompt: checkpoint.hintPrompt,
      keywords: checkpoint.keywords,
      expectedField: checkpoint.extractField,
      userSpeech,
    });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: mode === "realistic" ? 0.5 : 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`[aiAgent] Groq API returned status ${response.status}. Using fallback evaluator.`);
      return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[aiAgent] Groq payload had no message content. Using fallback evaluator.");
      return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
    }

    const parsed = JSON.parse(content) as Partial<AgentCheckpointResult>;
    if (typeof parsed.accepted !== "boolean" || typeof parsed.feedback !== "string") {
      console.warn("[aiAgent] Groq response JSON shape invalid. Using fallback evaluator.");
      return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
    }

    return {
      accepted: parsed.accepted,
      feedback: parsed.feedback,
      extractedValue: parsed.extractedValue,
      coachingTip: parsed.coachingTip ?? (mode === "realistic" ? "" : undefined),
    };
  } catch {
    console.warn("[aiAgent] Groq request failed unexpectedly. Using fallback evaluator.");
    return fallbackAnalyze(checkpoint, userSpeech, profile, mode);
  }
};
