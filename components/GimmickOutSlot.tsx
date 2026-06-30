import { DrawingView } from "@/components/DrawingView";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { drawingHasContent, type Drawing, type GimmickRevealKind } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  noteId: string;
  index: number;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  revealKind: GimmickRevealKind;
  drawing?: Drawing | null;
};

/**
 * One out slot in a gimmick setup screen: a caption/text field, plus (when the
 * routine reveals drawings) a thumbnail and a button to open the drawing editor
 * for this specific out index.
 */
export function GimmickOutSlot({
  noteId,
  index,
  label,
  value,
  placeholder,
  onChangeText,
  revealKind,
  drawing,
}: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDrawing = revealKind === "drawing";
  const hasDrawing = drawingHasContent(drawing);

  function openEditor() {
    router.push(
      `/draw?noteId=${encodeURIComponent(noteId)}&out=${index}` as never,
    );
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.icon }]}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.icon,
            backgroundColor: colorScheme === "dark" ? "#1e2022" : "#fff",
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={isDrawing ? "Caption (optional)" : placeholder}
        placeholderTextColor={theme.icon}
        multiline
      />

      {isDrawing ? (
        <Pressable onPress={openEditor} style={styles.drawRow}>
          <View
            style={[
              styles.thumb,
              {
                borderColor: theme.icon,
                backgroundColor: colorScheme === "dark" ? "#11181C" : "#fff",
              },
            ]}
          >
            {hasDrawing ? (
              <DrawingView
                drawing={drawing}
                style={StyleSheet.absoluteFillObject}
              />
            ) : (
              <Ionicons name="add" size={22} color={theme.icon} />
            )}
          </View>
          <Text style={[styles.drawHint, { color: theme.tint }]}>
            {hasDrawing ? "Edit drawing" : "Add drawing"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    minHeight: 72,
    textAlignVertical: "top",
  },
  drawRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  drawHint: {
    fontSize: 15,
    fontWeight: "600",
  },
});
