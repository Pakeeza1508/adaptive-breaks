import type {
  BreakMode,
  PrimaryState,
  SceneState,
} from "./sceneEngine";

export type FeedbackOutcome =
  | "better"
  | "same"
  | "worse";

type PolicyEntry = {
  attempts: number;
  rewardSum: number;
  better: number;
  same: number;
  worse: number;
};

type PolicyStore = Record<string, PolicyEntry>;

const STORAGE_KEY = "kya-scene-hai-policy-v1";

function emptyEntry(): PolicyEntry {
  return {
    attempts: 0,
    rewardSum: 0,
    better: 0,
    same: 0,
    worse: 0,
  };
}

function loadStore(): PolicyStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}",
    );
  } catch {
    return {};
  }
}

function saveStore(store: PolicyStore) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store),
  );
}

function keyFor(
  state: PrimaryState,
  mode: BreakMode,
) {
  return `${state}:${mode}`;
}

function rewardFor(
  outcome: FeedbackOutcome,
) {
  if (outcome === "better") return 1;
  if (outcome === "worse") return -1;

  return 0;
}

export function recordOutcome(
  scene: SceneState,
  mode: BreakMode,
  outcome: FeedbackOutcome,
) {
  const store = loadStore();
  const key = keyFor(scene.primaryState, mode);

  const entry = store[key] ?? emptyEntry();

  entry.attempts += 1;
  entry.rewardSum += rewardFor(outcome);
  entry[outcome] += 1;

  store[key] = entry;

  saveStore(store);
}

export function getModeBonuses(
  scene: SceneState,
): Partial<Record<BreakMode, number>> {
  const store = loadStore();

  const modes: BreakMode[] = [
    "downshift",
    "activate",
    "refocus",
    "detach",
  ];

  const result: Partial<
    Record<BreakMode, number>
  > = {};

  for (const mode of modes) {
    const entry =
      store[keyFor(scene.primaryState, mode)];

    if (!entry || entry.attempts === 0) {
      result[mode] = 0;
      continue;
    }

    const averageReward =
      entry.rewardSum / entry.attempts;

    // Early feedback should only influence,
    // not completely override our expert prior.
    const evidenceWeight = Math.min(
      entry.attempts / 4,
      1,
    );

    result[mode] =
      averageReward * evidenceWeight * 0.35;
  }

  return result;
}

export function getPolicySnapshot() {
  return loadStore();
}

export function resetPolicy() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}