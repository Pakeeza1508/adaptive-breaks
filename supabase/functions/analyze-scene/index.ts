const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Energy = "low" | "normal" | "high";
type Tension = "low" | "medium" | "high";
type Attention = "okay" | "scattered" | "stuck";
type PrimaryState = "drained" | "overwhelmed" | "distracted" | "stuck";
type Safety = "normal" | "elevated";

type SceneState = {
  energy: Energy;
  tension: Tension;
  attention: Attention;
  primary_state: PrimaryState;
  confidence: number;
  safety: Safety;
};

const responseSchema = {
  type: "object",
  properties: {
    energy: {
      type: "string",
      enum: ["low", "normal", "high"],
    },
    tension: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    attention: {
      type: "string",
      enum: ["okay", "scattered", "stuck"],
    },
    primary_state: {
      type: "string",
      enum: ["drained", "overwhelmed", "distracted", "stuck"],
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Uncalibrated confidence in the state extraction. Use lower confidence for ambiguous inputs.",
    },
    safety: {
      type: "string",
      enum: ["normal", "elevated"],
    },
  },
  required: [
    "energy",
    "tension",
    "attention",
    "primary_state",
    "confidence",
    "safety",
  ],
  additionalProperties: false,
};

const systemInstruction = `
You are the state-extraction component of a NON-CLINICAL adaptive micro-break app
for students and knowledge workers.

Your only job is to map a short user statement to a bounded momentary work/study
state. Do not diagnose mental illness. Do not act as a therapist. Do not recommend
a break. Do not generate conversational advice.

Labels:

ENERGY
- low: tired, drained, sleepy, mentally flat
- normal: no strong energy signal
- high: restless, overactivated, unable to settle

TENSION
- low: no meaningful tension signal
- medium: frustration, annoyance, moderate pressure
- high: panic, acute overload, intense exam/deadline pressure

ATTENTION
- okay: no dominant attention issue
- scattered: attention repeatedly shifts/wanders
- stuck: attention is locked on one task/problem/loop with little progress

PRIMARY STATE priority:
1. overwhelmed when high tension/overload dominates
2. stuck when the person is locked in one problem loop
3. distracted when attention is scattered
4. drained when low energy is dominant

Understand natural English, Roman Urdu, and Pakistani Urdu-English code mixing.
Examples of ordinary non-clinical language include:
"I'm cooked", "dimagh band hogaya", "focus nai ho raha",
"kal exam hai aur bohat pressure hai", "same bug 40 mins se dekh raha hun".

confidence is an UNCALIBRATED model estimate:
- use ~0.85-0.95 only for very clear inputs
- use ~0.60-0.80 for moderately clear inputs
- use ~0.40-0.59 for ambiguous inputs

Return only the schema.
`;

const highRiskPattern =
  /\b(kill myself|end my life|suicide|suicidal|hurt myself|harm myself|want to die|don't want to live|do not want to live|khudkushi|khud kushi|mar jana chahta|mar jana chahti|mar jaon|mar jaun)\b/i;

function elevatedSafetyState(): SceneState {
  return {
    energy: "low",
    tension: "high",
    attention: "stuck",
    primary_state: "overwhelmed",
    confidence: 1,
    safety: "elevated",
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function extractTextFromInteraction(data: any): string | null {
  const steps = Array.isArray(data?.steps) ? data.steps : [];

  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i];

    if (step?.type !== "model_output" || !Array.isArray(step?.content)) {
      continue;
    }

    for (let j = step.content.length - 1; j >= 0; j -= 1) {
      const content = step.content[j];

      if (content?.type === "text" && typeof content?.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return jsonResponse({ error: "text is required" }, 400);
    }

    if (text.length > 1000) {
      return jsonResponse({ error: "text is too long" }, 400);
    }

    // Safety routing is intentionally outside the playful intervention policy.
    if (highRiskPattern.test(text)) {
      return jsonResponse({
        scene: elevatedSafetyState(),
        provider: "local-safety-gate",
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return jsonResponse({ error: "AI service is not configured" }, 500);
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.5-flash-lite",
          system_instruction: systemInstruction,
          input: `Classify this momentary study/work statement:\n\n${text}`,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: responseSchema,
          },
          generation_config: {
            thinking_level: "minimal",
            max_output_tokens: 180,
          },
          store: false,
        }),
      },
    );

    const raw = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", raw);

      const status =
        geminiResponse.status === 429
          ? 429
          : geminiResponse.status >= 500
            ? 503
            : 502;

      return jsonResponse(
        {
          error:
            status === 429
              ? "AI service is busy. Please try again."
              : "Could not analyze the scene.",
        },
        status,
      );
    }

    const outputText = extractTextFromInteraction(raw);

    if (!outputText) {
      console.error("No text output in Gemini response:", raw);
      return jsonResponse({ error: "Invalid AI response" }, 502);
    }

    let scene: SceneState;

    try {
      scene = JSON.parse(outputText);
    } catch {
      console.error("Could not parse structured output:", outputText);
      return jsonResponse({ error: "Invalid structured AI response" }, 502);
    }

    return jsonResponse({
      scene,
      provider: "gemini-3.5-flash-lite",
    });
  } catch (error) {
    console.error("analyze-scene error:", error);
    return jsonResponse({ error: "Unexpected server error" }, 500);
  }
});
