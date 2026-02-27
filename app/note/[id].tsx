import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { predictions, useSecretCorner } from "@/context/SecretCornerContext";
import { getNoteById } from "@/data/dummy-notes";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** Normal notes: paper-style card layout. Gimmicked: show 1–4 from list-page corner taps. */
export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = id ? getNoteById(id) : undefined;
  const { cornerIndex } = useSecretCorner();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.error, { color: theme.icon }]}>
          Note not found.
        </Text>
      </View>
    );
  }

  // Same paper-style template for both normal and gimmicked notes
  const isDark = colorScheme === "dark";
  const pageBg = isDark ? theme.background : "#f0f0f0";
  const paperBg = isDark ? theme.background : "#ffffff";
  // const bodyText = note.isGimmicked
  //   ? String(cornerValue ?? '—')
  //   : note.content;

  const bodyText =
    note.isGimmicked && cornerIndex !== null
      ? predictions[cornerIndex]
      : note.content;

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.paper, { backgroundColor: paperBg }]}>
          <Text style={[styles.date, { color: theme.icon }]}>{note.date}</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {note.title}
          </Text>
          <Text style={[styles.content, { color: theme.text }]}>
            {bodyText}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  paper: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    // Subtle elevation so the note reads as a surface (adjust for dark mode in theme if needed)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  date: {
    fontSize: 13,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14,
    lineHeight: 28,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    opacity: 0.9,
  },
  error: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
