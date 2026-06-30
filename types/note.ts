export type GimmickType =
  | "corner"
  | "tilt"
  | "tilt-live"
  | "tilt-corner"
  | "card-index";

export type GimmickInputStrategy = "singular" | "combo";

export interface GimmickConfig {
  /**
   * The pre-written outs for this routine, stored directly on the note.
   * 4 entries for corner / tilt / tilt-live, 16 for tilt-corner, 52 for
   * card-index (suit-major: index = suit * 13 + rank).
   */
  outs: string[];
  /**
   * Shared lead-in shown before the chosen out, so each out only needs the
   * meaningful keyword. Final reveal = outPrefix + out.
   */
  outPrefix?: string;
  /** How inputs are interpreted for this note. */
  inputStrategy?: GimmickInputStrategy;
  /**
   * @deprecated Outs now live on the note via `outs`. Kept only so the
   * one-time migration can find the old per-set table for existing notes.
   */
  predictionSetId?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  /** When true, body can change via secret inputs on the Home screen. */
  isGimmicked?: boolean;
  /** Which secret input drives this note. Defaults to "corner" when isGimmicked. */
  gimmickType?: GimmickType;
  /** Extended config for gimmick notes (per-note prediction sets, strategy, etc). */
  gimmickConfig?: GimmickConfig;
}
