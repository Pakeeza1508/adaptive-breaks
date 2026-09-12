import type { SceneState } from "../engine/sceneEngine";

type AnalyzeSceneResponse = {
  scene: {
    energy: SceneState["energy"];
    tension: SceneState["tension"];
    attention: SceneState["attention"];
    primary_state: SceneState["primaryState"];
    confidence: number;
    safety: SceneState["safety"];
  };
  provider: string;
};

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function analyzeScene(
  text: string,
): Promise<SceneState> {
  if (
    !supabaseUrl ||
    !supabasePublishableKey
  ) {
    throw new Error(
      "Missing Supabase frontend environment variables.",
    );
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/analyze-scene`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabasePublishableKey,
      },
      body: JSON.stringify({
        text,
      }),
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "Could not analyze scene.",
    );
  }

  const result =
    data as AnalyzeSceneResponse;

  return {
    energy: result.scene.energy,
    tension: result.scene.tension,
    attention: result.scene.attention,
    primaryState:
      result.scene.primary_state,
    confidence:
      result.scene.confidence,
    safety: result.scene.safety,
    matchedSignals: [
      `provider:${result.provider}`,
    ],
  };
}
