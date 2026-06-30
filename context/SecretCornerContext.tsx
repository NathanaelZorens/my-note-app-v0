import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type CornerIndex = 0 | 1 | 2 | 3 | null;
export type TiltIndex = CornerIndex;

type SecretCornerContextValue = {
  cornerIndex: CornerIndex;
  setCornerIndex: (value: CornerIndex) => void;
  /**
   * The last (up to) two corner taps since the routine was armed, oldest
   * first. Used by card-index to encode a rank (first tap * 4 + second tap).
   */
  cornerTaps: number[];
  /** Record a corner tap: updates cornerIndex and appends to cornerTaps. */
  recordCornerTap: (value: 0 | 1 | 2 | 3) => void;
  tiltIndex: TiltIndex;
  setTiltIndex: (value: TiltIndex) => void;
  /** The single routine currently open to index inputs (null = none). */
  armedNoteId: string | null;
  /** Arm a routine; moves the arm here and clears any prior index selection. */
  armRoutine: (noteId: string) => void;
};

const SecretCornerContext = createContext<SecretCornerContextValue | null>(null);

export function SecretCornerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cornerIndex, setCornerIndex] = useState<CornerIndex>(null);
  const [cornerTaps, setCornerTaps] = useState<number[]>([]);
  const [tiltIndex, setTiltIndex] = useState<TiltIndex>(null);
  const [armedNoteId, setArmedNoteId] = useState<string | null>(null);

  const recordCornerTap = useCallback((value: 0 | 1 | 2 | 3) => {
    setCornerIndex(value);
    // Keep only the last two taps — that's all card-index needs, and it makes
    // a mis-tap forgiving (the two most recent taps always win).
    setCornerTaps((prev) => [...prev, value].slice(-2));
  }, []);

  const armRoutine = useCallback((noteId: string) => {
    setArmedNoteId(noteId);
    // Reset on (re-)arm so the newly armed routine starts blank.
    setCornerIndex(null);
    setCornerTaps([]);
    setTiltIndex(null);
  }, []);

  return (
    <SecretCornerContext.Provider
      value={{
        cornerIndex,
        setCornerIndex,
        cornerTaps,
        recordCornerTap,
        tiltIndex,
        setTiltIndex,
        armedNoteId,
        armRoutine,
      }}
    >
      {children}
    </SecretCornerContext.Provider>
  );
}

export function useSecretCorner() {
  const ctx = useContext(SecretCornerContext);
  if (!ctx)
    throw new Error("useSecretCorner must be used within SecretCornerProvider");
  return ctx;
}
