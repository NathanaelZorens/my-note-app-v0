import React, { createContext, useContext, useState } from "react";

//export type CornerValue = "Red" | "Blue" | "Green" | "Purple" | null;

export const predictions = [
  "Ace of Spades", // slot 0 → top-left
  "Two of Hearts", // slot 1 → top-right
  "Three of Clubs", // slot 2 → bottom-left
  "Four of Diamonds", // slot 3 → bottom-right
];

export type CornerIndex = 0 | 1 | 2 | 3 | null;

type SecretCornerContextValue = {
  cornerIndex: CornerIndex;
  setCornerIndex: (value: CornerIndex) => void;
};

const SecretCornerContext = createContext<SecretCornerContextValue | null>(
  null,
);

export function SecretCornerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cornerIndex, setCornerIndex] = useState<CornerIndex>(null);
  return (
    <SecretCornerContext.Provider value={{ cornerIndex, setCornerIndex }}>
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
