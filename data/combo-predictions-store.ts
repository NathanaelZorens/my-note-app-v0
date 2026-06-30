import AsyncStorage from "@react-native-async-storage/async-storage";
import { CORNER_LABELS } from "./predictions-store";
import { TILT_LABELS } from "./tilt-predictions-store";

export type ComboPredictions = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const STORAGE_KEY = "@my-note-app/combo-predictions-v2";
const LEGACY_STORAGE_KEY = "@my-note-app/combo-predictions";
export const DEFAULT_COMBO_SET_ID = "secret-note-combo-default";
type ComboPredictionSets = Record<string, ComboPredictions>;

export const COMBO_LABELS = TILT_LABELS.flatMap((tiltLabel) =>
  CORNER_LABELS.map((cornerLabel) => `${tiltLabel} + ${cornerLabel}`),
) as readonly string[];

export const DEFAULT_COMBO_PREDICTIONS = COMBO_LABELS.map(
  (label, index) => `Combo ${index + 1}: ${label}`,
) as ComboPredictions;

function toComboPredictions(value: unknown): ComboPredictions | null {
  if (!Array.isArray(value) || value.length !== 16) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return value as ComboPredictions;
}

function toComboPredictionSets(value: unknown): ComboPredictionSets | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  const parsedEntries: [string, ComboPredictions][] = [];
  for (const [key, raw] of entries) {
    const parsed = toComboPredictions(raw);
    if (!parsed) return null;
    parsedEntries.push([key, parsed]);
  }
  return Object.fromEntries(parsedEntries);
}

async function loadAllComboPredictionSets(): Promise<ComboPredictionSets> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = toComboPredictionSets(JSON.parse(raw));
    if (parsed) return parsed;
  }

  // Migration path from single-table storage.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    const legacyParsed = toComboPredictions(JSON.parse(legacyRaw));
    if (legacyParsed) {
      const migrated: ComboPredictionSets = { [DEFAULT_COMBO_SET_ID]: legacyParsed };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return {
    [DEFAULT_COMBO_SET_ID]: [...DEFAULT_COMBO_PREDICTIONS] as ComboPredictions,
  };
}

export async function loadComboPredictionSet(
  setId: string,
): Promise<ComboPredictions> {
  const sets = await loadAllComboPredictionSets();
  return sets[setId] ?? ([...DEFAULT_COMBO_PREDICTIONS] as ComboPredictions);
}

export async function saveComboPredictionSet(
  setId: string,
  predictions: ComboPredictions,
): Promise<void> {
  const sets = await loadAllComboPredictionSets();
  sets[setId] = predictions;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

// Backward-compatible API used by existing screens.
export async function loadComboPredictions(): Promise<ComboPredictions> {
  return loadComboPredictionSet(DEFAULT_COMBO_SET_ID);
}

// Backward-compatible API used by existing screens.
export async function saveComboPredictions(
  predictions: ComboPredictions,
): Promise<void> {
  await saveComboPredictionSet(DEFAULT_COMBO_SET_ID, predictions);
}
