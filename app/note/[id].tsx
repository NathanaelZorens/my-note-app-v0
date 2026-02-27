import { Colors } from "@/constants/theme";
import { predictions, useSecretCorner } from "@/context/SecretCornerContext";
import { getNote, updateNote } from "@/data/note-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Note } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Normal notes: paper-style card layout. Gimmicked: show 1–4 from list-page corner taps. */
export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { cornerIndex } = useSecretCorner();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (!id) return;
    (async () => {
      const found = await getNote(String(id));
      if (found) {
        setNote(found);
        setTitle(found.title ?? "");
        setContent(found.content ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <Text style={[styles.error, { color: theme.icon }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={["top"]}
      >
        <Text style={[styles.error, { color: theme.icon }]}>
          Note not found.
        </Text>
      </SafeAreaView>
    );
  }

  // Same paper-style template for both normal and gimmicked notes
  const isDark = colorScheme === "dark";
  const pageBg = isDark ? theme.background : "#f0f0f0";
  const paperBg = isDark ? theme.background : "#ffffff";

  const bodyText =
    note.isGimmicked && cornerIndex !== null
      ? predictions[cornerIndex]
      : content;

  async function handleSave() {
    if (!note) return;
    const updated = await updateNote(note.id, {
      title,
      content,
    });
    if (updated) {
      setNote(updated);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: pageBg }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={theme.tint} />
          <Text style={[styles.backText, { color: theme.tint }]}>Back</Text>
        </Pressable>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.paper, { backgroundColor: paperBg }]}>
          <Text style={[styles.date, { color: theme.icon }]}>{note.date}</Text>

          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.icon}
          />

          {/* For gimmicked notes, show bodyText read-only; for normal, editable TextInput */}
          {note.isGimmicked ? (
            <Text style={[styles.content, { color: theme.text }]}>
              {bodyText}
            </Text>
          ) : (
            <TextInput
              style={[styles.contentInput, { color: theme.text }]}
              value={content}
              onChangeText={setContent}
              placeholder="Start typing..."
              placeholderTextColor={theme.icon}
              multiline
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  titleInput: {
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
  contentInput: {
    fontSize: 16,
    lineHeight: 26,
    opacity: 0.9,
    textAlignVertical: "top",
  },
  error: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0a7ea4",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
