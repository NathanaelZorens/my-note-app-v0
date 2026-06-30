import { DrawingCanvas } from "@/components/DrawingCanvas";
import { Colors } from "@/constants/theme";
import { getNote, updateNote } from "@/data/note-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Drawing } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMPTY: Drawing = { strokes: [] };
const PALETTE = ["#11181C", "#0a7ea4", "#c62828", "#2e7d32", "#f9a825"];

/**
 * Full-screen drawing editor. Reachable from a normal note (edits `note.drawing`)
 * or from a gimmick setup screen with `?out=<index>` (edits one drawingOut).
 */
export default function DrawScreen() {
  const { noteId, out } = useLocalSearchParams<{
    noteId?: string;
    out?: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const outIndex = out !== undefined ? Number(out) : null;
  const isOut = outIndex !== null && Number.isInteger(outIndex) && outIndex >= 0;

  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState<Drawing>(EMPTY);
  const [color, setColor] = useState(PALETTE[0]);

  useEffect(() => {
    if (!noteId) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const note = await getNote(noteId);
      if (!active) return;
      const existing = isOut
        ? note?.gimmickConfig?.drawingOuts?.[outIndex as number]
        : note?.drawing;
      setDrawing(existing ?? EMPTY);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [noteId, isOut, outIndex]);

  function undo() {
    setDrawing((prev) => ({ strokes: prev.strokes.slice(0, -1) }));
  }

  function clear() {
    setDrawing(EMPTY);
  }

  async function handleDone() {
    if (!noteId) {
      router.back();
      return;
    }
    const note = await getNote(noteId);
    if (!note) {
      router.back();
      return;
    }
    if (isOut) {
      const config = note.gimmickConfig ?? { outs: [] };
      const length = Math.max(
        config.outs?.length ?? 0,
        (outIndex as number) + 1,
        config.drawingOuts?.length ?? 0,
      );
      const next: (Drawing | null)[] = Array.from(
        { length },
        (_, i) => config.drawingOuts?.[i] ?? null,
      );
      next[outIndex as number] = drawing;
      await updateNote(note.id, {
        gimmickConfig: { ...config, drawingOuts: next },
      });
    } else {
      await updateNote(note.id, { drawing });
    }
    router.back();
  }

  if (loading) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {isOut ? `Drawing — out ${(outIndex as number) + 1}` : "Drawing"}
        </Text>
        <Pressable onPress={handleDone} style={styles.doneBtn} hitSlop={8}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.palette}>
          {PALETTE.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && styles.swatchActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.toolButtons}>
          <Pressable onPress={undo} style={styles.toolBtn} hitSlop={6}>
            <Ionicons name="arrow-undo" size={20} color={theme.text} />
          </Pressable>
          <Pressable onPress={clear} style={styles.toolBtn} hitSlop={6}>
            <Ionicons name="trash-outline" size={20} color="#c62828" />
          </Pressable>
        </View>
      </View>

      <DrawingCanvas
        value={drawing}
        onChange={setDrawing}
        color={color}
        style={[
          styles.canvas,
          { backgroundColor: colorScheme === "dark" ? "#11181C" : "#fff" },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 60,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  doneBtn: {
    width: 60,
    alignItems: "flex-end",
  },
  doneText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a7ea4",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  palette: {
    flexDirection: "row",
    gap: 10,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: "#888",
  },
  toolButtons: {
    flexDirection: "row",
    gap: 16,
  },
  toolBtn: {
    padding: 4,
  },
  canvas: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
});
