import { TILT_SENSITIVITY } from "@/config/tilt-sensitivity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useRef } from "react";

export type TiltIndex = 0 | 1 | 2 | 3 | null;

/**
 * Persisted face-down z-sign. It's a fixed property of the physical device, so
 * once learned we remember it across navigations and restarts — that keeps the
 * face-up wake gate reliable even before a routine is armed in this session.
 */
const FACE_SIGN_KEY = "tilt:faceDownSign";

type Sample = { x: number; y: number; z: number };
type Phase = "idle" | "armed" | "locked";

/** Phone lying flat — screen roughly parallel to table (|z| dominant). */
function isScreenFlat(x: number, y: number, z: number): boolean {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  const absZ = Math.abs(z);
  return (
    absZ >= TILT_SENSITIVITY.faceDownZMin &&
    absZ >= absX &&
    absZ >= absY
  );
}

/**
 * Screen toward table, or flat before sign is learned. After first arm, only the
 * learned face-down side counts (face-up is ignored).
 */
function isFaceDownSide(
  z: number,
  learnedSign: 1 | -1 | null,
): boolean {
  const min = TILT_SENSITIVITY.faceDownZSignMin;

  if (learnedSign !== null) {
    return Math.sign(z) === learnedSign && Math.abs(z) >= min;
  }

  return Math.abs(z) >= min;
}

function isFaceDownFlat(
  x: number,
  y: number,
  z: number,
  learnedSign: 1 | -1 | null,
): boolean {
  return isScreenFlat(x, y, z) && isFaceDownSide(z, learnedSign);
}

function isStill(samples: Sample[]): boolean {
  if (samples.length < TILT_SENSITIVITY.stillSampleCount) return false;

  const range = (axis: keyof Sample) => {
    const values = samples.map((s) => s[axis]);
    return Math.max(...values) - Math.min(...values);
  };

  return (
    range("x") <= TILT_SENSITIVITY.stillnessDelta &&
    range("y") <= TILT_SENSITIVITY.stillnessDelta &&
    range("z") <= TILT_SENSITIVITY.stillnessDelta
  );
}

function average(samples: Sample[]): Sample {
  const count = samples.length;
  return {
    x: samples.reduce((sum, s) => sum + s.x, 0) / count,
    y: samples.reduce((sum, s) => sum + s.y, 0) / count,
    z: samples.reduce((sum, s) => sum + s.z, 0) / count,
  };
}

function learnFaceDownSign(avgZ: number): 1 | -1 {
  return avgZ >= 0 ? 1 : -1;
}

/**
 * From a face-down baseline:
 * - dx+ → left edge pivot → slot 0
 * - dx- → right edge pivot → slot 1
 * - dy+ → bottom edge pivot → slot 2
 * - dy- → top edge pivot → slot 3
 */
function detectFlip(
  x: number,
  y: number,
  baseline: Sample,
): Exclude<TiltIndex, null> | null {
  let dx = x - baseline.x;
  let dy = y - baseline.y;

  if (TILT_SENSITIVITY.invertFlipX) dx = -dx;
  if (TILT_SENSITIVITY.invertFlipY) dy = -dy;

  const threshold = TILT_SENSITIVITY.flipDelta;
  const candidates: { index: 0 | 1 | 2 | 3; strength: number }[] = [];

  if (dx > threshold) {
    candidates.push({ index: 0, strength: dx - threshold });
  }
  if (dx < -threshold) {
    candidates.push({ index: 1, strength: -dx - threshold });
  }
  if (dy > threshold) {
    candidates.push({ index: 2, strength: dy - threshold });
  }
  if (dy < -threshold) {
    candidates.push({ index: 3, strength: -dy - threshold });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.strength - a.strength);
  return candidates[0].index;
}

/** Face-down arm → flip on edge → lock until screen-down still again. */
export function useTiltDetector(
  setTiltIndex: (value: TiltIndex) => void,
  enabled: boolean,
  onFaceUpChange?: (faceUp: boolean) => void,
) {
  const phase = useRef<Phase>("idle");
  const stillSince = useRef<number | null>(null);
  const samples = useRef<Sample[]>([]);
  const baseline = useRef<Sample | null>(null);
  const faceDownZSign = useRef<1 | -1 | null>(null);
  const lastFaceUp = useRef<boolean | null>(null);
  // Separate, persisted copy of the face-down sign used only by the face-up
  // gate. Unlike `faceDownZSign` (reset each time the routine restarts), this
  // survives navigation/restarts so the gate isn't blind between routines.
  const gateSign = useRef<1 | -1 | null>(null);
  // Latest raw reading, so an explicit calibration can sample "now".
  const latestSample = useRef<Sample | null>(null);

  /**
   * Calibrate the face-up sign from the phone's current orientation. Call it
   * while the screen genuinely faces the performer (e.g. when triggering
   * fake-off). Returns false if the phone is too upright to read a clear sign.
   */
  const calibrateFaceUp = useCallback(() => {
    const z = latestSample.current?.z;
    if (z == null || Math.abs(z) < TILT_SENSITIVITY.faceUpZMin) {
      return false;
    }
    // Current side is face-up; the gate stores the opposite (face-down) sign.
    const faceDownSign: 1 | -1 = Math.sign(z) > 0 ? -1 : 1;
    gateSign.current = faceDownSign;
    faceDownZSign.current = faceDownSign;
    lastFaceUp.current = null; // force a fresh face-up emit on the next sample
    void AsyncStorage.setItem(FACE_SIGN_KEY, String(faceDownSign));
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    phase.current = "idle";
    stillSince.current = null;
    samples.current = [];
    baseline.current = null;
    faceDownZSign.current = null;
    lastFaceUp.current = null;

    let cancelled = false;
    AsyncStorage.getItem(FACE_SIGN_KEY).then((v) => {
      if (cancelled) return;
      if (v === "1") gateSign.current = 1;
      else if (v === "-1") gateSign.current = -1;
    });

    const rememberFaceDownSign = (sign: 1 | -1) => {
      faceDownZSign.current = sign;
      gateSign.current = sign;
      void AsyncStorage.setItem(FACE_SIGN_KEY, String(sign));
    };

    Accelerometer.setUpdateInterval(TILT_SENSITIVITY.updateIntervalMs);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const sample = { x, y, z };
      latestSample.current = sample;
      const currentPhase = phase.current;
      const learnedSign = faceDownZSign.current;
      const faceDown = isFaceDownFlat(x, y, z, learnedSign);

      // Report face-up vs face-down using the persisted gate sign (only
      // meaningful once learned). Emit only on change to avoid churn.
      if (onFaceUpChange) {
        const gs = gateSign.current;
        const faceUp =
          gs === null
            ? true
            : Math.sign(z) === -gs && Math.abs(z) >= TILT_SENSITIVITY.faceUpZMin;
        if (faceUp !== lastFaceUp.current) {
          lastFaceUp.current = faceUp;
          onFaceUpChange(faceUp);
        }
      }

      if (currentPhase === "armed") {
        const base = baseline.current;
        if (base) {
          const flip = detectFlip(x, y, base);
          if (flip !== null) {
            phase.current = "locked";
            stillSince.current = null;
            samples.current = [];
            setTiltIndex(flip);
            return;
          }
        }
        return;
      }

      if (faceDown) {
        samples.current.push(sample);
        if (samples.current.length > TILT_SENSITIVITY.stillSampleCount) {
          samples.current.shift();
        }
      } else {
        samples.current = [];
        stillSince.current = null;
      }

      const faceDownStill = faceDown && isStill(samples.current);
      const now = Date.now();

      if (faceDownStill) {
        if (stillSince.current === null) {
          stillSince.current = now;
        }
      } else {
        stillSince.current = null;
      }

      const stillHeld =
        faceDownStill &&
        stillSince.current !== null &&
        now - stillSince.current >= TILT_SENSITIVITY.faceDownStillMs;

      if (currentPhase === "locked") {
        if (stillHeld) {
          const avg = average(samples.current);
          rememberFaceDownSign(learnFaceDownSign(avg.z));
          phase.current = "armed";
          baseline.current = avg;
          stillSince.current = null;
          setTiltIndex(null);
        }
        return;
      }

      if (stillHeld && currentPhase === "idle") {
        const avg = average(samples.current);
        rememberFaceDownSign(learnFaceDownSign(avg.z));
        phase.current = "armed";
        baseline.current = avg;
        stillSince.current = null;
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
      phase.current = "idle";
      stillSince.current = null;
      samples.current = [];
      baseline.current = null;
      faceDownZSign.current = null;
      lastFaceUp.current = null;
    };
  }, [enabled, setTiltIndex, onFaceUpChange]);

  return { calibrateFaceUp };
}
