import type { Note } from "@/types/note";

export const DUMMY_NOTES: Note[] = [
  {
    id: "1",
    title: "First Note XX",
    content: "This is the content of my first note.",
    date: "2025-12-09",
  },
  {
    id: "2",
    title: "Grocery List",
    content: "Milk, Eggs, Bread, Cheese.",
    date: "2025-12-08",
  },
  {
    id: "3",
    title: "Project Ideas",
    content: "Build a weather app, maybe a recipe book.",
    date: "2025-12-07",
  },
  {
    id: "4",
    title: "Secret Note",
    content: "My prediction is",
    date: "2025-12-10",
    isGimmicked: true,
  },
];

export function getNoteById(id: string): Note | undefined {
  return DUMMY_NOTES.find((n) => n.id === id);
}
