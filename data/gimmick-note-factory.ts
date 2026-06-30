import { DEFAULT_COMBO_PREDICTIONS } from "./combo-predictions-store";
import { createNote } from "./note-store";
import { DEFAULT_PREDICTIONS } from "./predictions-store";
import { DEFAULT_TILT_PREDICTIONS } from "./tilt-predictions-store";
import type { GimmickType, Note } from "@/types/note";

export type GimmickCreateOption = {
  type: GimmickType;
  label: string;
  description: string;
  defaultTitle: string;
  defaultContent: string;
  inputStrategy: "singular" | "combo";
};

/** Card-index suits, in tilt-slot order (suit = tilt index 0–3). */
export const CARD_SUITS = ["Spades", "Hearts", "Diamonds", "Clubs"] as const;

/** Card-index ranks, in rank order (rank index 0–12, Ace … King). */
export const CARD_RANKS = [
  "Ace",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Jack",
  "Queen",
  "King",
] as const;

/** A full 52-card deck as outs, suit-major (index = suit * 13 + rank). */
export function defaultCardOuts(): string[] {
  const outs: string[] = [];
  for (const suit of CARD_SUITS) {
    for (const rank of CARD_RANKS) {
      outs.push(`${rank} of ${suit}`);
    }
  }
  return outs;
}

export const GIMMICK_CREATE_OPTIONS: GimmickCreateOption[] = [
  {
    type: "corner",
    label: "Corner only",
    description: "Tap a Home corner (4 outcomes).",
    defaultTitle: "Secret Note",
    defaultContent: "Tap a corner on Home to reveal this note.",
    inputStrategy: "singular",
  },
  {
    type: "tilt",
    label: "Tilt only",
    description: "Face-down flip on Home (4 outcomes).",
    defaultTitle: "Secret Note",
    defaultContent: "Flip on Home, then open this note.",
    inputStrategy: "singular",
  },
  {
    type: "tilt-live",
    label: "Tilt preview",
    description: "Face-down flip while viewing this note (test mode).",
    defaultTitle: "Secret Note (preview)",
    defaultContent: "Flip on this screen to preview outcomes.",
    inputStrategy: "singular",
  },
  {
    type: "tilt-corner",
    label: "Tilt + corner combo",
    description: "Lock a flip, then tap a corner (16 outcomes).",
    defaultTitle: "Secret Note (combo)",
    defaultContent: "Flip on Home, tap a corner, then open this note.",
    inputStrategy: "combo",
  },
  {
    type: "card-index",
    label: "Card index (52)",
    description: "Flip for suit, then tap two corners for rank (full deck).",
    defaultTitle: "Secret Note (deck)",
    defaultContent: "Flip for suit, tap two corners for rank, then open this.",
    inputStrategy: "combo",
  },
];

/** Default outs for a fresh routine of the given type. */
export function defaultOutsForType(gimmickType: GimmickType): string[] {
  if (gimmickType === "card-index") {
    return defaultCardOuts();
  }
  if (gimmickType === "tilt-corner") {
    return [...DEFAULT_COMBO_PREDICTIONS];
  }
  if (gimmickType === "tilt" || gimmickType === "tilt-live") {
    return [...DEFAULT_TILT_PREDICTIONS];
  }
  return [...DEFAULT_PREDICTIONS];
}

/** The outs editor route for a given routine, addressed by note id. */
export function setupRouteForGimmick(
  gimmickType: GimmickType,
  noteId: string,
): string {
  const id = encodeURIComponent(noteId);
  if (gimmickType === "card-index") {
    return `/explore/card-setup?noteId=${id}`;
  }
  if (gimmickType === "tilt-corner") {
    return `/explore/combo-setup?noteId=${id}`;
  }
  if (gimmickType === "tilt" || gimmickType === "tilt-live") {
    return `/explore/tilt-setup?noteId=${id}`;
  }
  return `/explore/corner-setup?noteId=${id}`;
}

export async function createGimmickNote(
  gimmickType: GimmickType,
  title?: string,
): Promise<Note> {
  const option =
    GIMMICK_CREATE_OPTIONS.find((o) => o.type === gimmickType) ??
    GIMMICK_CREATE_OPTIONS[0];

  return createNote({
    title: title?.trim() || option.defaultTitle,
    content: option.defaultContent,
    isGimmicked: true,
    gimmickType,
    gimmickConfig: {
      inputStrategy: option.inputStrategy,
      outs: defaultOutsForType(gimmickType),
    },
  });
}
