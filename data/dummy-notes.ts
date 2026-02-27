import type { Note } from '@/types/note';

export const DUMMY_NOTES: Note[] = [
  { id: '1', title: 'First Note', content: 'This is the content of my first note.', date: '2025-12-09' },
  { id: '2', title: 'Grocery List', content: 'Milk, Eggs, Bread, Cheese.', date: '2025-12-08' },
  { id: '3', title: 'Project Ideas', content: 'Build a weather app, maybe a recipe book.', date: '2025-12-07' },
  {
    id: '4',
    title: 'Secret Note',
    content: 'Looks like a normal note. Tap the corners to reveal 1, 2, 3, or 4.',
    date: '2025-12-10',
    isGimmicked: true,
  },
];

export function getNoteById(id: string): Note | undefined {
  return DUMMY_NOTES.find((n) => n.id === id);
}
