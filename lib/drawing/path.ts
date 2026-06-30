import type { DrawingPoint } from "@/types/note";

/** Default stroke width as a fraction of the drawing box width. */
export const DEFAULT_STROKE_WIDTH = 0.012;

/** Default ink color. */
export const DEFAULT_STROKE_COLOR = "#11181C";

export type FitTransform = {
  /** Rendered content size in px (preserves the authored aspect ratio). */
  contentWidth: number;
  contentHeight: number;
  /** Top-left offset that centers the content inside the box (letterboxing). */
  offsetX: number;
  offsetY: number;
};

/**
 * Fit a drawing of aspect ratio `aspect` (width / height) into a `width` x
 * `height` box with a single uniform scale, centered. When `aspect` is missing
 * the drawing fills the box directly (legacy behavior, no aspect correction).
 */
export function fitTransform(
  width: number,
  height: number,
  aspect?: number,
): FitTransform {
  const ar = aspect && aspect > 0 ? aspect : height > 0 ? width / height : 1;
  const scale = Math.min(width / ar, height);
  const contentWidth = ar * scale;
  const contentHeight = scale;
  return {
    contentWidth,
    contentHeight,
    offsetX: (width - contentWidth) / 2,
    offsetY: (height - contentHeight) / 2,
  };
}

/**
 * Build an SVG path `d` string from normalized (0..1) points, scaled into a box
 * of `width` x `height` pixels while preserving the authored `aspect` ratio.
 * Uses midpoint quadratic smoothing so strokes look natural rather than jagged
 * polylines. A single point renders as a dot.
 */
export function buildPathData(
  points: DrawingPoint[],
  width: number,
  height: number,
  aspect?: number,
): string {
  if (points.length === 0) return "";

  const t = fitTransform(width, height, aspect);
  const px = (p: DrawingPoint) => t.offsetX + p.x * t.contentWidth;
  const py = (p: DrawingPoint) => t.offsetY + p.y * t.contentHeight;

  if (points.length === 1) {
    // Tiny dot: a near-zero line so SVG renders a round cap.
    const x = px(points[0]);
    const y = py(points[0]);
    return `M ${x} ${y} L ${x + 0.01} ${y}`;
  }

  let d = `M ${px(points[0])} ${py(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cx = px(points[i]);
    const cy = py(points[i]);
    const mx = (cx + px(points[i + 1])) / 2;
    const my = (cy + py(points[i + 1])) / 2;
    d += ` Q ${cx} ${cy} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${px(last)} ${py(last)}`;
  return d;
}

/**
 * Pixel stroke width for a normalized width fraction. The fraction is relative
 * to the authored content width, so we scale by the rendered content width to
 * keep stroke thickness proportional regardless of box shape.
 */
export function strokeWidthPx(
  widthFraction: number | undefined,
  width: number,
  height: number,
  aspect?: number,
): number {
  const { contentWidth } = fitTransform(width, height, aspect);
  return Math.max(1, (widthFraction ?? DEFAULT_STROKE_WIDTH) * contentWidth);
}
