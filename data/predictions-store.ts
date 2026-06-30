import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_PREDICTIONS = [
  "My prediction is 6",
  "My prediction is 9",
  "My prediction is 12",
  "My prediction is 15",
] as const;

export type Predictions = [string, string, string, string];

const STORAGE_KEY = "@my-note-app/predictions-v2";
const LEGACY_STORAGE_KEY = "@my-note-app/predictions";

export const DEFAULT_CORNER_SET_ID = "secret-note-corner-default";
type PredictionSets = Record<string, Predictions>;

export const CORNER_LABELS = [
  "Top-left",
  "Top-right",
  "Bottom-left",
  "Bottom-right",
] as const;

function toPredictions(value: unknown): Predictions | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return value as Predictions;
}

function toPredictionSets(value: unknown): PredictionSets | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  const parsedEntries: [string, Predictions][] = [];
  for (const [key, raw] of entries) {
    const parsed = toPredictions(raw);
    if (!parsed) return null;
    parsedEntries.push([key, parsed]);
  }
  return Object.fromEntries(parsedEntries);
}

async function loadAllPredictionSets(): Promise<PredictionSets> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = toPredictionSets(JSON.parse(raw));
    if (parsed) return parsed;
  }

  // Migration path from single-table storage.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    const legacyParsed = toPredictions(JSON.parse(legacyRaw));
    if (legacyParsed) {
      const migrated: PredictionSets = { [DEFAULT_CORNER_SET_ID]: legacyParsed };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return { [DEFAULT_CORNER_SET_ID]: [...DEFAULT_PREDICTIONS] };
}

export async function loadPredictionSet(setId: string): Promise<Predictions> {
  const sets = await loadAllPredictionSets();
  return sets[setId] ?? [...DEFAULT_PREDICTIONS];
}

export async function savePredictionSet(
  setId: string,
  predictions: Predictions,
): Promise<void> {
  const sets = await loadAllPredictionSets();
  sets[setId] = predictions;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

// Backward-compatible API used by existing screens.
export async function loadPredictions(): Promise<Predictions> {
  return loadPredictionSet(DEFAULT_CORNER_SET_ID);
}

// Backward-compatible API used by existing screens.
export async function savePredictions(predictions: Predictions): Promise<void> {
  await savePredictionSet(DEFAULT_CORNER_SET_ID, predictions);
}
