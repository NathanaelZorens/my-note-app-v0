/**
 * Face-down flip detection — edit these values, save, then reload the app.
 *
 * Flow:
 * 1. Lay phone screen-down on table, hold still → armed (receiving input).
 * 2. Flip on one edge (pivot) → locks that slot.
 * 3. Lay screen-down still again → re-arm for the next flip.
 */

export const TILT_SENSITIVITY = {
  /** Ms screen-down and still before arming (and before re-arm after a lock). */
  faceDownStillMs: 500,

  /** Min |z| (0–1) to count as flat on a surface. */
  faceDownZMin: 0.82,

  /**
   * Min |z| for face-down (0–1). On first arm the app learns your phone's z sign;
   * after that, face-up flat is ignored.
   */
  faceDownZSignMin: 0.5,

  /**
   * Min |z| (0–1) on the face-UP side before the blackout double-tap will wake
   * the screen. Stops stray double-taps from waking it while it's face-down in
   * someone's hand. Lower = wake from a steeper (more upright) angle.
   */
  faceUpZMin: 0.35,

  /** Max wobble on x/y/z while counting as "still" (0–1). */
  stillnessDelta: 0.045,

  /** How many accelerometer samples to check for stillness. */
  stillSampleCount: 10,

  /**
   * Min change from armed baseline on x or y to count as a flip (0–1).
   * Lower = easier to trigger; higher = needs a bigger flip.
   */
  flipDelta: 0.2,

  /** Set true if left/right flips feel swapped. */
  invertFlipX: false,

  /** Set true if bottom/top flips feel swapped. */
  invertFlipY: false,

  /** Accelerometer poll interval (ms). */
  updateIntervalMs: 50,
} as const;
