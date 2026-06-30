import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Note } from "@/types/note";
import { loadComboPredictionSet } from "./combo-predictions-store";
import { DUMMY_NOTES } from "./dummy-notes";
import { loadPredictionSet } from "./predictions-store";
import { loadTiltPredictionSet } from "./tilt-predictions-store";

const STORAGE_KEY = "@my-note-app/notes";

let notes: Note[] = [...DUMMY_NOTES];
let hydrated = false;

async function persistNotes(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

async function mergeSeedNotes(): Promise<void> {
  const existingIds = new Set(notes.map((n) => n.id));
  const missing = DUMMY_NOTES.filter((seed) => !existingIds.has(seed.id));
  if (missing.length === 0) return;
  notes = [...notes, ...missing];
  await persistNotes();
}

/**
 * One-time migration: outs used to live in separate per-set stores keyed by
 * `gimmickConfig.predictionSetId`. Now they live on the note. For any gimmick
 * note missing embedded outs, pull its old table over and drop the setId.
 */
async function migrateGimmickOuts(): Promise<void> {
  const pending = notes.filter(
    (n) =>
      n.isGimmicked &&
      n.gimmickConfig &&
      (!Array.isArray(n.gimmickConfig.outs) ||
        n.gimmickConfig.outs.length === 0),
  );
  if (pending.length === 0) return;

  const migrated = await Promise.all(
    notes.map(async (n) => {
      if (!pending.includes(n) || !n.gimmickConfig) return n;
      const setId = n.gimmickConfig.predictionSetId;
      let outs: string[];
      if (n.gimmickType === "tilt-corner") {
        outs = await loadComboPredictionSet(setId ?? "");
      } else if (n.gimmickType === "tilt" || n.gimmickType === "tilt-live") {
        outs = await loadTiltPredictionSet(setId ?? "");
      } else {
        outs = await loadPredictionSet(setId ?? "");
      }
      const { predictionSetId: _drop, ...rest } = n.gimmickConfig;
      return { ...n, gimmickConfig: { ...rest, outs } };
    }),
  );

  notes = migrated;
  await persistNotes();
}

async function ensureHydrated(): Promise<void> {
  if (hydrated) return;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    notes = JSON.parse(raw) as Note[];
    await mergeSeedNotes();
    await migrateGimmickOuts();
  } else {
    notes = [...DUMMY_NOTES];
    await persistNotes();
  }

  hydrated = true;
}

/**
 * Display order: newest date first. Backdating a note (e.g. a prediction
 * "written weeks ago") naturally drops it lower in the list. Ties break by id
 * descending so a freshly created note still sits above same-date ones.
 */
function sortForDisplay(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const an = Number(a.id);
    const bn = Number(b.id);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return bn - an;
    return a.id < b.id ? 1 : -1;
  });
}

export async function loadNotes(): Promise<Note[]> {
  await ensureHydrated();
  return sortForDisplay(notes);
}

export async function getNote(id: string): Promise<Note | null> {
  await ensureHydrated();
  return notes.find((n) => n.id === id) ?? null;
}

export async function createNote(
  input: Omit<Note, "id" | "date">,
): Promise<Note> {
  await ensureHydrated();
  const newNote: Note = {
    id: Date.now().toString(),
    date: new Date().toISOString().slice(0, 10),
    ...input,
  };
  notes = [newNote, ...notes];
  await persistNotes();
  return newNote;
}

export async function updateNote(
  id: string,
  changes: Partial<Omit<Note, "id">>,
): Promise<Note | null> {
  await ensureHydrated();
  let updated: Note | null = null;
  notes = notes.map((n) => {
    if (n.id !== id) return n;
    updated = { ...n, ...changes };
    return updated;
  });
  if (updated) {
    await persistNotes();
  }
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  await ensureHydrated();
  notes = notes.filter((n) => n.id !== id);
  await persistNotes();
}
