import type {
  BreakMode,
  PrimaryState,
  SceneState,
} from "../engine/sceneEngine";

import type {
  FeedbackOutcome,
} from "../engine/personalization";

const CLIENT_ID_KEY =
  "kya-scene-hai-client-id-v1";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey =
  import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY;

function requireConfig() {
  if (
    !supabaseUrl ||
    !supabasePublishableKey
  ) {
    throw new Error(
      "Missing Supabase frontend environment variables.",
    );
  }
}

export function getClientId() {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  const existing =
    localStorage.getItem(
      CLIENT_ID_KEY,
    );

  if (existing) {
    return existing;
  }

  const created =
    crypto.randomUUID();

  localStorage.setItem(
    CLIENT_ID_KEY,
    created,
  );

  return created;
}

async function callFeedback(
  body: unknown,
) {
  requireConfig();

  const response = await fetch(
    `${supabaseUrl}/functions/v1/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        apikey:
          supabasePublishableKey,
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "Feedback service failed.",
    );
  }

  return data;
}

export async function saveFeedback({
  scene,
  mode,
  outcome,
  challengeTitle,
  challengeDuration,
  availableTime,
  startedAt,
}: {
  scene: SceneState;
  mode: BreakMode;
  outcome: FeedbackOutcome;
  challengeTitle: string;
  challengeDuration: number;
  availableTime: number;
  startedAt: number;
}) {
  return callFeedback({
    action: "record",
    clientId: getClientId(),
    scene,
    mode,
    outcome,
    challengeTitle,
    challengeDuration,
    availableTime,
    startedAt,
  });
}

export async function getRemoteModeBonuses(
  primaryState: PrimaryState,
): Promise<
  Partial<Record<BreakMode, number>>
> {
  const data = await callFeedback({
    action: "summary",
    clientId: getClientId(),
    primaryState,
  });

  return data.bonuses ?? {};
}
