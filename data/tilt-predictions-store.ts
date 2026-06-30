import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_TILT_PREDICTIONS = [
  "Flip with left edge as hinge: fortune favors you",
  "Flip with right edge as hinge: a surprise awaits",
  "Flip with bottom edge as hinge: trust your instinct",
  "Flip with top edge as hinge: patience will pay off",
] as const;

export type TiltPredictions = [string, string, string, string];

const STORAGE_KEY = "@my-note-app/tilt-predictions-v2";
const LEGACY_STORAGE_KEY = "@my-note-app/tilt-predictions";
export const DEFAULT_TILT_SET_ID = "secret-note-tilt-default";
type TiltPredictionSets = Record<string, TiltPredictions>;

export const TILT_LABELS = [
  "Flip left edge hinge - L-FU",
  "Flip right edge hinge - R-FU",
  "Flip while face-down - bottom edge hinge",
  "Flip while face-down - top edge hinge",
] as const;

function toTiltPredictions(value: unknown): TiltPredictions | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return value as TiltPredictions;
}

function toTiltPredictionSets(value: unknown): TiltPredictionSets | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  const parsedEntries: [string, TiltPredictions][] = [];
  for (const [key, raw] of entries) {
    const parsed = toTiltPredictions(raw);
    if (!parsed) return null;
    parsedEntries.push([key, parsed]);
  }
  return Object.fromEntries(parsedEntries);
}

async function loadAllTiltPredictionSets(): Promise<TiltPredictionSets> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = toTiltPredictionSets(JSON.parse(raw));
    if (parsed) return parsed;
  }

  // Migration path from single-table storage.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    const legacyParsed = toTiltPredictions(JSON.parse(legacyRaw));
    if (legacyParsed) {
      const migrated: TiltPredictionSets = { [DEFAULT_TILT_SET_ID]: legacyParsed };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return { [DEFAULT_TILT_SET_ID]: [...DEFAULT_TILT_PREDICTIONS] };
}

export async function loadTiltPredictionSet(
  setId: string,
): Promise<TiltPredictions> {
  const sets = await loadAllTiltPredictionSets();
  return sets[setId] ?? [...DEFAULT_TILT_PREDICTIONS];
}

export async function saveTiltPredictionSet(
  setId: string,
  predictions: TiltPredictions,
): Promise<void> {
  const sets = await loadAllTiltPredictionSets();
  sets[setId] = predictions;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

// Backward-compatible API used by existing screens.
export async function loadTiltPredictions(): Promise<TiltPredictions> {
  return loadTiltPredictionSet(DEFAULT_TILT_SET_ID);
}

// Backward-compatible API used by existing screens.
export async function saveTiltPredictions(
  predictions: TiltPredictions,
): Promise<void> {
  await saveTiltPredictionSet(DEFAULT_TILT_SET_ID, predictions);
}
