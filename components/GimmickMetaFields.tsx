import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  prefix: string;
  onPrefixChange: (text: string) => void;
  date: string;
  onDateChange: (text: string) => void;
};

/**
 * Shared editor for a gimmick routine's shared lead-in (prefix) and its
 * displayed date. Used inside the hidden per-note setup screens.
 */
export function GimmickMetaFields({
  prefix,
  onPrefixChange,
  date,
  onDateChange,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      borderColor: theme.icon,
      backgroundColor: colorScheme === "dark" ? "#1e2022" : "#fff",
    },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.icon }]}>
          Prefix (shown before every out)
        </Text>
        <TextInput
          style={inputStyle}
          value={prefix}
          onChangeText={onPrefixChange}
          placeholder="e.g. My prediction is "
          placeholderTextColor={theme.icon}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.icon }]}>
          Note date (YYYY-MM-DD)
        </Text>
        <TextInput
          style={inputStyle}
          value={date}
          onChangeText={onDateChange}
          placeholder="2025-12-01"
          placeholderTextColor={theme.icon}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
  },
});
