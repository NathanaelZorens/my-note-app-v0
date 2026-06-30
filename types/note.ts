export type GimmickType =
  | "corner"
  | "tilt"
  | "tilt-live"
  | "tilt-corner"
  | "card-index";

export type GimmickInputStrategy = "singular" | "combo";

/** A single point of a stroke, normalized to 0..1 within its drawing box. */
export interface DrawingPoint {
  x: number;
  y: number;
}

/** One pen-down..pen-up stroke. `width` is a fraction of the box width. */
export interface DrawingStroke {
  points: DrawingPoint[];
  color?: string;
  width?: number;
}

/** A resolution-independent doodle: just an ordered list of strokes. */
export interface Drawing {
  strokes: DrawingStroke[];
  /**
   * Aspect ratio (width / height) of the canvas it was drawn on. Used to letterbox
   * the drawing into differently shaped boxes without distorting it.
   */
  aspect?: number;
}

/** True when a drawing has at least one stroke with points. */
export function drawingHasContent(drawing?: Drawing | null): boolean {
  return !!drawing?.strokes.some((s) => s.points.length > 0);
}

/** How a gimmick note reveals its chosen out. */
export type GimmickRevealKind = "text" | "drawing";

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
   * What the chosen out reveals. "text" (default) uses `outs`. "drawing" shows
   * `drawingOuts[index]` plus the matching `outs[index]` as an optional caption.
   */
  revealKind?: GimmickRevealKind;
  /**
   * Pre-drawn outs, parallel to `outs` (same index scheme). Used when
   * `revealKind === "drawing"`. Entries may be missing/empty for unused slots.
   */
  drawingOuts?: (Drawing | null)[];
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
  /** Optional freehand doodle shown alongside the text body on a normal note. */
  drawing?: Drawing;
}
