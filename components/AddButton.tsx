// components/AddButton.tsx
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type AddButtonProps = {
  onPress: () => void;
};

export function AddButton({ onPress }: AddButtonProps) {
  return (
    <Pressable style={styles.addButton} onPress={onPress}>
      <Text style={styles.addButtonText}>+ Add</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0a7ea4",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
