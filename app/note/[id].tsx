import { Colors } from "@/constants/theme";
import {
  useSecretCorner,
  type TiltIndex,
} from "@/context/SecretCornerContext";
import { deleteNote, getNote, updateNote } from "@/data/note-store";
import { setupRouteForGimmick } from "@/data/gimmick-note-factory";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Note } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useTiltDetector } from "@/hooks/use-tilt-detector";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_NEW_TITLE = "New Note";
const GHOST_TITLE_OPACITY = 0.35;

/** Normal notes: paper-style card layout. Gimmicked: show 1–4 from list-page corner taps. */
export default function NoteDetailScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const router = useRouter();
  const titleInputRef = useRef<TextInput>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleIsGhost, setTitleIsGhost] = useState(false);
  // tilt-live previews on its own screen, so it uses a local index that never
  // touches the shared (armed-routine) index.
  const [previewTiltIndex, setPreviewTiltIndex] = useState<TiltIndex>(null);
  const { cornerIndex, cornerTaps, tiltIndex, armedNoteId } = useSecretCorner();
  const isFocused = useIsFocused();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Secret Note 3 only — Secret Note 2 receives flips on Home.
  const isTiltPreviewNote = note?.gimmickType === "tilt-live";

  useTiltDetector(setPreviewTiltIndex, isFocused && isTiltPreviewNote);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const found = await getNote(String(id));
      if (found) {
        setNote(found);
        const isFreshNewNote =
          focus === "1" &&
          found.title === DEFAULT_NEW_TITLE &&
          found.content.trim() === "";

        if (isFreshNewNote) {
          setTitle("");
          setTitleIsGhost(true);
        } else {
          setTitle(found.title ?? "");
          setTitleIsGhost(false);
        }
        setContent(found.content ?? "");
      }
      setLoading(false);
    })();
  }, [id]);

  function resolveTitleForSave(currentTitle: string, ghost: boolean) {
    if (ghost && currentTitle.trim() === "") {
      return DEFAULT_NEW_TITLE;
    }
    return currentTitle;
  }

  function handleTitleChange(text: string) {
    setTitle(text);
    if (titleIsGhost) {
      setTitleIsGhost(false);
    }
  }

  function handleTitleBlur() {
    if (titleIsGhost && title.trim() === "") {
      setTitle(DEFAULT_NEW_TITLE);
      setTitleIsGhost(false);
    }
  }

  useEffect(() => {
    if (focus !== "1" || loading || !note) return;
    const timer = setTimeout(() => titleInputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [focus, loading, note]);

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

  const gimmickType = note.gimmickType ?? "corner";
  const usesCombo = gimmickType === "tilt-corner";
  const usesTilt = gimmickType === "tilt";
  const usesCardIndex = gimmickType === "card-index";

  const outs = note.gimmickConfig?.outs ?? [];
  const outPrefix = note.gimmickConfig?.outPrefix ?? "";
  // Cover shown whenever the note isn't actively revealing an out: the prefix
  // doubles as a believable disguise, falling back to "..." when empty.
  const cover = outPrefix.trim() !== "" ? outPrefix : "...";
  // A routine only reveals when it is the armed one (tilt-live is its own
  // self-contained preview and ignores the armed state entirely).
  const isArmed = armedNoteId === note.id;

  // Join prefix + out with exactly one separating space (unless the prefix
  // already ends in whitespace, or there's no prefix at all).
  const composeReveal = (out: string): string => {
    if (outPrefix === "") return out;
    return /\s$/.test(outPrefix) ? outPrefix + out : `${outPrefix} ${out}`;
  };

  const revealAt = (index: number | null): string => {
    if (index === null) return cover;
    const out = outs[index];
    return out !== undefined ? composeReveal(out) : cover;
  };

  const bodyText = (() => {
    if (!note.isGimmicked) return content;
    if (isTiltPreviewNote) {
      return revealAt(previewTiltIndex);
    }
    if (!isArmed) return cover;
    if (usesCardIndex) {
      // suit = tilt (0–3), rank = two corner taps as base-4 (first*4 + second).
      if (tiltIndex === null || cornerTaps.length < 2) {
        return cover;
      }
      const rank = cornerTaps[0] * 4 + cornerTaps[1];
      // Ranks only go 0–12 (Ace–King); the 3 spare grid cells reveal nothing.
      if (rank > 12) return cover;
      return revealAt(tiltIndex * 13 + rank);
    }
    if (usesCombo) {
      if (tiltIndex === null || cornerIndex === null) {
        return cover;
      }
      return revealAt(tiltIndex * 4 + cornerIndex);
    }
    return revealAt(usesTilt ? tiltIndex : cornerIndex);
  })();

  async function handleSave() {
    if (!note) return;
    const resolvedTitle = resolveTitleForSave(title, titleIsGhost);
    const updated = await updateNote(note.id, {
      title: resolvedTitle,
      content,
    });
    if (updated) {
      setNote(updated);
      setTitle(updated.title);
      setTitleIsGhost(false);
    }
  }

  function isBlankNote() {
    if (!note || note.isGimmicked) return false;
    if (content.trim() !== "") return false;

    const trimmedTitle = title.trim();
    // Faint placeholder, empty title, or realized default title → treat as blank
    if (titleIsGhost && trimmedTitle === "") return true;
    if (trimmedTitle === "" || trimmedTitle === DEFAULT_NEW_TITLE) return true;

    return false;
  }

  function navigateBack() {
    // After creating a gimmick note we replace history, so there may be
    // nothing to pop. Fall back to Home in that case.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  async function handleBack() {
    if (!note) {
      navigateBack();
      return;
    }
    const resolvedTitle = resolveTitleForSave(title, titleIsGhost);
    if (isBlankNote()) {
      await deleteNote(note.id);
    } else {
      await updateNote(note.id, { title: resolvedTitle, content });
    }
    navigateBack();
  }

  function handleEditPredictions() {
    if (!note?.isGimmicked) return;
    const gimmickType = note.gimmickType ?? "corner";
    router.push(setupRouteForGimmick(gimmickType, note.id) as never);
  }

  function handleDelete() {
    if (!note) return;
    Alert.alert(
      "Delete note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteNote(note.id);
            navigateBack();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: pageBg }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={theme.tint} />
          <Text style={[styles.backText, { color: theme.tint }]}>Back</Text>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleDelete}
            style={styles.deleteButton}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={22} color="#c62828" />
          </Pressable>
          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            onLongPress={note.isGimmicked ? handleEditPredictions : undefined}
            delayLongPress={500}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.paper, { backgroundColor: paperBg }]}>
          <Text style={[styles.date, { color: theme.icon }]}>{note.date}</Text>

          <TextInput
            ref={titleInputRef}
            style={[styles.titleInput, { color: theme.text }]}
            value={title}
            onChangeText={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder={titleIsGhost ? DEFAULT_NEW_TITLE : "Title"}
            placeholderTextColor={
              titleIsGhost
                ? isDark
                  ? `rgba(236, 237, 238, ${GHOST_TITLE_OPACITY})`
                  : `rgba(17, 24, 28, ${GHOST_TITLE_OPACITY})`
                : theme.icon
            }
            selection={
              titleIsGhost && title === ""
                ? { start: 0, end: 0 }
                : undefined
            }
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    padding: 6,
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
