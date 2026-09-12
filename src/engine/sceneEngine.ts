export type Energy = "low" | "normal" | "high";
export type Tension = "low" | "medium" | "high";
export type Attention = "okay" | "scattered" | "stuck";

export type PrimaryState =
  | "drained"
  | "overwhelmed"
  | "distracted"
  | "stuck";

export type BreakMode =
  | "downshift"
  | "activate"
  | "refocus"
  | "detach";

export type SafetyLevel = "normal" | "elevated";

export type SceneState = {
  energy: Energy;
  tension: Tension;
  attention: Attention;
  primaryState: PrimaryState;
  confidence: number;
  safety: SafetyLevel;
  matchedSignals: string[];
};

export type ModeScore = {
  mode: BreakMode;
  score: number;
};

const safetyPattern =
  /kill myself|end my life|suicide|hurt myself|harm myself|want to die|mar jana|mar jaon|khudkushi/i;

const lowEnergyPatterns = [
  /tired/i,
  /drained/i,
  /exhausted/i,
  /sleepy/i,
  /fried/i,
  /cooked/i,
  /brain dead/i,
  /dimagh band/i,
  /dimaag band/i,
  /thak gaya/i,
  /thak gayi/i,
  /thak chuka/i,
  /thak chuki/i,
  /energy nahi/i,
  /energy nai/i,
];

const highEnergyPatterns = [
  /restless/i,
  /can't sit still/i,
  /cant sit still/i,
  /hyper/i,
  /too much energy/i,
  /chain nahi/i,
  /sukoon nahi/i,
];

const highTensionPatterns = [
  /panic/i,
  /panicking/i,
  /overwhelmed/i,
  /anxious/i,
  /stressed/i,
  /stress/i,
  /pressure/i,
  /deadline/i,
  /exam tomorrow/i,
  /exam kal/i,
  /kal exam/i,
  /ghabra/i,
  /tension/i,
  /bohat load/i,
  /bahut load/i,
];

const mediumTensionPatterns = [
  /annoyed/i,
  /frustrated/i,
  /irritated/i,
  /ugh/i,
  /ragra/i,
  /dimagh kha/i,
  /dimaag kha/i,
];

const scatteredPatterns = [
  /can't focus/i,
  /cant focus/i,
  /cannot focus/i,
  /can't concentrate/i,
  /cant concentrate/i,
  /distracted/i,
  /keep switching/i,
  /jumping between/i,
  /jumping tabs/i,
  /mind wandering/i,
  /focus nahi/i,
  /focus nai/i,
  /focus nhi/i,
  /concentrate nahi/i,
  /dil nahi lag/i,
  /dil nai lag/i,
];

const stuckPatterns = [
  /stuck/i,
  /same bug/i,
  /same question/i,
  /same problem/i,
  /staring at/i,
  /nothing is happening/i,
  /can't solve/i,
  /cant solve/i,
  /not getting anywhere/i,
  /atka hua/i,
  /atki hui/i,
  /atak gaya/i,
  /atak gayi/i,
  /samajh nahi aa/i,
  /samajh nai aa/i,
  /samajh nhi aa/i,
  /dimagh band/i,
  /dimaag band/i,
];

function matches(
  text: string,
  patterns: RegExp[],
  name: string,
  signals: string[],
) {
  const found = patterns.some((pattern) => pattern.test(text));

  if (found) {
    signals.push(name);
  }

  return found;
}

export function analyzeSceneMock(input: string): SceneState {
  const text = input.trim().toLowerCase();
  const matchedSignals: string[] = [];

  if (safetyPattern.test(text)) {
    return {
      energy: "low",
      tension: "high",
      attention: "stuck",
      primaryState: "overwhelmed",
      confidence: 0.99,
      safety: "elevated",
      matchedSignals: ["safety"],
    };
  }

  const lowEnergy = matches(
    text,
    lowEnergyPatterns,
    "low-energy",
    matchedSignals,
  );

  const highEnergy = matches(
    text,
    highEnergyPatterns,
    "high-energy",
    matchedSignals,
  );

  const highTension = matches(
    text,
    highTensionPatterns,
    "high-tension",
    matchedSignals,
  );

  const mediumTension = matches(
    text,
    mediumTensionPatterns,
    "medium-tension",
    matchedSignals,
  );

  const scattered = matches(
    text,
    scatteredPatterns,
    "scattered",
    matchedSignals,
  );

  const stuck = matches(
    text,
    stuckPatterns,
    "stuck",
    matchedSignals,
  );

  const energy: Energy = lowEnergy
    ? "low"
    : highEnergy
      ? "high"
      : "normal";

  const tension: Tension = highTension
    ? "high"
    : mediumTension
      ? "medium"
      : "low";

  const attention: Attention = stuck
    ? "stuck"
    : scattered
      ? "scattered"
      : "okay";

  let primaryState: PrimaryState;

  // Priority matters:
  // acute overwhelm > stuck loop > scattered attention > fatigue
  if (tension === "high") {
    primaryState = "overwhelmed";
  } else if (attention === "stuck") {
    primaryState = "stuck";
  } else if (attention === "scattered") {
    primaryState = "distracted";
  } else {
    primaryState = "drained";
  }

  const confidence = Math.min(
    0.94,
    0.56 + matchedSignals.length * 0.09,
  );

  return {
    energy,
    tension,
    attention,
    primaryState,
    confidence,
    safety: "normal",
    matchedSignals,
  };
}

export function getBaseModeScores(
  scene: SceneState,
): Record<BreakMode, number> {
  const scores: Record<BreakMode, number> = {
    downshift: 0.1,
    activate: 0.1,
    refocus: 0.1,
    detach: 0.1,
  };

  if (scene.tension === "high") {
    scores.downshift += 0.9;
  }

  if (scene.tension === "medium") {
    scores.downshift += 0.25;
  }

  if (scene.energy === "low") {
    scores.activate += 0.75;
  }

  if (scene.energy === "high") {
    scores.downshift += 0.25;
  }

  if (scene.attention === "scattered") {
    scores.refocus += 0.9;
  }

  if (scene.attention === "stuck") {
    scores.detach += 0.9;
  }

  if (scene.primaryState === "overwhelmed") {
    scores.downshift += 0.35;
  }

  if (scene.primaryState === "drained") {
    scores.activate += 0.3;
  }

  if (scene.primaryState === "distracted") {
    scores.refocus += 0.3;
  }

  if (scene.primaryState === "stuck") {
    scores.detach += 0.3;
  }

  return scores;
}

export function rankBreakModes(
  scene: SceneState,
  personalization: Partial<Record<BreakMode, number>> = {},
): ModeScore[] {
  const base = getBaseModeScores(scene);

  const modes: BreakMode[] = [
    "downshift",
    "activate",
    "refocus",
    "detach",
  ];

  return modes
    .map((mode) => ({
      mode,
      score: base[mode] + (personalization[mode] ?? 0),
    }))
    .sort((a, b) => b.score - a.score);
}

export function chooseBreakMode(
  scene: SceneState,
  personalization: Partial<Record<BreakMode, number>> = {},
): BreakMode {
  return rankBreakModes(scene, personalization)[0].mode;
}

export function overrideScene(
  state: PrimaryState,
): SceneState {
  switch (state) {
    case "overwhelmed":
      return {
        energy: "normal",
        tension: "high",
        attention: "scattered",
        primaryState: "overwhelmed",
        confidence: 1,
        safety: "normal",
        matchedSignals: ["user-correction"],
      };

    case "distracted":
      return {
        energy: "normal",
        tension: "medium",
        attention: "scattered",
        primaryState: "distracted",
        confidence: 1,
        safety: "normal",
        matchedSignals: ["user-correction"],
      };

    case "stuck":
      return {
        energy: "normal",
        tension: "medium",
        attention: "stuck",
        primaryState: "stuck",
        confidence: 1,
        safety: "normal",
        matchedSignals: ["user-correction"],
      };

    default:
      return {
        energy: "low",
        tension: "low",
        attention: "okay",
        primaryState: "drained",
        confidence: 1,
        safety: "normal",
        matchedSignals: ["user-correction"],
      };
  }
}

export const sceneLabels: Record<PrimaryState, string> = {
  drained: "DRAINED",
  overwhelmed: "OVERWHELMED",
  distracted: "DISTRACTED",
  stuck: "STUCK",
};

export const modeLabels: Record<BreakMode, string> = {
  downshift: "DOWNSHIFT",
  activate: "ACTIVATE",
  refocus: "REFOCUS",
  detach: "DETACH",
};

export const sceneMessages: Record<BreakMode, string> = {
  downshift:
    "Your system looks overloaded. Let's lower the noise.",
  activate:
    "Your energy looks low. Let's wake the system up a little.",
  refocus:
    "Your attention is scattered. Let's give it one tiny target.",
  detach:
    "You're stuck in the same loop. Let's switch scenes completely.",
};