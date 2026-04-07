import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.1-8b-instant";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
  }

  const { checkpoint, userSpeech, profile, mode = "coaching" } = req.body ?? {};

  if (!checkpoint || !userSpeech || !profile) {
    return res.status(400).json({ error: "Missing required fields: checkpoint, userSpeech, profile" });
  }

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
    `Learner profile: age=${profile.age}, role=${profile.role}, language=${profile.preferredLanguage ?? profile.preferred_language}.`,
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

  try {
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
      const text = await response.text();
      console.error(`[ai/evaluate] Groq API error ${response.status}:`, text);
      return res.status(502).json({ error: "Upstream AI service error", status: response.status });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: "No content in AI response" });
    }

    const parsed = JSON.parse(content);

    if (typeof parsed.accepted !== "boolean" || typeof parsed.feedback !== "string") {
      return res.status(502).json({ error: "Invalid AI response shape" });
    }

    return res.status(200).json({
      accepted: parsed.accepted,
      feedback: parsed.feedback,
      extractedValue: parsed.extractedValue ?? "",
      coachingTip: parsed.coachingTip ?? "",
    });
  } catch (err) {
    console.error("[ai/evaluate] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
