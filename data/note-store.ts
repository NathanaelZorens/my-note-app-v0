// data/note-store.ts
import type { Note } from "@/types/note";
import { DUMMY_NOTES } from "./dummy-notes";

let notes: Note[] = [...DUMMY_NOTES];

/*let notes: Note[] = [
  {
    id: "seed-only",
    title: "From note-store",
    content: "If you see this, list is using note-store.",
    date: "2025-01-01",
  },
];*/

export async function loadNotes(): Promise<Note[]> {
  // later this could be a fetch / AsyncStorage read
  return notes;
}

export async function getNote(id: string): Promise<Note | null> {
  return notes.find((n) => n.id === id) ?? null;
}

export async function createNote(
  input: Omit<Note, "id" | "date">,
): Promise<Note> {
  const newNote: Note = {
    id: Date.now().toString(),
    date: new Date().toISOString().slice(0, 10),
    ...input,
  };
  notes = [newNote, ...notes];
  return newNote;
}

export async function updateNote(
  id: string,
  changes: Partial<Omit<Note, "id">>,
): Promise<Note | null> {
  let updated: Note | null = null;
  notes = notes.map((n) => {
    if (n.id !== id) return n;
    updated = { ...n, ...changes };
    return updated;
  });
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  notes = notes.filter((n) => n.id !== id);
}
