import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { GimmickRevealKind } from "@/types/note";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const OPTIONS: { key: GimmickRevealKind; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "drawing", label: "Drawing" },
];

/** Segmented control choosing whether outs reveal as text or a drawing. */
export function RevealKindToggle({
  value,
  onChange,
}: {
  value: GimmickRevealKind;
  onChange: (kind: GimmickRevealKind) => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.icon }]}>Reveal as</Text>
      <View style={[styles.segment, { borderColor: theme.icon }]}>
        {OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.option,
                active && { backgroundColor: theme.tint },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: active ? "#fff" : theme.text },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
