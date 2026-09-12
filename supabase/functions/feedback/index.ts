const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STATES = new Set([
  "drained",
  "overwhelmed",
  "distracted",
  "stuck",
]);

const ENERGIES = new Set([
  "low",
  "normal",
  "high",
]);

const TENSIONS = new Set([
  "low",
  "medium",
  "high",
]);

const ATTENTIONS = new Set([
  "okay",
  "scattered",
  "stuck",
]);

const MODES = [
  "downshift",
  "activate",
  "refocus",
  "detach",
] as const;

const FEEDBACK = new Set([
  "better",
  "same",
  "worse",
]);

type BreakMode = (typeof MODES)[number];

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function rewardFor(
  feedback: string,
) {
  if (feedback === "better") return 1;
  if (feedback === "worse") return -1;
  return 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      { headers: corsHeaders },
    );
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    console.error(
      "Missing Supabase server secrets.",
    );

    return jsonResponse(
      {
        error:
          "Feedback service is not configured.",
      },
      500,
    );
  }

  try {
    const body =
      await req.json().catch(() => null);

    if (!body) {
      return jsonResponse(
        { error: "Invalid JSON body." },
        400,
      );
    }

    if (body.action === "summary") {
      const {
        clientId,
        primaryState,
      } = body;

      if (
        !isUuid(clientId) ||
        !STATES.has(primaryState)
      ) {
        return jsonResponse(
          {
            error:
              "Invalid summary request.",
          },
          400,
        );
      }

      const url = new URL(
        `${supabaseUrl}/rest/v1/break_feedback`,
      );

      url.searchParams.set(
        "select",
        "break_mode,feedback,challenge_title",
      );

      url.searchParams.set(
        "client_id",
        `eq.${clientId}`,
      );

      url.searchParams.set(
        "primary_state",
        `eq.${primaryState}`,
      );

      url.searchParams.set(
        "order",
        "created_at.desc",
      );

      url.searchParams.set(
        "limit",
        "100",
      );

      const response = await fetch(
        url.toString(),
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization:
              `Bearer ${serviceRoleKey}`,
          },
        },
      );

      if (!response.ok) {
        console.error(
          "Feedback summary query failed:",
          await response.text(),
        );

        return jsonResponse(
          {
            error:
              "Could not load personalization.",
          },
          502,
        );
      }

      const rows =
        await response.json();

      const stats: Record<
        BreakMode,
        {
          attempts: number;
          rewardSum: number;
        }
      > = {
        downshift: {
          attempts: 0,
          rewardSum: 0,
        },
        activate: {
          attempts: 0,
          rewardSum: 0,
        },
        refocus: {
          attempts: 0,
          rewardSum: 0,
        },
        detach: {
          attempts: 0,
          rewardSum: 0,
        },
      };

      const challengeStats: Record<
        string,
        {
          attempts: number;
          rewardSum: number;
        }
      > = {};

      for (const row of rows) {
        if (
          MODES.includes(
            row.break_mode,
          )
        ) {
          const mode =
            row.break_mode as BreakMode;

          stats[mode].attempts += 1;
          stats[mode].rewardSum +=
            rewardFor(row.feedback);
        }

        if (
          typeof row.challenge_title === "string" &&
          row.challenge_title.trim()
        ) {
          const title =
            row.challenge_title.trim();

          challengeStats[title] ??= {
            attempts: 0,
            rewardSum: 0,
          };

          challengeStats[title].attempts += 1;
          challengeStats[title].rewardSum +=
            rewardFor(row.feedback);
        }
      }

      const bonuses: Record<
        BreakMode,
        number
      > = {
        downshift: 0,
        activate: 0,
        refocus: 0,
        detach: 0,
      };

      for (const mode of MODES) {
        const entry =
          stats[mode];

        if (
          entry.attempts === 0
        ) {
          continue;
        }

        const averageReward =
          entry.rewardSum /
          entry.attempts;

        const evidenceWeight =
          Math.min(
            entry.attempts / 4,
            1,
          );

        bonuses[mode] =
          averageReward *
          evidenceWeight *
          0.35;
      }

      const challengeBonuses:
        Record<string, number> = {};

      for (
        const [title, entry]
        of Object.entries(challengeStats)
      ) {
        const averageReward =
          entry.rewardSum / entry.attempts;

        const evidenceWeight =
          Math.min(entry.attempts / 3, 1);

        challengeBonuses[title] =
          averageReward *
          evidenceWeight *
          0.45;
      }

      return jsonResponse({
        bonuses,
        challengeBonuses,
        observations: rows.length,
      });
    }

    if (
      body.action ===
      "record_correction"
    ) {
      const {
        clientId,
        predictedScene,
        correctedState,
      } = body;

      if (
        !isUuid(clientId) ||
        !predictedScene ||
        !STATES.has(predictedScene.primaryState) ||
        !STATES.has(correctedState) ||
        !ENERGIES.has(predictedScene.energy) ||
        !TENSIONS.has(predictedScene.tension) ||
        !ATTENTIONS.has(predictedScene.attention)
      ) {
        return jsonResponse(
          { error: "Invalid correction payload." },
          400,
        );
      }

      if (
        predictedScene.primaryState ===
        correctedState
      ) {
        return jsonResponse({
          saved: false,
          reason: "No correction required.",
        });
      }

      const row = {
        client_id: clientId,
        predicted_state:
          predictedScene.primaryState,
        corrected_state: correctedState,
        predicted_energy:
          predictedScene.energy,
        predicted_tension:
          predictedScene.tension,
        predicted_attention:
          predictedScene.attention,
        scene_confidence:
          Number.isFinite(predictedScene.confidence)
            ? Math.max(
                0,
                Math.min(1, predictedScene.confidence),
              )
            : null,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/scene_corrections`,
        {
          method: "POST",
          headers: {
            apikey: serviceRoleKey,
            Authorization:
              `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(row),
        },
      );

      if (!response.ok) {
        console.error(
          "Scene correction insert failed:",
          await response.text(),
        );

        return jsonResponse(
          { error: "Could not save correction." },
          502,
        );
      }

      return jsonResponse({ saved: true });
    }

    if (body.action === "record") {
      const {
        clientId,
        scene,
        mode,
        outcome,
        challengeTitle,
        challengeDuration,
        availableTime,
        startedAt,
      } = body;

      if (
        !isUuid(clientId) ||
        !scene ||
        !STATES.has(
          scene.primaryState,
        ) ||
        !ENERGIES.has(
          scene.energy,
        ) ||
        !TENSIONS.has(
          scene.tension,
        ) ||
        !ATTENTIONS.has(
          scene.attention,
        ) ||
        !MODES.includes(mode) ||
        !FEEDBACK.has(outcome)
      ) {
        return jsonResponse(
          {
            error:
              "Invalid feedback payload.",
          },
          400,
        );
      }

      const row = {
        client_id: clientId,
        primary_state:
          scene.primaryState,
        energy: scene.energy,
        tension: scene.tension,
        attention:
          scene.attention,
        break_mode: mode,
        feedback: outcome,
        challenge_title:
          typeof challengeTitle ===
          "string"
            ? challengeTitle.slice(
                0,
                200,
              )
            : null,
        challenge_duration_seconds:
          Number.isFinite(
            challengeDuration,
          )
            ? Math.round(
                challengeDuration,
              )
            : null,
        available_time_seconds:
          Number.isFinite(
            availableTime,
          )
            ? Math.round(
                availableTime,
              )
            : null,
        scene_confidence:
          Number.isFinite(
            scene.confidence,
          )
            ? Math.max(
                0,
                Math.min(
                  1,
                  scene.confidence,
                ),
              )
            : null,
        break_started_at:
          Number.isFinite(
            startedAt,
          )
            ? new Date(
                startedAt,
              ).toISOString()
            : null,
      };

      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/break_feedback`,
          {
            method: "POST",
            headers: {
              apikey:
                serviceRoleKey,
              Authorization:
                `Bearer ${serviceRoleKey}`,
              "Content-Type":
                "application/json",
              Prefer:
                "return=minimal",
            },
            body: JSON.stringify(
              row,
            ),
          },
        );

      if (!response.ok) {
        console.error(
          "Feedback insert failed:",
          await response.text(),
        );

        return jsonResponse(
          {
            error:
              "Could not save feedback.",
          },
          502,
        );
      }

      return jsonResponse({
        saved: true,
      });
    }

    return jsonResponse(
      {
        error:
          "Unknown feedback action.",
      },
      400,
    );
  } catch (error) {
    console.error(
      "feedback function error:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Unexpected feedback service error.",
      },
      500,
    );
  }
});
