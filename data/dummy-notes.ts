import type { Note } from "@/types/note";

// Seed notes for a fresh install. A believable mix of everyday notes and a few
// gimmicked ones whose cover text (title + prefix) reads like ordinary notes —
// nothing hints at the secret inputs. Real performers replace these via the
// gimmick-create screen; these just make the app look lived-in.
export const DUMMY_NOTES: Note[] = [
  {
    id: "1",
    title: "Grocery list",
    content: "Milk, eggs, sourdough, coffee, spinach, olive oil",
    date: "2026-06-22",
  },
  {
    id: "4",
    title: "Lunch bet",
    content: "",
    date: "2026-06-21",
    isGimmicked: true,
    gimmickType: "corner",
    gimmickConfig: {
      inputStrategy: "singular",
      outPrefix: "You'll pick ",
      outs: [
        "the Italian place",
        "the sushi bar",
        "the taco truck",
        "the ramen shop",
      ],
    },
  },
  {
    id: "2",
    title: "Books to read",
    content: "Project Hail Mary, Dune, The Pragmatic Programmer",
    date: "2026-06-18",
  },
  {
    id: "5",
    title: "Coin toss",
    content: "",
    date: "2026-06-15",
    isGimmicked: true,
    gimmickType: "tilt",
    gimmickConfig: {
      inputStrategy: "singular",
      outPrefix: "It lands on ",
      outs: ["heads", "tails", "its edge", "heads again"],
    },
  },
  {
    id: "3",
    title: "Weekend to-do",
    content: "Fix the bike, call mom, farmers market at 9",
    date: "2026-06-10",
  },
  {
    id: "6",
    title: "Dice roll",
    content: "",
    date: "2026-06-05",
    isGimmicked: true,
    gimmickType: "tilt-live",
    gimmickConfig: {
      inputStrategy: "singular",
      outPrefix: "You'll roll a ",
      outs: ["two", "three", "five", "six"],
    },
  },
  {
    id: "7",
    title: "Card pick",
    content: "",
    date: "2026-05-28",
    isGimmicked: true,
    gimmickType: "tilt-corner",
    gimmickConfig: {
      inputStrategy: "combo",
      outPrefix: "Your card: ",
      outs: [
        "Ace of Spades",
        "King of Hearts",
        "Queen of Diamonds",
        "Jack of Clubs",
        "Ten of Hearts",
        "Nine of Spades",
        "Eight of Diamonds",
        "Seven of Clubs",
        "Six of Hearts",
        "Five of Spades",
        "Four of Diamonds",
        "Three of Clubs",
        "Two of Hearts",
        "Ace of Hearts",
        "King of Spades",
        "Queen of Clubs",
      ],
    },
  },
];
